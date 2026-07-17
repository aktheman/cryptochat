import os, json, base64, secrets, hashlib, time
from datetime import datetime, timedelta
from pathlib import Path
from functools import wraps

from flask import (
    Flask, render_template, request, jsonify, session,
    redirect, url_for, send_from_directory, Response
)
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import x25519
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag
import pyotp

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', os.urandom(32))
app.config.update(
    SESSION_TIMEOUT_MINUTES=30,
    MAX_CONTENT_LENGTH=50 * 1024 * 1024,
    UPLOAD_FOLDER=os.path.join(os.path.dirname(__file__), 'data/uploads'),
    ALLOWED_EXTENSIONS={'png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf', 'txt', 'zip'}
)
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / 'data'
DATA_DIR.mkdir(exist_ok=True)
(DATA_DIR / 'uploads').mkdir(exist_ok=True)

USERS_FILE = DATA_DIR / 'users.json'
MESSAGES_FILE = DATA_DIR / 'messages.json'
KEYS_FILE = DATA_DIR / 'keys.json'
GROUPS_FILE = DATA_DIR / 'groups.json'
NOTIFICATIONS_FILE = DATA_DIR / 'notifications.json'
USER_PRESENCE_FILE = DATA_DIR / 'presence.json'
READ_RECEIPTS_FILE = DATA_DIR / 'read_receipts.json'
SESSIONS_FILE = DATA_DIR / 'sessions.json'

# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────
def load_json(path, default):
    if not path.exists():
        return default
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return default

def save_json(path, obj):
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding='utf-8')

def now_iso():
    return datetime.utcnow().isoformat() + 'Z'

def fpair(a, b):
    return tuple(sorted([a, b]))

def pair_key(a, b):
    return f"{fpair(a, b)[0]}:::{fpair(a, b)[1]}"

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def convert_to_bool(val, default=False):
    if isinstance(val, bool):
        return val
    if isinstance(val, str):
        return val.lower() in ["true", "1", "yes", "on"]
    return default

def touch_presence(username):
    presence = load_json(USER_PRESENCE_FILE, {})
    presence[username] = now_iso()
    save_json(USER_PRESENCE_FILE, presence)

def parse_iso(dt):
    if not dt:
        return None
    try:
        return datetime.fromisoformat(dt.replace('Z', '+00:00'))
    except Exception:
        return None

def is_online(username, timeout_minutes=5):
    presence = load_json(USER_PRESENCE_FILE, {})
    last = parse_iso(presence.get(username))
    if not last:
        return False
    return (datetime.utcnow() - last) < timedelta(minutes=timeout_minutes)

def is_user_session_active(username):
    sessions = load_json(SESSIONS_FILE, {})
    session_token = sessions.get(username, {})
    if not session_token.get('token') or not session_token.get('active', False):
        return False
    if convert_to_bool(session_token.get('revoked', False), False):
        return False
    created = parse_iso(session_token.get('created'))
    if not created:
        return False
    if created.tzinfo:
        created = created.replace(tzinfo=None)
    return (datetime.utcnow() - created) < timedelta(minutes=app.config['SESSION_TIMEOUT_MINUTES'])

def invalidate_all_sessions(username):
    sessions = load_json(SESSIONS_FILE, {})
    if username in sessions:
        sessions[username]['active'] = False
        sessions[username]['revoked'] = True
        save_json(SESSIONS_FILE, sessions)

def get_user(username):
    return load_json(USERS_FILE, {}).get(username)

def require_login(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        username = session.get('username')
        if not username or not is_user_session_active(username):
            session.clear()
            if request.accept_mimetypes.accept_json:
                return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
            return redirect(url_for('login_page'))
        return f(*args, **kwargs)
    return wrapper

# ──────────────────────────────────────────────
# X25519 + HKDF-SHA-256 for forward secrecy
# ──────────────────────────────────────────────
def generate_identity_keypair():
    private_key = x25519.X25519PrivateKey.generate()
    public_key = private_key.public_key()
    priv_bytes = private_key.private_bytes_raw()
    pub_bytes = public_key.public_bytes_raw()
    return {
        'private': base64.urlsafe_b64encode(priv_bytes).decode(),
        'public': base64.urlsafe_b64encode(pub_bytes).decode(),
    }

def derive_shared_keycurve25519(my_priv_b64, their_pub_b64):
    my_priv = x25519.X25519PrivateKey.from_private_bytes(base64.urlsafe_b64decode(my_priv_b64))
    their_pub = x25519.X25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(their_pub_b64))
    shared = my_priv.exchange(their_pub)
    derived = HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=b'cryptochat-v1').derive(shared)
    return derived

def get_user_public_key(username):
    return get_user(username or '') or {}

def get_user_private_key(username):
    return get_user(username or '') or {}

def compute_pair_conversation_key(username_a, username_b):
    user_a = get_user(username_a)
    user_b = get_user(username_b)
    if not user_a or not user_b:
        raise ValueError("Manglende brukernøkler")
    priv = user_a.get('identity_private_key')
    pub = user_b.get('identity_public_key')
    if not priv or not pub:
        raise ValueError("Manglende identity-nøkler")
    return derive_shared_keycurve25519(priv, pub)

def encrypt_symmetric(plaintext, key_b64):
    key = base64.b64decode(key_b64)
    aes = AESGCM(key)
    nonce = secrets.token_bytes(12)
    ct = aes.encrypt(nonce, plaintext.encode(), None)
    packed = json.dumps({'n': base64.b64encode(nonce).decode(), 'c': base64.b64encode(ct).decode()}).encode()
    return base64.b64encode(packed).decode()

def decrypt_symmetric(packed, key_b64):
    key = base64.b64decode(key_b64)
    outer = json.loads(base64.b64decode(packed).decode())
    aes = AESGCM(key)
    return aes.decrypt(base64.b64decode(outer['n']), base64.b64decode(outer['c']), None).decode()

def get_or_create_pair_key(username_a, username_b):
    keys = load_json(KEYS_FILE, {})
    pk = pair_key(username_a, username_b)
    if pk not in keys:
        new_key = AESGCM.generate_key(bit_length=256)
        keys[pk] = {
            'key': secrets.token_bytes(32).hex(),
            'key_b64': base64.b64encode(new_key).decode(),
            'created': now_iso(),
        }
        save_json(KEYS_FILE, keys)
    return keys[pk]['key_b64']

def get_or_create_group_key(group_id):
    keys = load_json(KEYS_FILE, {})
    if group_id not in keys:
        new_key = AESGCM.generate_key(bit_length=256)
        keys[group_id] = {
            'key': secrets.token_bytes(32).hex(),
            'key_b64': base64.b64encode(new_key).decode(),
            'created': now_iso(),
        }
        save_json(KEYS_FILE, keys)
    return keys[group_id]['key_b64']

# ──────────────────────────────────────────────
# Pages
# ──────────────────────────────────────────────
@app.route('/')
def index():
    if 'username' not in session:
        return redirect(url_for('login_page'))
    return redirect(url_for('chat_page'))

@app.route('/login')
def login_page():
    if 'username' in session:
        return redirect(url_for('chat_page'))
    return render_template('login.html')

@app.route('/chat')
def chat_page():
    if 'username' not in session:
        return redirect(url_for('login_page'))
    return render_template('chat.html', username=session.get('username'))

# ──────────────────────────────────────────────
# Auth
# ──────────────────────────────────────────────
@app.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json(force=True, silent=True) or {}
    username = (data.get('username') or '').strip().lower()
    password = data.get('password') or ''
    if not username or not password:
        return jsonify({'success': False, 'message': 'Brukernavn og passord er påkrevd.'}), 400
    if len(username) < 3:
        return jsonify({'success': False, 'message': 'Brukernavn må være minst 3 tegn.'}), 400
    if len(password) < 6:
        return jsonify({'success': False, 'message': 'Passordet må være minst 6 tegn.'}), 400
    users = load_json(USERS_FILE, {})
    if username in users:
        return jsonify({'success': False, 'message': 'Brukernavnet er opptatt.'}), 400
    users[username] = {
        'password_hash': generate_password_hash(password),
        'created_at': now_iso(),
        'theme': 'dark',
        'twofa_enabled': False,
        'twofa_secret_hash': None,
        'twofa_plain_secret': None,
        'identity_keypair': generate_identity_keypair(),
        'notifications_enabled': True,
    }
    save_json(USERS_FILE, users)
    session['username'] = username
    sessions = load_json(SESSIONS_FILE, {})
    sessions[username] = {
        'token': secrets.token_hex(32),
        'created': now_iso(),
        'active': True,
        'revoked': False,
    }
    save_json(SESSIONS_FILE, sessions)
    touch_presence(username)
    return jsonify({'success': True})

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json(force=True, silent=True) or {}
    username = (data.get('username') or '').strip().lower()
    password = data.get('password') or ''
    twofa_code = (data.get('twofa_code') or '').strip()
    if not username or not password:
        return jsonify({'success': False, 'message': 'Brukernavn og passord er påkrevd.'}), 400
    users = load_json(USERS_FILE, {})
    user = users.get(username)
    if not user or not check_password_hash(user.get('password_hash', ''), password):
        return jsonify({'success': False, 'message': 'Ugyldig brukernavn eller passord.'}), 401
    if user.get('twofa_enabled') and user.get('twofa_secret_hash'):
        totp = pyotp.TOTP(user['twofa_secret_hash'])
        if not totp.verify(twofa_code):
            return jsonify({'success': False, 'message': 'Ugyldig 2FA-kode.'}), 401
    session['username'] = username
    sessions = load_json(SESSIONS_FILE, {})
    sessions[username] = {
        'token': secrets.token_hex(32),
        'created': now_iso(),
        'active': True,
        'revoked': False,
    }
    save_json(SESSIONS_FILE, sessions)
    touch_presence(username)
    return jsonify({'success': True})

@app.route('/auth/logout', methods=['POST'])
def logout():
    username = session.get('username')
    if username:
        invalidate_all_sessions(username)
    session.clear()
    return jsonify({'success': True})

@app.route('/auth/2fa/enable', methods=['POST'])
def enable_2fa():
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(name=username, issuer_name='CryptoChat')
    users = load_json(USERS_FILE, {})
    users[username]['twofa_secret_hash'] = secret
    users[username]['twofa_plain_secret'] = secret
    users[username]['twofa_enabled'] = True
    save_json(USERS_FILE, users)
    return jsonify({'success': True, 'secret': secret, 'uri': uri})

@app.route('/auth/2fa/disable', methods=['POST'])
def disable_2fa():
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    users = load_json(USERS_FILE, {})
    users[username]['twofa_enabled'] = False
    users[username]['twofa_secret_hash'] = None
    users[username]['twofa_plain_secret'] = None
    save_json(USERS_FILE, users)
    return jsonify({'success': True})

# ──────────────────────────────────────────────
# Presence
# ──────────────────────────────────────────────
@app.route('/presence/batch', methods=['POST'])
def presence_batch():
    data = request.get_json(force=True, silent=True) or {}
    users = data.get('users', [])
    result = []
    for u in users:
        result.append({'username': u, 'online': is_online(u, timeout_minutes=5), 'lastSeen': load_json(USER_PRESENCE_FILE, {}).get(u)})
    return jsonify({'success': True, 'presence': result})

# ──────────────────────────────────────────────
# Public key identity
# ──────────────────────────────────────────────
@app.route('/key/publish', methods=['POST'])
def publish_public_key():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    data = request.get_json(force=True, silent=True) or {}
    public_key = (data.get('publicKeyPem') or '').strip()
    if not public_key:
        return jsonify({'success': False, 'message': 'Manglende offentlig nøkkel.'}), 400
    users = load_json(USERS_FILE, {})
    if session['username'] in users:
        users[session['username']]['identity_public_key'] = public_key
        save_json(USERS_FILE, users)
    return jsonify({'success': True})

# ──────────────────────────────────────────────
# Theme & settings
# ──────────────────────────────────────────────
@app.route('/theme', methods=['GET'])
def get_theme():
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    users = load_json(USERS_FILE, {})
    theme = users.get(username, {}).get('theme', 'dark')
    return jsonify({'success': True, 'theme': theme})

@app.route('/theme', methods=['POST'])
def set_theme():
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    theme = request.json.get('theme', 'dark')
    users = load_json(USERS_FILE, {})
    users[username]['theme'] = theme
    save_json(USERS_FILE, users)
    return jsonify({'success': True})

@app.route('/settings/notifications', methods=['POST'])
def settings_notifications():
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    enabled = convert_to_bool(request.json.get('enabled', True), True)
    users = load_json(USERS_FILE, {})
    users[username]['notifications_enabled'] = enabled
    save_json(USERS_FILE, users)
    return jsonify({'success': True})

# ──────────────────────────────────────────────
# Users
# ──────────────────────────────────────────────
@app.route('/users', methods=['GET'])
def list_users():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    users = load_json(USERS_FILE, {})
    other_users = []
    for u in users:
        if u == session['username']:
            continue
        entry = {'username': u}
        pub = users[u].get('identity_public_key')
        if pub:
            entry['publicKey'] = pub
        other_users.append(entry)
    return jsonify({'success': True, 'users': other_users})

@app.route('/keys/<username>', methods=['GET'])
def get_user_key_endpoint(username):
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    user = get_user(username)
    if not user:
        return jsonify({'success': False, 'message': 'Bruker ikke funnet.'}), 404
    return jsonify({'success': True, 'username': username, 'publicKey': user.get('identity_public_key')})

# ──────────────────────────────────────────────
# Messages 1:1
# ──────────────────────────────────────────────
@app.route('/messages/<other_user>', methods=['GET'])
def get_messages(other_user):
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    me = session['username']
    pk = pair_key(me, other_user)
    messages = load_json(MESSAGES_FILE, [])
    filtered = []
    for m in messages:
        if m.get('pair_key') != pk:
            continue
        if m.get('type') == 'file':
            text = m.get('filename') or '[fil]'
        else:
            text = m.get('ciphertext') or '[melding]'
        filtered.append({
            'id': m.get('id'),
            'sender': m['sender'],
            'recipient': m['recipient'],
            'text': text,
            'type': m.get('type'),
            'timestamp': m['timestamp'],
            'self_destruct_at': m.get('self_destruct_at'),
            'filename': m.get('filename'),
            'read': convert_to_bool(m.get('read'), False),
        })
    filtered.sort(key=lambda x: x['timestamp'])
    return jsonify({'success': True, 'messages': filtered, 'pair_key': pk})

@app.route('/send', methods=['POST'])
def send_message():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    data = request.get_json(force=True, silent=True) or {}
    recipient = (data.get('recipient') or '').strip()
    ciphertext = (data.get('ciphertext') or '').strip()
    mtype = data.get('type', 'text')
    filename = data.get('filename')
    self_destruct_minutes = data.get('self_destruct_minutes')
    if not recipient or not ciphertext:
        return jsonify({'success': False, 'message': 'Manglende felt.'}), 400
    shared_key = get_or_create_pair_key(session['username'], recipient)
    pk = pair_key(session['username'], recipient)
    messages = load_json(MESSAGES_FILE, [])
    self_destruct_at = None
    if self_destruct_minutes and str(self_destruct_minutes).isdigit():
        minutes = int(self_destruct_minutes)
        if minutes > 0:
            self_destruct_at = (datetime.utcnow() + timedelta(minutes=minutes)).isoformat()
    messages.append({
        'id': hashlib.sha256(f"{ciphertext}{datetime.utcnow().isoformat()}{session['username']}{recipient}".encode()).hexdigest(),
        'pair_key': pk,
        'sender': session['username'],
        'recipient': recipient,
        'ciphertext': ciphertext,
        'type': mtype,
        'timestamp': datetime.utcnow().isoformat(),
        'read': False,
        'self_destruct_at': self_destruct_at,
        'filename': filename,
    })
    save_json(MESSAGES_FILE, messages)
    return jsonify({'success': True, 'message': 'Melding sendt.'})

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    file = request.files.get('file')
    recipient = (request.form.get('recipient') or '').strip()
    if not file or not recipient:
        return jsonify({'success': False, 'message': 'Manglende fil eller mottaker.'}), 400
    if not allowed_file(file.filename):
        return jsonify({'success': False, 'message': 'Ugyldig filtype.'}), 400
    filename = secure_filename(file.filename)
    target = os.path.join(app.config['UPLOAD_FOLDER'], f"{time.time()}_{filename}")
    file.save(target)
    with open(target, 'rb') as fh:
        file_bytes = fh.read()
    file_b64 = base64.b64encode(file_bytes).decode()
    shared_key = get_or_create_pair_key(session['username'], recipient)
    pk = pair_key(session['username'], recipient)
    messages = load_json(MESSAGES_FILE, [])
    messages.append({
        'id': hashlib.sha256(f"{file_b64}{datetime.utcnow().isoformat()}{session['username']}{recipient}".encode()).hexdigest(),
        'pair_key': pk,
        'sender': session['username'],
        'recipient': recipient,
        'ciphertext': file_b64,
        'type': 'file',
        'timestamp': datetime.utcnow().isoformat(),
        'read': False,
        'self_destruct_at': None,
        'filename': filename,
    })
    save_json(MESSAGES_FILE, messages)
    return jsonify({'success': True, 'filename': filename})

@app.route('/search', methods=['GET'])
def search_messages():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    query = (request.args.get('q') or '').strip()
    partner = (request.args.get('partner') or '').strip()
    if not query or not partner:
        return jsonify({'success': True, 'messages': []})
    pk = pair_key(session['username'], partner)
    shared_key = get_or_create_pair_key(session['username'], partner)
    messages = load_json(MESSAGES_FILE, [])
    results = []
    for m in messages:
        if m.get('pair_key') != pk:
            continue
        try:
            text = decrypt_symmetric(m['ciphertext'], shared_key) if m.get('type') == 'text' else m.get('filename', '')
            if query.lower() in text.lower():
                results.append({
                    'id': m.get('id'),
                    'sender': m['sender'],
                    'recipient': m['recipient'],
                    'text': text,
                    'type': m.get('type'),
                    'timestamp': m['timestamp'],
                    'filename': m.get('filename'),
                })
        except Exception:
            continue
    results.sort(key=lambda x: x['timestamp'])
    return jsonify({'success': True, 'messages': results})

@app.route('/read_receipts/<partner>', methods=['POST'])
def mark_read(partner):
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    me = session['username']
    pk = pair_key(me, partner)
    messages = load_json(MESSAGES_FILE, [])
    updated = 0
    receipts = load_json(READ_RECEIPTS_FILE, {})
    now = now_iso()
    for m in messages:
        if m.get('pair_key') == pk and m.get('recipient') == me:
            if not convert_to_bool(m.get('read'), False):
                m['read'] = True
                updated += 1
    if updated:
        save_json(MESSAGES_FILE, messages)
    receipts.setdefault(me, {})[partner] = now
    save_json(READ_RECEIPTS_FILE, receipts)
    return jsonify({'success': True, 'updated': updated, 'lastReadAt': now})

@app.route('/notifications', methods=['GET'])
def get_notifications():
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    notify = load_json(NOTIFICATIONS_FILE, {})
    entries = notify.get(username, [])
    return jsonify({'success': True, 'notifications': entries})

# ──────────────────────────────────────────────
# Groups
# ──────────────────────────────────────────────
@app.route('/groups', methods=['GET'])
def list_groups():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    groups = load_json(GROUPS_FILE, [])
    my_groups = [g for g in groups if session['username'] in g.get('members', [])]
    return jsonify({'success': True, 'groups': my_groups})

@app.route('/groups', methods=['POST'])
def create_group():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    data = request.get_json(force=True, silent=True) or {}
    name = (data.get('name') or '').strip()
    members = data.get('members') or []
    if not name:
        return jsonify({'success': False, 'message': 'Gruppenavn er påkrevd.'}), 400
    members = list(set([m for m in members if m != session['username']]))
    groups = load_json(GROUPS_FILE, [])
    group_id = hashlib.sha256(f"{name}{datetime.utcnow().isoformat()}{session['username']}".encode()).hexdigest()[:16]
    group = {
        'id': group_id,
        'name': name,
        'members': [session['username']] + members,
        'created': now_iso(),
        'created_by': session['username'],
    }
    get_or_create_group_key(group_id)
    groups.append(group)
    save_json(GROUPS_FILE, groups)
    return jsonify({'success': True, 'group': group})

@app.route('/groups/<group_id>/messages', methods=['GET'])
def get_group_messages(group_id):
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    messages = load_json(MESSAGES_FILE, [])
    group_key = get_or_create_group_key(group_id)
    filtered = []
    for m in messages:
        if m.get('group_id') != group_id:
            continue
        try:
            text = decrypt_symmetric(m['ciphertext'], group_key) if m.get('type') == 'text' else m.get('filename', '[fil]')
            filtered.append({
                'id': m.get('id'),
                'sender': m['sender'],
                'text': text,
                'type': m.get('type'),
                'timestamp': m['timestamp'],
                'filename': m.get('filename'),
            })
        except Exception as e:
            filtered.append({
                'id': m.get('id'),
                'sender': m['sender'],
                'text': f'[Dekrypteringsfeil: {str(e)}]',
                'type': m.get('type', 'text'),
                'timestamp': m['timestamp'],
                'filename': m.get('filename'),
            })
    filtered.sort(key=lambda x: x['timestamp'])
    return jsonify({'success': True, 'messages': filtered})

@app.route('/groups/<group_id>/send', methods=['POST'])
def send_group_message(group_id):
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    data = request.get_json(force=True, silent=True) or {}
    ciphertext = (data.get('ciphertext') or '').strip()
    mtype = data.get('type', 'text')
    filename = data.get('filename')
    if not ciphertext:
        return jsonify({'success': False, 'message': 'Manglende innhold.'}), 400
    groups = load_json(GROUPS_FILE, [])
    group = next((g for g in groups if g['id'] == group_id), None)
    if not group or session['username'] not in group.get('members', []):
        return jsonify({'success': False, 'message': 'Ingen tilgang til gruppen.'}), 403
    group_key = get_or_create_group_key(group_id)
    messages = load_json(MESSAGES_FILE, [])
    messages.append({
        'id': hashlib.sha256(f"{ciphertext}{ group_id }{datetime.utcnow().isoformat()}{session['username']}".encode()).hexdigest(),
        'group_id': group_id,
        'sender': session['username'],
        'ciphertext': ciphertext,
        'type': mtype,
        'timestamp': datetime.utcnow().isoformat(),
        'filename': filename,
    })
    save_json(MESSAGES_FILE, messages)
    return jsonify({'success': True, 'message': 'Melding sendt.'})

# ──────────────────────────────────────────────
# Key export/import
# ──────────────────────────────────────────────
@app.route('/key/export')
def export_key():
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    data = request.args.get('data') or ''
    key = base64.urlsafe_b64encode(base64.b64decode(data)).decode() if data else ''
    return jsonify({'success': True, 'key': key})

@app.route('/key/import', methods=['POST'])
def import_key():
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    key = (request.json.get('key') or '').strip()
    if not key:
        return jsonify({'success': False, 'message': 'Manglende nøkkel.'}), 400
    users = load_json(USERS_FILE, {})
    users[username]['imported_key'] = key
    save_json(USERS_FILE, users)
    return jsonify({'success': True, 'key': key})

# ──────────────────────────────────────────────
# Offline / SW / PWA
# ──────────────────────────────────────────────
@app.route('/manifest.json')
def manifest_json():
    return jsonify({
        'name': 'CryptoChat',
        'short_name': 'Chat',
        'start_url': '/',
        'display': 'standalone',
        'background_color': '#0b0c12',
        'theme_color': '#cf6fef',
        'icons': [
            {'src': '/static/img/icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
            {'src': '/static/img/icon-512.png', 'sizes': '512x512', 'type': 'image/png'}
        ]
    })

@app.route('/sw.js')
def service_worker():
    sw = "const CACHE='cryptochat-v1';const ASSETS=['/','/static/css/style.css','/static/js/chat.js','/static/js/crypto.js','/manifest.json'];self.addEventListener('install',(e)=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting();});self.addEventListener('activate',(e)=>{e.waitUntil(self.clients.claim());});self.addEventListener('fetch',(event)=>{event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));});"
    return Response(sw, mimetype='application/javascript')

@app.route('/offline.html')
def offline_page():
    return render_template('offline.html')

@app.route('/sw-test')
def service_worker_test():
    return jsonify({'success': True})

@app.route('/uploads/<path:filename>')
@require_login
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=False)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
