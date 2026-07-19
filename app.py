import os, json, base64, secrets, hashlib, time, re, collections
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
from db import load_json, save_json, init_db, migrate_json_files

app = Flask(__name__)
secret_key_path = Path(os.environ.get('SECRET_KEY_FILE', '')) if os.environ.get('SECRET_KEY_FILE') else None
if secret_key_path and secret_key_path.exists():
    app.secret_key = secret_key_path.read_bytes()
elif Path('secrets/secret_key').exists():
    app.secret_key = Path('secrets/secret_key').read_bytes()
else:
    app.secret_key = secret_key_path or os.environ.get('SECRET_KEY')
    if not app.secret_key:
        raise SystemExit('SECRET_KEY eller SECRET_KEY_FILE må settes i produksjon')
app.config.update(
    SESSION_TIMEOUT_MINUTES=30,
    SESSION_COOKIE_SECURE=bool(os.environ.get('SESSION_COOKIE_SECURE', 'false').lower() in ('true', '1', 'yes')),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    PERMANENT_SESSION_LIFETIME=timedelta(minutes=30),
)
app.config.update(
    MAX_CONTENT_LENGTH=50 * 1024 * 1024,
    UPLOAD_FOLDER=os.path.join(os.path.dirname(__file__), 'data/uploads'),
    ALLOWED_EXTENSIONS={'png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf', 'txt', 'zip', 'mp3', 'wav', 'ogg', 'webm', 'opus', 'm4a'}
)
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
init_db()
migrate_json_files()

@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'camera=(self), microphone=(self), geolocation=()'
    if request.path.startswith('/static/'):
        response.headers['Cache-Control'] = 'public, max-age=604800'
    else:
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate'
    return response

RATE_LIMIT_STORE = collections.defaultdict(list)

def rate_limit(max_requests=30, window_seconds=60):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            username = session.get('username') or request.remote_addr
            key = f"{f.__name__}:{username}"
            now = time.time()
            RATE_LIMIT_STORE[key] = [t for t in RATE_LIMIT_STORE[key] if now - t < window_seconds]
            if len(RATE_LIMIT_STORE[key]) >= max_requests:
                return jsonify({'success': False, 'message': 'For mange forespørsler. Vent litt.'}), 429
            RATE_LIMIT_STORE[key].append(now)
            return f(*args, **kwargs)
        return wrapper
    return decorator

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
REACTIONS_FILE = DATA_DIR / 'reactions.json'
TYPING_FILE = DATA_DIR / 'typing.json'
VERIFICATION_FILE = DATA_DIR / 'verification.json'
CALLS_FILE = DATA_DIR / 'calls.json'

# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────
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
    user_sessions = sessions.get(username, {})
    if isinstance(user_sessions, dict) and 'token' in user_sessions:
        if not user_sessions.get('active', False):
            return False
        if convert_to_bool(user_sessions.get('revoked', False), False):
            return False
        created = parse_iso(user_sessions.get('created'))
        if not created:
            return False
        if created.tzinfo:
            created = created.replace(tzinfo=None)
        return (datetime.utcnow() - created) < timedelta(minutes=app.config['SESSION_TIMEOUT_MINUTES'])
    if isinstance(user_sessions, dict):
        for sid, sdata in user_sessions.items():
            if not isinstance(sdata, dict):
                continue
            if sdata.get('token') == session.get('session_token') and sdata.get('active', False):
                if convert_to_bool(sdata.get('revoked', False), False):
                    return False
                created = parse_iso(sdata.get('created'))
                if not created:
                    return False
                if created.tzinfo:
                    created = created.replace(tzinfo=None)
                return (datetime.utcnow() - created) < timedelta(minutes=app.config['SESSION_TIMEOUT_MINUTES'])
    return False

def invalidate_all_sessions(username):
    sessions = load_json(SESSIONS_FILE, {})
    if username in sessions:
        user_sessions = sessions[username]
        if isinstance(user_sessions, dict) and 'token' in user_sessions:
            sessions[username] = {}
        elif isinstance(user_sessions, dict):
            for sid in user_sessions:
                if isinstance(user_sessions[sid], dict):
                    user_sessions[sid]['active'] = False
                    user_sessions[sid]['revoked'] = True
        save_json(SESSIONS_FILE, sessions)

def invalidate_session(username, session_id):
    sessions = load_json(SESSIONS_FILE, {})
    user_sessions = sessions.get(username, {})
    if session_id in user_sessions and isinstance(user_sessions[session_id], dict):
        user_sessions[session_id]['active'] = False
        user_sessions[session_id]['revoked'] = True
        save_json(SESSIONS_FILE, sessions)

def get_user_sessions(username):
    sessions = load_json(SESSIONS_FILE, {})
    user_sessions = sessions.get(username, {})
    if isinstance(user_sessions, dict) and 'token' in user_sessions:
        return [{'id': 'default', 'created': user_sessions.get('created'), 'active': user_sessions.get('active', False)}]
    result = []
    now = datetime.utcnow()
    for sid, sdata in user_sessions.items():
        if not isinstance(sdata, dict):
            continue
        created = parse_iso(sdata.get('created'))
        if created and created.tzinfo:
            created = created.replace(tzinfo=None)
        active = sdata.get('active', False) and not convert_to_bool(sdata.get('revoked', False), False)
        if created and (now - created) > timedelta(minutes=app.config['SESSION_TIMEOUT_MINUTES']):
            active = False
        result.append({
            'id': sid,
            'created': sdata.get('created'),
            'active': active,
            'device': sdata.get('device', 'Unknown'),
            'ip': sdata.get('ip', ''),
        })
    return result

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

def sanitize_input(text, max_length=5000):
    if not isinstance(text, str):
        return ''
    return text.strip()[:max_length]

def validate_username(username):
    if not username or not isinstance(username, str):
        return False
    return bool(re.match(r'^[a-z0-9_]{3,30}$', username.strip().lower()))

def validate_password(password):
    if not password or not isinstance(password, str):
        return False
    return len(password) >= 6 and len(password) <= 128

def is_admin(username):
    user = get_user(username)
    return user and user.get('is_admin', False)

def require_admin(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        username = session.get('username')
        if not username or not is_user_session_active(username):
            session.clear()
            return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
        if not is_admin(username):
            return jsonify({'success': False, 'message': 'Ingen admin-tilgang.'}), 403
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
    return render_template('chat.html',
        username=session.get('username'),
        turn_url=os.environ.get('TURN_URL', ''),
        turn_user=os.environ.get('TURN_USER', ''),
        turn_pass=os.environ.get('TURN_PASS', ''),
    )

# ──────────────────────────────────────────────
# Auth
# ──────────────────────────────────────────────
@app.route('/auth/register', methods=['POST'])
@rate_limit(max_requests=5, window_seconds=300)
def register():
    data = request.get_json(force=True, silent=True) or {}
    username = (data.get('username') or '').strip().lower()
    password = data.get('password') or ''
    if not username or not password:
        return jsonify({'success': False, 'message': 'Brukernavn og passord er påkrevd.'}), 400
    if not validate_username(username):
        return jsonify({'success': False, 'message': 'Brukernavn kan bare inneholde bokstaver, tall og understreker (3-30 tegn).'}), 400
    if not validate_password(password):
        return jsonify({'success': False, 'message': 'Passordet må være mellom 6 og 128 tegn.'}), 400
    users = load_json(USERS_FILE, {})
    if username in users:
        return jsonify({'success': False, 'message': 'Brukernavnet er opptatt.'}), 400
    users[username] = {
        'password_hash': generate_password_hash(password),
        'created_at': now_iso(),
        'theme': 'dark',
        'is_admin': False,
        'twofa_enabled': False,
        'twofa_secret_hash': None,
        'identity_keypair': generate_identity_keypair(),
        'notifications_enabled': True,
    }
    save_json(USERS_FILE, users)
    session['username'] = username
    session_id = secrets.token_hex(16)
    session['session_token'] = session_id
    sessions = load_json(SESSIONS_FILE, {})
    sessions.setdefault(username, {})[session_id] = {
        'token': session_id,
        'created': now_iso(),
        'active': True,
        'revoked': False,
        'device': request.user_agent.string[:100] if request.user_agent else 'Unknown',
        'ip': request.remote_addr or '',
    }
    save_json(SESSIONS_FILE, sessions)
    touch_presence(username)
    return jsonify({'success': True})

@app.route('/auth/login', methods=['POST'])
@rate_limit(max_requests=10, window_seconds=120)
def login():
    data = request.get_json(force=True, silent=True) or {}
    username = (data.get('username') or '').strip().lower()
    password = data.get('password') or ''
    twofa_code = (data.get('twofa_code') or '').strip()
    if not username or not password:
        return jsonify({'success': False, 'message': 'Brukernavn og passord er påkrevd.'}), 400
    if not validate_password(password):
        return jsonify({'success': False, 'message': 'Passordet må være mellom 6 og 128 tegn.'}), 400
    users = load_json(USERS_FILE, {})
    user = users.get(username)
    if not user or not check_password_hash(user.get('password_hash', ''), password):
        return jsonify({'success': False, 'message': 'Ugyldig brukernavn eller passord.'}), 401
    if user.get('banned'):
        return jsonify({'success': False, 'message': 'Kontoen din er utestengt.'}), 403
    if user.get('twofa_enabled') and user.get('twofa_secret_hash'):
        totp = pyotp.TOTP(user['twofa_secret_hash'])
        if not totp.verify(twofa_code):
            return jsonify({'success': False, 'message': 'Ugyldig 2FA-kode.'}), 401
    session['username'] = username
    session_id = secrets.token_hex(16)
    session['session_token'] = session_id
    sessions = load_json(SESSIONS_FILE, {})
    sessions.setdefault(username, {})[session_id] = {
        'token': session_id,
        'created': now_iso(),
        'active': True,
        'revoked': False,
        'device': request.user_agent.string[:100] if request.user_agent else 'Unknown',
        'ip': request.remote_addr or '',
    }
    save_json(SESSIONS_FILE, sessions)
    touch_presence(username)
    return jsonify({'success': True})

@app.route('/auth/logout', methods=['POST'])
def logout():
    username = session.get('username')
    session_id = session.get('session_token')
    if username and session_id:
        invalidate_session(username, session_id)
    session.clear()
    return jsonify({'success': True})

@app.route('/auth/logout-all', methods=['POST'])
def logout_all():
    username = session.get('username')
    if username:
        invalidate_all_sessions(username)
    session.clear()
    return jsonify({'success': True})

@app.route('/sessions')
@require_login
def list_sessions():
    username = session['username']
    sessions_list = get_user_sessions(username)
    current_session_id = session.get('session_token', 'default')
    for s in sessions_list:
        s['current'] = s['id'] == current_session_id
    return jsonify({'success': True, 'sessions': sessions_list})

@app.route('/sessions/<session_id>/revoke', methods=['POST'])
@require_login
def revoke_session(session_id):
    username = session['username']
    if session_id == session.get('session_token'):
        return jsonify({'success': False, 'message': 'Kan ikke avbryte nåværende økt.'}), 400
    invalidate_session(username, session_id)
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
    data = request.get_json(force=True, silent=True) or {}
    theme = data.get('theme', 'dark')
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
    resp = jsonify({'success': True, 'username': username, 'publicKey': user.get('identity_public_key')})
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp

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
            'edited': convert_to_bool(m.get('edited'), False),
            'deleted': convert_to_bool(m.get('deleted'), False),
            'reply_to': m.get('reply_to'),
            'reply_preview': '',
        })
    filtered.sort(key=lambda x: x['timestamp'])
    msg_map = {f['id']: f for f in filtered}
    for f in filtered:
        if f.get('reply_to') and f['reply_to'] in msg_map:
            orig = msg_map[f['reply_to']]
            preview = orig.get('text', '')
            if len(preview) > 80:
                preview = preview[:80] + '...'
            f['reply_preview'] = f"({orig.get('sender', '')}) {preview}"
    all_reactions = load_json(REACTIONS_FILE, {})
    for f in filtered:
        f['reactions'] = all_reactions.get(f['id'], {})
    return jsonify({'success': True, 'messages': filtered, 'pair_key': pk})

@app.route('/send', methods=['POST'])
def send_message():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    data = request.get_json(force=True, silent=True) or {}
    recipient = sanitize_input(data.get('recipient', ''), 30).lower()
    ciphertext = sanitize_input(data.get('ciphertext', ''), 10000)
    mtype = data.get('type', 'text')
    filename = data.get('filename')
    self_destruct_minutes = data.get('self_destruct_minutes')
    reply_to = (data.get('reply_to') or '').strip() or None
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
        'reply_to': reply_to,
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
    search_type = (request.args.get('type') or 'text').strip()
    if not query:
        return jsonify({'success': True, 'messages': []})
    pk = pair_key(session['username'], partner) if partner else None
    shared_key = get_or_create_pair_key(session['username'], partner) if partner else None
    messages = load_json(MESSAGES_FILE, [])
    results = []
    for m in messages:
        if pk and m.get('pair_key') != pk:
            continue
        if not pk:
            me = session['username']
            if m.get('sender') != me and m.get('recipient') != me:
                continue
        try:
            if m.get('type') == 'text':
                if shared_key:
                    text = decrypt_symmetric(m['ciphertext'], shared_key)
                else:
                    other = m['recipient'] if m['sender'] == me else m['sender']
                    try:
                        sk = get_or_create_pair_key(me, other)
                        text = decrypt_symmetric(m['ciphertext'], sk)
                    except Exception:
                        continue
            else:
                text = m.get('filename', '')
            if search_type == 'files' and m.get('type') != 'file':
                continue
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

@app.route('/search/files', methods=['GET'])
@require_login
def search_files():
    query = (request.args.get('q') or '').strip()
    if not query:
        return jsonify({'success': True, 'files': []})
    me = session['username']
    messages = load_json(MESSAGES_FILE, [])
    results = []
    seen = set()
    for m in messages:
        if m.get('type') != 'file':
            continue
        if m.get('sender') != me and m.get('recipient') != me:
            continue
        filename = m.get('filename', '')
        if query.lower() in filename.lower():
            if filename not in seen:
                seen.add(filename)
                other = m['recipient'] if m['sender'] == me else m['sender']
                results.append({
                    'filename': filename,
                    'sender': m['sender'],
                    'recipient': other,
                    'timestamp': m['timestamp'],
                })
    results.sort(key=lambda x: x['timestamp'], reverse=True)
    return jsonify({'success': True, 'files': results})

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
# Group E2EE key distribution
# ──────────────────────────────────────────────
@app.route('/groups/<group_id>/keys', methods=['POST'])
@require_login
def upload_group_keys(group_id):
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    encrypted_keys = data.get('keys', {})
    if not encrypted_keys:
        return jsonify({'success': False, 'message': 'Manglende nøkler.'}), 400
    groups = load_json(GROUPS_FILE, [])
    group = next((g for g in groups if g['id'] == group_id), None)
    if not group:
        return jsonify({'success': False, 'message': 'Gruppe ikke funnet.'}), 404
    if me not in group.get('members', []):
        return jsonify({'success': False, 'message': 'Ikke medlem av gruppen.'}), 403
    keys_data = load_json(KEYS_FILE, {})
    group_e2ee_key = f"e2ee::{group_id}"
    keys_data[group_e2ee_key] = {
        'encrypted_keys': encrypted_keys,
        'uploaded_by': me,
        'updated': now_iso(),
    }
    save_json(KEYS_FILE, keys_data)
    return jsonify({'success': True})

@app.route('/groups/<group_id>/keys', methods=['GET'])
@require_login
def get_group_key_for_user(group_id):
    me = session['username']
    groups = load_json(GROUPS_FILE, [])
    group = next((g for g in groups if g['id'] == group_id), None)
    if not group:
        return jsonify({'success': False, 'message': 'Gruppe ikke funnet.'}), 404
    if me not in group.get('members', []):
        return jsonify({'success': False, 'message': 'Ikke medlem av gruppen.'}), 403
    keys_data = load_json(KEYS_FILE, {})
    group_e2ee_key = f"e2ee::{group_id}"
    entry = keys_data.get(group_e2ee_key, {})
    encrypted_key = entry.get('encrypted_keys', {}).get(me)
    return jsonify({'success': True, 'encryptedKey': encrypted_key, 'hasKeys': bool(entry.get('encrypted_keys'))})

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
            is_e2ee = convert_to_bool(m.get('e2ee'), False)
            if is_e2ee:
                text = m.get('ciphertext', '')
            else:
                text = decrypt_symmetric(m['ciphertext'], group_key) if m.get('type') == 'text' else m.get('filename', '[fil]')
            filtered.append({
                'id': m.get('id'),
                'sender': m['sender'],
                'text': text,
                'type': m.get('type'),
                'timestamp': m['timestamp'],
                'filename': m.get('filename'),
                'edited': convert_to_bool(m.get('edited'), False),
                'deleted': convert_to_bool(m.get('deleted'), False),
                'reply_to': m.get('reply_to'),
                'reply_preview': '',
                'e2ee': is_e2ee,
            })
        except Exception as e:
            filtered.append({
                'id': m.get('id'),
                'sender': m['sender'],
                'text': f'[Dekrypteringsfeil: {str(e)}]',
                'type': m.get('type', 'text'),
                'timestamp': m['timestamp'],
                'filename': m.get('filename'),
                'edited': convert_to_bool(m.get('edited'), False),
                'deleted': convert_to_bool(m.get('deleted'), False),
                'reply_to': m.get('reply_to'),
                'reply_preview': '',
            })
    filtered.sort(key=lambda x: x['timestamp'])
    msg_map = {f['id']: f for f in filtered}
    for f in filtered:
        if f.get('reply_to') and f['reply_to'] in msg_map:
            orig = msg_map[f['reply_to']]
            preview = orig.get('text', '')
            if len(preview) > 80:
                preview = preview[:80] + '...'
            f['reply_preview'] = f"({orig.get('sender', '')}) {preview}"
    all_reactions = load_json(REACTIONS_FILE, {})
    for f in filtered:
        f['reactions'] = all_reactions.get(f['id'], {})
    return jsonify({'success': True, 'messages': filtered})

@app.route('/groups/<group_id>', methods=['DELETE'])
def delete_group(group_id):
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    groups = load_json(GROUPS_FILE, [])
    group = next((g for g in groups if g['id'] == group_id), None)
    if not group:
        return jsonify({'success': False, 'message': 'Gruppen finnes ikke.'}), 404
    if session['username'] != group.get('created_by') and session['username'] not in group.get('members', []):
        return jsonify({'success': False, 'message': 'Ingen tilgang.'}), 403
    groups = [g for g in groups if g['id'] != group_id]
    save_json(GROUPS_FILE, groups)
    return jsonify({'success': True, 'message': 'Gruppen er slettet.'})

@app.route('/groups/<group_id>/send', methods=['POST'])
def send_group_message(group_id):
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    data = request.get_json(force=True, silent=True) or {}
    ciphertext = sanitize_input(data.get('ciphertext', ''), 10000)
    mtype = data.get('type', 'text')
    filename = data.get('filename')
    reply_to = (data.get('reply_to') or '').strip() or None
    is_e2ee = convert_to_bool(data.get('e2ee'), False)
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
        'reply_to': reply_to,
        'e2ee': is_e2ee,
    })
    save_json(MESSAGES_FILE, messages)
    return jsonify({'success': True, 'message': 'Melding sendt.'})

# ──────────────────────────────────────────────
# Typing indicators
# ──────────────────────────────────────────────
@app.route('/typing', methods=['POST'])
def set_typing():
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    data = request.get_json(force=True, silent=True) or {}
    target = (data.get('target') or '').strip()
    is_typing = convert_to_bool(data.get('typing', False), False)
    if not target:
        return jsonify({'success': False, 'message': 'Manglende mottaker.'}), 400
    typing = load_json(TYPING_FILE, {})
    if is_typing:
        typing.setdefault(username, {})[target] = now_iso()
    else:
        typing.get(username, {}).pop(target, None)
    save_json(TYPING_FILE, typing)
    return jsonify({'success': True})

@app.route('/typing/<target>', methods=['GET'])
def get_typing(target):
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    typing = load_json(TYPING_FILE, {})
    typers = []
    for user, targets in typing.items():
        if user == username:
            continue
        ts = targets.get(target)
        if ts:
            parsed = parse_iso(ts)
            if parsed and (datetime.utcnow() - parsed.replace(tzinfo=None)) < timedelta(seconds=8):
                typers.append(user)
    return jsonify({'success': True, 'typers': typers})

# ──────────────────────────────────────────────
# Reactions
# ──────────────────────────────────────────────
@app.route('/reactions', methods=['POST'])
def add_reaction():
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    data = request.get_json(force=True, silent=True) or {}
    message_id = (data.get('message_id') or '').strip()
    emoji = (data.get('emoji') or '').strip()
    if not message_id or not emoji:
        return jsonify({'success': False, 'message': 'Manglende felt.'}), 400
    reactions = load_json(REACTIONS_FILE, {})
    msg_reactions = reactions.get(message_id, {})
    user_reactions = msg_reactions.get(username, [])
    if emoji in user_reactions:
        user_reactions.remove(emoji)
    else:
        user_reactions.append(emoji)
    if user_reactions:
        msg_reactions[username] = user_reactions
    else:
        msg_reactions.pop(username, None)
    if msg_reactions:
        reactions[message_id] = msg_reactions
    else:
        reactions.pop(message_id, None)
    save_json(REACTIONS_FILE, reactions)
    return jsonify({'success': True, 'reactions': msg_reactions})

@app.route('/reactions/<message_id>', methods=['GET'])
def get_reactions(message_id):
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    reactions = load_json(REACTIONS_FILE, {})
    return jsonify({'success': True, 'reactions': reactions.get(message_id, {})})

# ──────────────────────────────────────────────
# Edit / Delete messages
# ──────────────────────────────────────────────
@app.route('/messages/<message_id>/edit', methods=['PUT'])
def edit_message(message_id):
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    data = request.get_json(force=True, silent=True) or {}
    new_ciphertext = (data.get('ciphertext') or '').strip()
    if not new_ciphertext:
        return jsonify({'success': False, 'message': 'Manglende innhold.'}), 400
    messages = load_json(MESSAGES_FILE, [])
    for m in messages:
        if m.get('id') == message_id and m.get('sender') == username:
            m['ciphertext'] = new_ciphertext
            m['edited'] = True
            m['edited_at'] = now_iso()
            save_json(MESSAGES_FILE, messages)
            return jsonify({'success': True})
    return jsonify({'success': False, 'message': 'Melding ikke funnet.'}), 404

@app.route('/messages/<message_id>', methods=['DELETE'])
def delete_message(message_id):
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    messages = load_json(MESSAGES_FILE, [])
    for m in messages:
        if m.get('id') == message_id and m.get('sender') == username:
            m['deleted'] = True
            m['ciphertext'] = ''
            m['type'] = 'deleted'
            save_json(MESSAGES_FILE, messages)
            return jsonify({'success': True})
    return jsonify({'success': False, 'message': 'Melding ikke funnet.'}), 404

# ──────────────────────────────────────────────
# User profiles
# ──────────────────────────────────────────────
@app.route('/profile', methods=['GET'])
def get_profile():
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    users = load_json(USERS_FILE, {})
    user = users.get(username, {})
    return jsonify({
        'success': True,
        'username': username,
        'display_name': user.get('display_name', username),
        'avatar': user.get('avatar', ''),
        'bio': user.get('bio', ''),
    })

@app.route('/profile', methods=['POST'])
def update_profile():
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    data = request.get_json(force=True, silent=True) or {}
    users = load_json(USERS_FILE, {})
    if 'display_name' in data:
        users[username]['display_name'] = (data['display_name'] or '').strip()[:30]
    if 'bio' in data:
        users[username]['bio'] = (data['bio'] or '').strip()[:150]
    if 'avatar' in data:
        users[username]['avatar'] = data['avatar']
    save_json(USERS_FILE, users)
    return jsonify({'success': True})

@app.route('/users/all', methods=['GET'])
def list_users_with_profiles():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    users = load_json(USERS_FILE, {})
    result = []
    for u in users:
        if u == session['username']:
            continue
        entry = {
            'username': u,
            'display_name': users[u].get('display_name', u),
            'avatar': users[u].get('avatar', ''),
            'bio': users[u].get('bio', ''),
        }
        pub = users[u].get('identity_public_key')
        if pub:
            entry['publicKey'] = pub
        result.append(entry)
    return jsonify({'success': True, 'users': result})

# ──────────────────────────────────────────────
# WebRTC Calls (signaling via polling)
# ──────────────────────────────────────────────
@app.route('/calls/init', methods=['POST'])
def init_call():
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    data = request.get_json(force=True, silent=True) or {}
    target = (data.get('target') or '').strip()
    call_type = data.get('type', 'video')
    if not target:
        return jsonify({'success': False, 'message': 'Manglende mottaker.'}), 400
    calls = load_json(CALLS_FILE, {})
    for cid, c in calls.items():
        if c.get('status') in ('ringing', 'active') and (
            (c.get('caller') == username and c.get('callee') == target) or
            (c.get('caller') == target and c.get('callee') == username)
        ):
            return jsonify({'success': False, 'message': 'Allerede i samtale.'}), 409
    call_id = hashlib.sha256(f"{username}{target}{datetime.utcnow().isoformat()}".encode()).hexdigest()[:16]
    calls[call_id] = {
        'id': call_id,
        'caller': username,
        'callee': target,
        'type': call_type,
        'status': 'ringing',
        'created': now_iso(),
        'offer_sdp': None,
        'answer_sdp': None,
        'ice_candidates': [],
    }
    save_json(CALLS_FILE, calls)
    return jsonify({'success': True, 'call_id': call_id})

@app.route('/calls/incoming', methods=['GET'])
def get_incoming_call():
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    calls = load_json(CALLS_FILE, {})
    for cid, c in calls.items():
        if c.get('callee') == username and c.get('status') == 'ringing':
            return jsonify({
                'success': True,
                'call': {
                    'id': cid,
                    'caller': c['caller'],
                    'type': c.get('type', 'video'),
                    'created': c.get('created'),
                }
            })
    return jsonify({'success': True, 'call': None})

@app.route('/calls/offer', methods=['POST'])
def send_offer():
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    data = request.get_json(force=True, silent=True) or {}
    call_id = (data.get('call_id') or '').strip()
    sdp = data.get('sdp')
    if not call_id or not sdp:
        return jsonify({'success': False, 'message': 'Manglende felt.'}), 400
    calls = load_json(CALLS_FILE, {})
    call = calls.get(call_id)
    if not call or call.get('caller') != username:
        return jsonify({'success': False, 'message': 'Ugyldig samtale.'}), 404
    call['offer_sdp'] = sdp
    save_json(CALLS_FILE, calls)
    return jsonify({'success': True})

@app.route('/calls/offer/<call_id>', methods=['GET'])
def get_offer(call_id):
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    calls = load_json(CALLS_FILE, {})
    call = calls.get(call_id)
    if not call or call.get('callee') != username:
        return jsonify({'success': True, 'sdp': None})
    return jsonify({'success': True, 'sdp': call.get('offer_sdp'), 'caller': call.get('caller'), 'type': call.get('type', 'video')})

@app.route('/calls/accept', methods=['POST'])
def accept_call():
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    data = request.get_json(force=True, silent=True) or {}
    call_id = (data.get('call_id') or '').strip()
    sdp = data.get('sdp')
    if not call_id or not sdp:
        return jsonify({'success': False, 'message': 'Manglende felt.'}), 400
    calls = load_json(CALLS_FILE, {})
    call = calls.get(call_id)
    if not call or call.get('callee') != username:
        return jsonify({'success': False, 'message': 'Ugyldig samtale.'}), 404
    call['answer_sdp'] = sdp
    call['status'] = 'active'
    save_json(CALLS_FILE, calls)
    return jsonify({'success': True})

@app.route('/calls/answer/<call_id>', methods=['GET'])
def get_answer(call_id):
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    calls = load_json(CALLS_FILE, {})
    call = calls.get(call_id)
    if not call or call.get('caller') != username:
        return jsonify({'success': True, 'sdp': None, 'status': None})
    return jsonify({'success': True, 'sdp': call.get('answer_sdp'), 'status': call.get('status')})

@app.route('/calls/ice', methods=['POST'])
def send_ice():
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    data = request.get_json(force=True, silent=True) or {}
    call_id = (data.get('call_id') or '').strip()
    candidate = data.get('candidate')
    if not call_id or not candidate:
        return jsonify({'success': False, 'message': 'Manglende felt.'}), 400
    calls = load_json(CALLS_FILE, {})
    call = calls.get(call_id)
    if not call:
        return jsonify({'success': False, 'message': 'Ugyldig samtale.'}), 404
    call.setdefault('ice_candidates', []).append({'sender': username, 'candidate': candidate})
    save_json(CALLS_FILE, calls)
    return jsonify({'success': True})

@app.route('/calls/ice/<call_id>', methods=['GET'])
def get_ice(call_id):
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    calls = load_json(CALLS_FILE, {})
    call = calls.get(call_id)
    if not call:
        return jsonify({'success': True, 'candidates': []})
    candidates = [c['candidate'] for c in call.get('ice_candidates', []) if c.get('sender') != username]
    return jsonify({'success': True, 'candidates': candidates})

@app.route('/calls/hangup', methods=['POST'])
def hangup_call():
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    data = request.get_json(force=True, silent=True) or {}
    call_id = (data.get('call_id') or '').strip()
    if not call_id:
        return jsonify({'success': False, 'message': 'Manglende samtale-ID.'}), 400
    calls = load_json(CALLS_FILE, {})
    call = calls.get(call_id)
    if call:
        call['status'] = 'ended'
        call['ended_at'] = now_iso()
        save_json(CALLS_FILE, calls)
    return jsonify({'success': True})

@app.route('/calls/status/<call_id>', methods=['GET'])
def call_status(call_id):
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    calls = load_json(CALLS_FILE, {})
    call = calls.get(call_id)
    if not call:
        return jsonify({'success': True, 'status': 'ended'})
    return jsonify({'success': True, 'status': call.get('status', 'ended')})

@app.route('/calls/end-stale', methods=['POST'])
def end_stale_calls():
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    calls = load_json(CALLS_FILE, {})
    now = datetime.utcnow()
    for cid, c in list(calls.items()):
        if c.get('status') == 'ringing':
            created = parse_iso(c.get('created'))
            if created:
                if created.tzinfo:
                    created = created.replace(tzinfo=None)
                if (now - created) > timedelta(seconds=30):
                    c['status'] = 'ended'
    save_json(CALLS_FILE, calls)
    return jsonify({'success': True})

# ──────────────────────────────────────────────
# Admin panel
# ──────────────────────────────────────────────
@app.route('/admin/stats', methods=['GET'])
@require_admin
def admin_stats():
    users = load_json(USERS_FILE, {})
    messages = load_json(MESSAGES_FILE, [])
    groups = load_json(GROUPS_FILE, [])
    sessions = load_json(SESSIONS_FILE, {})
    active_sessions = sum(1 for s in sessions.values() if s.get('active', False))
    return jsonify({
        'success': True,
        'stats': {
            'total_users': len(users),
            'total_messages': len(messages),
            'total_groups': len(groups),
            'active_sessions': active_sessions,
            'admin_users': sum(1 for u in users.values() if u.get('is_admin', False)),
        }
    })

@app.route('/admin/users', methods=['GET'])
@require_admin
def admin_list_users():
    users = load_json(USERS_FILE, {})
    result = []
    for u, data in users.items():
        result.append({
            'username': u,
            'display_name': data.get('display_name', u),
            'is_admin': data.get('is_admin', False),
            'created_at': data.get('created_at', ''),
            'twofa_enabled': data.get('twofa_enabled', False),
        })
    return jsonify({'success': True, 'users': result})

@app.route('/admin/users/<username>/toggle-admin', methods=['POST'])
@require_admin
def admin_toggle_admin(username):
    admin_user = session.get('username')
    if username == admin_user:
        return jsonify({'success': False, 'message': 'Kan ikke endre din egen admin-status.'}), 400
    users = load_json(USERS_FILE, {})
    if username not in users:
        return jsonify({'success': False, 'message': 'Bruker ikke funnet.'}), 404
    users[username]['is_admin'] = not users[username].get('is_admin', False)
    save_json(USERS_FILE, users)
    return jsonify({'success': True, 'is_admin': users[username]['is_admin']})

@app.route('/admin/users/<username>/ban', methods=['POST'])
@require_admin
def admin_ban_user(username):
    admin_user = session.get('username')
    if username == admin_user:
        return jsonify({'success': False, 'message': 'Kan ikke banne deg selv.'}), 400
    users = load_json(USERS_FILE, {})
    if username not in users:
        return jsonify({'success': False, 'message': 'Bruker ikke funnet.'}), 404
    users[username]['banned'] = True
    save_json(USERS_FILE, users)
    invalidate_all_sessions(username)
    return jsonify({'success': True})

@app.route('/admin/users/<username>/unban', methods=['POST'])
@require_admin
def admin_unban_user(username):
    users = load_json(USERS_FILE, {})
    if username not in users:
        return jsonify({'success': False, 'message': 'Bruker ikke funnet.'}), 404
    users[username]['banned'] = False
    save_json(USERS_FILE, users)
    return jsonify({'success': True})

@app.route('/admin/users/<username>/delete', methods=['POST'])
@require_admin
def admin_delete_user(username):
    admin_user = session.get('username')
    if username == admin_user:
        return jsonify({'success': False, 'message': 'Kan ikke slette deg selv.'}), 400
    users = load_json(USERS_FILE, {})
    if username not in users:
        return jsonify({'success': False, 'message': 'Bruker ikke funnet.'}), 404
    del users[username]
    save_json(USERS_FILE, users)
    invalidate_all_sessions(username)
    return jsonify({'success': True})

@app.route('/admin/messages', methods=['GET'])
@require_admin
def admin_list_messages():
    limit = min(int(request.args.get('limit', 50)), 200)
    messages = load_json(MESSAGES_FILE, [])
    recent = messages[-limit:]
    result = []
    for m in recent:
        result.append({
            'id': m.get('id', '')[:16],
            'sender': m.get('sender', ''),
            'recipient': m.get('recipient', ''),
            'type': m.get('type', 'text'),
            'timestamp': m.get('timestamp', ''),
            'group_id': m.get('group_id', ''),
        })
    return jsonify({'success': True, 'messages': result})

@app.route('/admin/pages', methods=['GET'])
def admin_page():
    return render_template('admin.html')

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

@app.route('/me/key')
def my_key():
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    users = load_json(USERS_FILE, {})
    user = users.get(username, {})
    return jsonify({'success': True, 'publicKey': user.get('public_key', ''), 'importedKey': user.get('imported_key', '')})

# ──────────────────────────────────────────────
# Key Verification (Signal-style safety numbers)
# ──────────────────────────────────────────────
def compute_safety_number(username_a, username_b):
    users = load_json(USERS_FILE, {})
    user_a = users.get(username_a, {})
    user_b = users.get(username_b, {})
    pub_a = user_a.get('identity_keypair', {}).get('public', '')
    pub_b = user_b.get('identity_keypair', {}).get('public', '')
    if not pub_a or not pub_b:
        return None
    pair = sorted([pub_a, pub_b])
    combined = (pair[0] + pair[1]).encode('utf-8')
    digest = hashlib.sha256(combined).digest()
    fingerprint_bytes = digest[:30]
    digits = ''.join(str(b % 10) for b in fingerprint_bytes)
    return digits

def get_verification_key(username_a, username_b):
    return ':::'.join(sorted([username_a, username_b]))

@app.route('/verify/safety-number/<username>')
@require_login
def get_safety_number(username):
    me = session['username']
    if not get_user(username):
        return jsonify({'success': False, 'message': 'Bruker ikke funnet.'}), 404
    number = compute_safety_number(me, username)
    if not number:
        return jsonify({'success': False, 'message': 'Kunne ikke beregne sikkerhetsnummer.'}), 400
    formatted = ' '.join(number[i:i+5] for i in range(0, len(number), 5))
    verifications = load_json(VERIFICATION_FILE, {})
    vk = get_verification_key(me, username)
    verified = verifications.get(vk, {}).get('verified', False)
    verified_at = verifications.get(vk, {}).get('verified_at')
    return jsonify({
        'success': True,
        'safetyNumber': number,
        'formatted': formatted,
        'verified': verified,
        'verifiedAt': verified_at,
        'usernameA': me,
        'usernameB': username,
    })

@app.route('/verify/<username>', methods=['POST'])
@require_login
def verify_user(username):
    me = session['username']
    if not get_user(username):
        return jsonify({'success': False, 'message': 'Bruker ikke funnet.'}), 404
    verifications = load_json(VERIFICATION_FILE, {})
    vk = get_verification_key(me, username)
    verifications[vk] = {
        'verified': True,
        'verified_at': now_iso(),
        'verified_by': me,
    }
    save_json(VERIFICATION_FILE, verifications)
    return jsonify({'success': True, 'verified': True})

@app.route('/verify/<username>', methods=['DELETE'])
@require_login
def unverify_user(username):
    me = session['username']
    verifications = load_json(VERIFICATION_FILE, {})
    vk = get_verification_key(me, username)
    if vk in verifications:
        del verifications[vk]
        save_json(VERIFICATION_FILE, verifications)
    return jsonify({'success': True, 'verified': False})

@app.route('/verify/status/<username>')
@require_login
def verify_status(username):
    me = session['username']
    verifications = load_json(VERIFICATION_FILE, {})
    vk = get_verification_key(me, username)
    v = verifications.get(vk, {})
    return jsonify({
        'success': True,
        'verified': v.get('verified', False),
        'verifiedAt': v.get('verified_at'),
    })

@app.route('/verify/batch', methods=['POST'])
@require_login
def verify_batch():
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    usernames = data.get('users', [])
    verifications = load_json(VERIFICATION_FILE, {})
    result = {}
    for u in usernames:
        vk = get_verification_key(me, u)
        result[u] = verifications.get(vk, {}).get('verified', False)
    return jsonify({'success': True, 'statuses': result})

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

@app.route('/health')
@app.route('/sw-test')
def service_worker_test():
    return jsonify({'success': True})

@app.route('/uploads/<path:filename>')
@require_login
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=False)

if __name__ == '__main__':
    app.run(debug=os.environ.get('FLASK_DEBUG', 'false').lower() in ('true', '1'), host='0.0.0.0', port=5000)
