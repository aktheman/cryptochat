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
PINS_FILE = DATA_DIR / 'pins.json'
SCHEDULED_FILE = DATA_DIR / 'scheduled.json'
PUSH_SUBSCRIPTIONS_FILE = DATA_DIR / 'push_subscriptions.json'
LINK_PREVIEWS_FILE = DATA_DIR / 'link_previews.json'

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
            'silent': convert_to_bool(m.get('silent'), False),
            'forwarded_from': m.get('forwarded_from'),
            'poll_id': m.get('poll_id'),
            'e2ee': convert_to_bool(m.get('e2ee'), False),
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
        'silent': convert_to_bool(data.get('silent', False), False),
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
                'silent': convert_to_bool(m.get('silent'), False),
                'forwarded_from': m.get('forwarded_from'),
                'poll_id': m.get('poll_id'),
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
    if group.get('created_by') != session['username'] and session['username'] not in group.get('admins', []):
        sm = load_json(SLOWMODE_FILE, {})
        sm_seconds = sm.get(group_id, 0)
        if sm_seconds > 0:
            messages = load_json(MESSAGES_FILE, [])
            user_msgs = [m for m in messages if m.get('group_id') == group_id and m.get('sender') == session['username']]
            if user_msgs:
                last_ts = parse_iso(user_msgs[-1].get('timestamp'))
                if last_ts and (datetime.utcnow() - last_ts).total_seconds() < sm_seconds:
                    wait = int(sm_seconds - (datetime.utcnow() - last_ts).total_seconds())
                    return jsonify({'success': False, 'message': f'Sakte modus. Vent {wait} sek.'}), 429
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
# Pinned Messages
# ──────────────────────────────────────────────
@app.route('/pins/<chat_type>/<chat_id>', methods=['GET'])
@require_login
def get_pins(chat_type, chat_id):
    pins = load_json(PINS_FILE, {})
    key = f"{chat_type}::{chat_id}"
    pinned_ids = pins.get(key, [])
    messages = load_json(MESSAGES_FILE, [])
    pinned = [m for m in messages if m.get('id') in pinned_ids]
    pinned.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    result = []
    for m in pinned[:10]:
        entry = {'id': m.get('id'), 'sender': m.get('sender'), 'timestamp': m.get('timestamp'), 'type': m.get('type')}
        if m.get('type') == 'file':
            entry['text'] = m.get('filename', '[fil]')
        elif m.get('type') == 'text':
            entry['text'] = (m.get('ciphertext') or '')[:120]
        else:
            entry['text'] = ''
        result.append(entry)
    return jsonify({'success': True, 'pins': result})

@app.route('/pins/<chat_type>/<chat_id>/<message_id>', methods=['POST'])
@require_login
def pin_message(chat_type, chat_id, message_id):
    pins = load_json(PINS_FILE, {})
    key = f"{chat_type}::{chat_id}"
    pinned = pins.get(key, [])
    if message_id not in pinned:
        pinned.append(message_id)
    pins[key] = pinned[-20:]
    save_json(PINS_FILE, pins)
    return jsonify({'success': True})

@app.route('/pins/<chat_type>/<chat_id>/<message_id>', methods=['DELETE'])
@require_login
def unpin_message(chat_type, chat_id, message_id):
    pins = load_json(PINS_FILE, {})
    key = f"{chat_type}::{chat_id}"
    pinned = pins.get(key, [])
    if message_id in pinned:
        pinned.remove(message_id)
    pins[key] = pinned
    save_json(PINS_FILE, pins)
    return jsonify({'success': True})

# ──────────────────────────────────────────────
# Scheduled Messages
# ──────────────────────────────────────────────
@app.route('/schedule', methods=['POST'])
@require_login
def schedule_message():
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    recipient = (data.get('recipient') or '').strip()
    group_id = (data.get('group_id') or '').strip()
    ciphertext = sanitize_input(data.get('ciphertext', ''), 10000)
    send_at = (data.get('send_at') or '').strip()
    if not ciphertext or not send_at:
        return jsonify({'success': False, 'message': 'Manglende innhold eller tid.'}), 400
    if not recipient and not group_id:
        return jsonify({'success': False, 'message': 'Manglende mottaker.'}), 400
    try:
        scheduled_time = datetime.fromisoformat(send_at.replace('Z', '+00:00')).replace(tzinfo=None)
    except Exception:
        return jsonify({'success': False, 'message': 'Ugyldig tidspunkt.'}), 400
    if scheduled_time <= datetime.utcnow():
        return jsonify({'success': False, 'message': 'Tidspunkt maa vaere i fremtiden.'}), 400
    scheduled = load_json(SCHEDULED_FILE, [])
    entry = {
        'id': secrets.token_hex(8),
        'sender': me,
        'recipient': recipient,
        'group_id': group_id,
        'ciphertext': ciphertext,
        'send_at': scheduled_time.isoformat(),
        'created': now_iso(),
        'sent': False,
    }
    scheduled.append(entry)
    save_json(SCHEDULED_FILE, scheduled)
    return jsonify({'success': True, 'id': entry['id']})

@app.route('/schedule', methods=['GET'])
@require_login
def list_scheduled():
    me = session['username']
    scheduled = load_json(SCHEDULED_FILE, [])
    my_scheduled = [s for s in scheduled if s.get('sender') == me and not s.get('sent')]
    return jsonify({'success': True, 'scheduled': my_scheduled})

@app.route('/schedule/<schedule_id>', methods=['DELETE'])
@require_login
def cancel_scheduled(schedule_id):
    me = session['username']
    scheduled = load_json(SCHEDULED_FILE, [])
    scheduled = [s for s in scheduled if not (s.get('id') == schedule_id and s.get('sender') == me)]
    save_json(SCHEDULED_FILE, scheduled)
    return jsonify({'success': True})

def deliver_scheduled_messages():
    now = datetime.utcnow()
    scheduled = load_json(SCHEDULED_FILE, [])
    messages = load_json(MESSAGES_FILE, [])
    changed = False
    for entry in scheduled:
        if entry.get('sent'):
            continue
        send_at = parse_iso(entry.get('send_at'))
        if send_at and send_at.replace(tzinfo=None) <= now:
            if entry.get('recipient'):
                pk = pair_key(entry['sender'], entry['recipient'])
                shared_key = get_or_create_pair_key(entry['sender'], entry['recipient'])
                messages.append({
                    'id': hashlib.sha256(f"{entry['ciphertext']}{datetime.utcnow().isoformat()}{entry['sender']}{entry['recipient']}".encode()).hexdigest(),
                    'pair_key': pk,
                    'sender': entry['sender'],
                    'recipient': entry['recipient'],
                    'ciphertext': entry['ciphertext'],
                    'type': 'text',
                    'timestamp': datetime.utcnow().isoformat(),
                    'read': False,
                    'filename': None,
                    'reply_to': None,
                })
            elif entry.get('group_id'):
                group_key = get_or_create_group_key(entry['group_id'])
                messages.append({
                    'id': hashlib.sha256(f"{entry['ciphertext']}{entry['group_id']}{datetime.utcnow().isoformat()}{entry['sender']}".encode()).hexdigest(),
                    'group_id': entry['group_id'],
                    'sender': entry['sender'],
                    'ciphertext': entry['ciphertext'],
                    'type': 'text',
                    'timestamp': datetime.utcnow().isoformat(),
                    'filename': None,
                    'reply_to': None,
                })
            entry['sent'] = True
            changed = True
    if changed:
        save_json(MESSAGES_FILE, messages)
        save_json(SCHEDULED_FILE, scheduled)

def cleanup_disappearing_messages():
    messages = load_json(MESSAGES_FILE, [])
    now = datetime.utcnow()
    before = len(messages)
    cleaned = [m for m in messages if not m.get('self_destruct_at') or parse_iso(m.get('self_destruct_at')) and parse_iso(m.get('self_destruct_at')).replace(tzinfo=None) > now]
    if len(cleaned) < before:
        save_json(MESSAGES_FILE, cleaned)

@app.before_request
def background_tasks():
    if not hasattr(app, '_last_bg') or time.time() - app._last_bg > 60:
        app._last_bg = time.time()
        try:
            deliver_scheduled_messages()
            cleanup_disappearing_messages()
        except Exception:
            pass

# ──────────────────────────────────────────────
# Forward Messages
# ──────────────────────────────────────────────
@app.route('/messages/<message_id>/forward', methods=['POST'])
@require_login
def forward_message(message_id):
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    target = sanitize_input(data.get('target', ''), 30).lower()
    target_type = data.get('target_type', 'user')
    if not target:
        return jsonify({'success': False, 'message': 'Manglende mottaker.'}), 400
    messages = load_json(MESSAGES_FILE, [])
    orig = next((m for m in messages if m.get('id') == message_id), None)
    if not orig:
        return jsonify({'success': False, 'message': 'Melding ikke funnet.'}), 404
    if target_type == 'user':
        pk = pair_key(me, target)
    else:
        pk = f"group::{target}"
    fwd = {
        'id': hashlib.sha256(f"fwd:{message_id}:{target}:{datetime.utcnow().isoformat()}".encode()).hexdigest(),
        'pair_key': pk,
        'sender': me,
        'recipient': target,
        'ciphertext': orig.get('ciphertext', ''),
        'type': orig.get('type', 'text'),
        'timestamp': datetime.utcnow().isoformat(),
        'read': False,
        'self_destruct_at': None,
        'filename': orig.get('filename'),
        'forwarded_from': orig.get('sender'),
        'reply_to': None,
    }
    messages.append(fwd)
    save_json(MESSAGES_FILE, messages)
    return jsonify({'success': True})

# ──────────────────────────────────────────────
# Saved Messages (self-chat / bookmarks)
# ──────────────────────────────────────────────
@app.route('/saved', methods=['POST'])
@require_login
def save_message():
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    ciphertext = sanitize_input(data.get('ciphertext', ''), 10000)
    mtype = data.get('type', 'text')
    filename = data.get('filename')
    if not ciphertext:
        return jsonify({'success': False, 'message': 'Tom melding.'}), 400
    messages = load_json(MESSAGES_FILE, [])
    pk = pair_key(me, me)
    messages.append({
        'id': hashlib.sha256(f"saved:{ciphertext}:{datetime.utcnow().isoformat()}{me}".encode()).hexdigest(),
        'pair_key': pk,
        'sender': me,
        'recipient': me,
        'ciphertext': ciphertext,
        'type': mtype,
        'timestamp': datetime.utcnow().isoformat(),
        'read': True,
        'self_destruct_at': None,
        'filename': filename,
    })
    save_json(MESSAGES_FILE, messages)
    return jsonify({'success': True})

@app.route('/saved')
@require_login
def get_saved_messages():
    me = session['username']
    messages = load_json(MESSAGES_FILE, [])
    pk = pair_key(me, me)
    saved = [m for m in messages if m.get('pair_key') == pk]
    return jsonify({'success': True, 'messages': saved})

# ──────────────────────────────────────────────
# Unread Counts
# ──────────────────────────────────────────────
@app.route('/unread')
@require_login
def unread_counts():
    me = session['username']
    messages = load_json(MESSAGES_FILE, [])
    receipts = load_json(READ_RECEIPTS_FILE, {})
    counts = {}
    for m in messages:
        if m.get('sender') == me:
            continue
        partner = m.get('sender') if m.get('recipient') == me else None
        if not partner:
            continue
        if partner == me:
            continue
        if m.get('read', False):
            continue
        counts[partner] = counts.get(partner, 0) + 1
    return jsonify({'success': True, 'counts': counts})

# ──────────────────────────────────────────────
# Chat Export
# ──────────────────────────────────────────────
@app.route('/export/<chat_type>/<chat_id>')
@require_login
def export_chat(chat_type, chat_id):
    me = session['username']
    messages = load_json(MESSAGES_FILE, [])
    if chat_type == 'user':
        pk = pair_key(me, chat_id)
        filtered = [m for m in messages if m.get('pair_key') == pk]
    elif chat_type == 'group':
        filtered = [m for m in messages if m.get('pair_key') == f"group::{chat_id}"]
    else:
        return jsonify({'success': False, 'message': 'Ugyldig type.'}), 400
    filtered.sort(key=lambda m: m.get('timestamp', ''))
    lines = []
    for m in filtered:
        ts = m.get('timestamp', '')[:16].replace('T', ' ')
        sender = m.get('forwarded_from') and f"{m['sender']} (videresendt fra {m['forwarded_from']})" or m.get('sender', '')
        ct = m.get('ciphertext', '')
        if m.get('type') == 'file':
            ct = f"[Fil: {m.get('filename', '?')}]"
        elif m.get('reply_to'):
            ct = f"[Svar] {ct}"
        lines.append(f"[{ts}] {sender}: {ct}")
    export_text = '\n'.join(lines)
    return Response(export_text, mimetype='text/plain',
                    headers={'Content-Disposition': f'attachment; filename=export_{chat_type}_{chat_id}.txt'})

# ──────────────────────────────────────────────
# Polls
# ──────────────────────────────────────────────
POLLS_FILE = DATA_DIR / 'polls.json'

@app.route('/polls', methods=['POST'])
@require_login
def create_poll():
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    question = sanitize_input(data.get('question', ''), 300)
    options = data.get('options', [])
    target = sanitize_input(data.get('target', ''), 30).lower()
    target_type = data.get('target_type', 'user')
    multi = convert_to_bool(data.get('multi', False))
    if not question or len(options) < 2 or not target:
        return jsonify({'success': False, 'message': 'Manglende spørsmål eller alternativer.'}), 400
    poll_id = hashlib.sha256(f"{me}:{question}:{datetime.utcnow().isoformat()}".encode()).hexdigest()[:16]
    if target_type == 'user':
        pk = pair_key(me, target)
    else:
        pk = f"group::{target}"
    polls = load_json(POLLS_FILE, {})
    poll = {
        'id': poll_id,
        'pair_key': pk,
        'creator': me,
        'question': question,
        'options': [{'text': sanitize_input(o, 100), 'votes': []} for o in options[:10]],
        'multi': multi,
        'created_at': datetime.utcnow().isoformat(),
        'closed': False,
    }
    polls[poll_id] = poll
    save_json(POLLS_FILE, polls)
    messages = load_json(MESSAGES_FILE, [])
    messages.append({
        'id': hashlib.sha256(f"poll:{poll_id}:{datetime.utcnow().isoformat()}".encode()).hexdigest(),
        'pair_key': pk,
        'sender': me,
        'recipient': target,
        'ciphertext': f"📊 {question}",
        'type': 'poll',
        'poll_id': poll_id,
        'timestamp': datetime.utcnow().isoformat(),
        'read': False,
        'self_destruct_at': None,
    })
    save_json(MESSAGES_FILE, messages)
    return jsonify({'success': True, 'poll_id': poll_id})

@app.route('/polls/<poll_id>')
@require_login
def get_poll(poll_id):
    polls = load_json(POLLS_FILE, {})
    poll = polls.get(poll_id)
    if not poll:
        return jsonify({'success': False, 'message': 'Avstemning ikke funnet.'}), 404
    return jsonify({'success': True, 'poll': poll})

@app.route('/polls/<poll_id>/vote', methods=['POST'])
@require_login
def vote_poll(poll_id):
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    indices = data.get('options', [])
    polls = load_json(POLLS_FILE, {})
    poll = polls.get(poll_id)
    if not poll:
        return jsonify({'success': False, 'message': 'Avstemning ikke funnet.'}), 404
    if poll.get('closed'):
        return jsonify({'success': False, 'message': 'Avstemning er lukket.'}), 400
    for opt in poll['options']:
        opt['votes'] = [v for v in opt['votes'] if v != me]
    for idx in indices:
        if isinstance(idx, int) and 0 <= idx < len(poll['options']):
            poll['options'][idx]['votes'].append(me)
    polls[poll_id] = poll
    save_json(POLLS_FILE, polls)
    return jsonify({'success': True})

@app.route('/polls/<poll_id>/close', methods=['POST'])
@require_login
def close_poll(poll_id):
    me = session['username']
    polls = load_json(POLLS_FILE, {})
    poll = polls.get(poll_id)
    if not poll:
        return jsonify({'success': False, 'message': 'Avstemning ikke funnet.'}), 404
    if poll.get('creator') != me:
        return jsonify({'success': False, 'message': 'Kun oppretter kan lukke.'}), 403
    poll['closed'] = True
    polls[poll_id] = poll
    save_json(POLLS_FILE, polls)
    return jsonify({'success': True})

# ──────────────────────────────────────────────
# Stickers & GIFs
# ──────────────────────────────────────────────
STICKER_PACKS = {
    'smileys': {
        'name': 'Smileys',
        'stickers': [
            {'id': 's1', 'emoji': '😀', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%23fdd835"/%3E%3Ccircle cx="35" cy="38" r="5" fill="%23333"/%3E%3Ccircle cx="65" cy="38" r="5" fill="%23333"/%3E%3Cpath d="M30 55 Q50 80 70 55" stroke="%23333" stroke-width="3" fill="none"/%3E%3C/svg%3E'},
            {'id': 's2', 'emoji': '😂', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%23fdd835"/%3E%3Cpath d="M30 38 Q35 28 40 38" stroke="%23333" stroke-width="2" fill="none"/%3E%3Cpath d="M60 38 Q65 28 70 38" stroke="%23333" stroke-width="2" fill="none"/%3E%3Cpath d="M25 55 Q50 85 75 55" stroke="%23333" stroke-width="3" fill="%23ffeb3b"/%3E%3Cpath d="M32 48 L28 56" stroke="%23333" stroke-width="2"/%3E%3Cpath d="M68 48 L72 56" stroke="%23333" stroke-width="2"/%3E%3C/svg%3E'},
            {'id': 's3', 'emoji': '❤️', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Cpath d="M50 88 C25 65 5 50 5 30 C5 15 18 5 30 5 C40 5 48 12 50 18 C52 12 60 5 70 5 C82 5 95 15 95 30 C95 50 75 65 50 88Z" fill="%23e53935"/%3E%3C/svg%3E'},
            {'id': 's4', 'emoji': '👍', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Cpath d="M30 90 L30 45 L40 45 L42 30 C42 20 50 15 55 20 L60 30 L75 30 C80 30 85 35 83 42 L78 80 C77 85 72 90 67 90Z" fill="%23fdd835" stroke="%23e6a800" stroke-width="2"/%3E%3Crect x="15" y="45" width="15" height="45" rx="5" fill="%23fdd835" stroke="%23e6a800" stroke-width="2"/%3E%3C/svg%3E'},
            {'id': 's5', 'emoji': '🔥', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Cpath d="M50 5 C50 5 70 30 70 55 C70 75 60 90 50 95 C40 90 30 75 30 55 C30 30 50 5 50 5Z" fill="%23ff9800"/%3E%3Cpath d="M50 35 C50 35 60 50 60 65 C60 80 55 88 50 90 C45 88 40 80 40 65 C40 50 50 35 50 35Z" fill="%23fdd835"/%3E%3C/svg%3E'},
            {'id': 's6', 'emoji': '🎉', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect x="35" y="10" width="30" height="80" rx="5" fill="%237a3bff"/%3E%3Cpolygon points="50,5 55,15 45,15" fill="%23fdd835"/%3E%3Ccircle cx="25" cy="30" r="4" fill="%23e53935"/%3E%3Ccircle cx="75" cy="25" r="3" fill="%2322c55e"/%3E%3Ccircle cx="20" cy="60" r="3" fill="%232196f3"/%3E%3Ccircle cx="80" cy="65" r="4" fill="%23ff9800"/%3E%3Ccircle cx="30" cy="85" r="2" fill="%23e53935"/%3E%3Ccircle cx="70" cy="80" r="3" fill="%237a3bff"/%3E%3C/svg%3E'},
            {'id': 's7', 'emoji': '💯', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext x="50" y="65" text-anchor="middle" font-size="50" font-weight="bold" fill="%23e53935"%3E100%3C/text%3E%3Cline x1="15" y1="75" x2="85" y2="75" stroke="%23e53935" stroke-width="4"/%3E%3C/svg%3E'},
            {'id': 's8', 'emoji': '🤔', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%23fdd835"/%3E%3Ccircle cx="35" cy="38" r="5" fill="%23333"/%3E%3Ccircle cx="65" cy="35" r="5" fill="%23333"/%3E%3Cpath d="M40 65 Q50 70 60 62" stroke="%23333" stroke-width="3" fill="none"/%3E%3Cpath d="M70 18 L80 8" stroke="%23333" stroke-width="3"/%3E%3C/svg%3E'},
        ]
    },
    'animals': {
        'name': 'Dyr',
        'stickers': [
            {'id': 'a1', 'emoji': '🐱', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="55" r="40" fill="%239e9e9e"/%3E%3Cpolygon points="15,30 25,5 40,25" fill="%239e9e9e"/%3E%3Cpolygon points="85,30 75,5 60,25" fill="%239e9e9e"/%3E%3Ccircle cx="38" cy="48" r="5" fill="%234caf50"/%3E%3Ccircle cx="62" cy="48" r="5" fill="%234caf50"/%3E%3Cellipse cx="50" cy="58" rx="4" ry="3" fill="%23e91e63"/%3E%3Cpath d="M45 63 Q50 68 55 63" stroke="%23333" stroke-width="2" fill="none"/%3E%3C/svg%3E'},
            {'id': 'a2', 'emoji': '🐶', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="55" r="40" fill="%238d6e63"/%3E%3Cellipse cx="20" cy="35" rx="12" ry="20" fill="%236d4c41"/%3E%3Cellipse cx="80" cy="35" rx="12" ry="20" fill="%236d4c41"/%3E%3Ccircle cx="38" cy="48" r="5" fill="%23333"/%3E%3Ccircle cx="62" cy="48" r="5" fill="%23333"/%3E%3Cellipse cx="50" cy="60" rx="8" ry="6" fill="%23333"/%3E%3C/svg%3E'},
            {'id': 'a3', 'emoji': '🦊', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="55" r="40" fill="%23ff9800"/%3E%3Cpolygon points="15,25 25,5 40,30" fill="%23ff9800"/%3E%3Cpolygon points="85,25 75,5 60,30" fill="%23ff9800"/%3E%3Ccircle cx="38" cy="48" r="5" fill="%23333"/%3E%3Ccircle cx="62" cy="48" r="5" fill="%23333"/%3E%3Cellipse cx="50" cy="62" rx="6" ry="4" fill="%23333"/%3E%3Cpath d="M30 70 Q50 85 70 70" fill="%23fff3e0"/%3E%3C/svg%3E'},
            {'id': 'a4', 'emoji': '🐼', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%23fff"/%3E%3Cellipse cx="30" cy="40" rx="12" ry="10" fill="%23333"/%3E%3Cellipse cx="70" cy="40" rx="12" ry="10" fill="%23333"/%3E%3Ccircle cx="38" cy="42" r="3" fill="%23fff"/%3E%3Ccircle cx="62" cy="42" r="3" fill="%23fff"/%3E%3Cellipse cx="50" cy="58" rx="6" ry="4" fill="%23333"/%3E%3C/svg%3E'},
        ]
    }
}

@app.route('/stickers')
def get_sticker_packs():
    packs = []
    for key, pack in STICKER_PACKS.items():
        packs.append({'id': key, 'name': pack['name'], 'count': len(pack['stickers'])})
    return jsonify({'success': True, 'packs': packs})

@app.route('/stickers/<pack_id>')
def get_sticker_pack(pack_id):
    pack = STICKER_PACKS.get(pack_id)
    if not pack:
        return jsonify({'success': False, 'message': 'Pakke ikke funnet.'}), 404
    return jsonify({'success': True, 'pack': pack})

@app.route('/gifs/search')
@require_login
def search_gifs():
    query = sanitize_input(request.args.get('q', ''), 100)
    if not query:
        return jsonify({'success': True, 'gifs': []})
    try:
        import urllib.request, urllib.parse
        url = 'https://tenor.googleapis.com/v2/search?q=' + urllib.parse.quote(query) + '&key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&limit=20&media_filter=gif,tinygif'
        req = urllib.request.Request(url, headers={'User-Agent': 'CryptoChat/1.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read())
        gifs = []
        for r in data.get('results', []):
            media = r.get('media_formats', {}).get('gif', {})
            tiny = r.get('media_formats', {}).get('tinygif', {})
            if media.get('url'):
                gifs.append({'url': media['url'], 'preview': tiny.get('url', media['url']), 'title': r.get('title', '')})
        return jsonify({'success': True, 'gifs': gifs})
    except Exception:
        return jsonify({'success': True, 'gifs': []})

# ──────────────────────────────────────────────
# Location Sharing
# ──────────────────────────────────────────────
@app.route('/send/location', methods=['POST'])
@require_login
def send_location():
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    recipient = sanitize_input(data.get('recipient', ''), 30).lower()
    lat = data.get('lat')
    lng = data.get('lng')
    label = sanitize_input(data.get('label', ''), 100)
    group_id = sanitize_input(data.get('group_id', ''), 30)
    if lat is None or lng is None:
        return jsonify({'success': False, 'message': 'Manglende koordinater.'}), 400
    loc_data = json.dumps({'lat': float(lat), 'lng': float(lng), 'label': label})
    if group_id:
        pk = f"group::{group_id}"
        target = group_id
    else:
        pk = pair_key(me, recipient)
        target = recipient
    messages = load_json(MESSAGES_FILE, [])
    messages.append({
        'id': hashlib.sha256(f"loc:{loc_data}:{datetime.utcnow().isoformat()}{me}".encode()).hexdigest(),
        'pair_key': pk,
        'sender': me,
        'recipient': target,
        'ciphertext': loc_data,
        'type': 'location',
        'timestamp': datetime.utcnow().isoformat(),
        'read': False,
        'self_destruct_at': None,
    })
    save_json(MESSAGES_FILE, messages)
    return jsonify({'success': True})

# ──────────────────────────────────────────────
# Slow Mode (group admin setting)
# ──────────────────────────────────────────────
SLOWMODE_FILE = DATA_DIR / 'slowmode.json'

@app.route('/groups/<group_id>/slowmode', methods=['POST'])
@require_login
def set_slowmode(group_id):
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    seconds = int(data.get('seconds', 0))
    groups = load_json(GROUPS_FILE, [])
    group = next((g for g in groups if g.get('id') == group_id), None)
    if not group:
        return jsonify({'success': False, 'message': 'Gruppe ikke funnet.'}), 404
    if group.get('created_by') != me and me not in group.get('admins', []):
        return jsonify({'success': False, 'message': 'Mangler tillatelse.'}), 403
    sm = load_json(SLOWMODE_FILE, {})
    sm[group_id] = max(0, min(seconds, 3600))
    save_json(SLOWMODE_FILE, sm)
    return jsonify({'success': True})

@app.route('/groups/<group_id>/slowmode')
def get_slowmode(group_id):
    sm = load_json(SLOWMODE_FILE, {})
    return jsonify({'success': True, 'seconds': sm.get(group_id, 0)})

# ──────────────────────────────────────────────
# Group Admin Roles
# ──────────────────────────────────────────────
@app.route('/groups/<group_id>/admins', methods=['POST'])
@require_login
def set_group_admin(group_id):
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    target = sanitize_input(data.get('username', ''), 30).lower()
    role = data.get('role', 'admin')
    groups = load_json(GROUPS_FILE, [])
    group = next((g for g in groups if g.get('id') == group_id), None)
    if not group:
        return jsonify({'success': False, 'message': 'Gruppe ikke funnet.'}), 404
    if group.get('created_by') != me:
        return jsonify({'success': False, 'message': 'Kun oppretter kan angi roller.'}), 403
    if not target or target not in (group.get('members', [])):
        return jsonify({'success': False, 'message': 'Bruker er ikke medlem.'}), 400
    if role == 'admin':
        group.setdefault('admins', [])
        if target not in group['admins']:
            group['admins'].append(target)
        group['mods'] = [m for m in group.get('mods', []) if m != target]
    elif role == 'mod':
        group.setdefault('mods', [])
        if target not in group['mods']:
            group['mods'].append(target)
        group['admins'] = [a for a in group.get('admins', []) if a != target]
    else:
        group['admins'] = [a for a in group.get('admins', []) if a != target]
        group['mods'] = [m for m in group.get('mods', []) if m != target]
    save_json(GROUPS_FILE, groups)
    return jsonify({'success': True})

@app.route('/groups/<group_id>/admins/<username>', methods=['DELETE'])
@require_login
def remove_group_admin(group_id, username):
    me = session['username']
    groups = load_json(GROUPS_FILE, [])
    group = next((g for g in groups if g.get('id') == group_id), None)
    if not group:
        return jsonify({'success': False, 'message': 'Gruppe ikke funnet.'}), 404
    if group.get('created_by') != me:
        return jsonify({'success': False, 'message': 'Kun oppretter kan fjerne roller.'}), 403
    group['admins'] = [a for a in group.get('admins', []) if a != username]
    group['mods'] = [m for m in group.get('mods', []) if m != username]
    save_json(GROUPS_FILE, groups)
    return jsonify({'success': True})

# ──────────────────────────────────────────────
# Draft Messages
# ──────────────────────────────────────────────
DRAFTS_FILE = DATA_DIR / 'drafts.json'

@app.route('/drafts', methods=['POST'])
@require_login
def save_draft():
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    target = sanitize_input(data.get('target', ''), 30).lower()
    text = sanitize_input(data.get('text', ''), 5000)
    drafts = load_json(DRAFTS_FILE, {})
    drafts.setdefault(me, {})
    if text:
        drafts[me][target] = {'text': text, 'updated_at': datetime.utcnow().isoformat()}
    else:
        drafts[me].pop(target, None)
    save_json(DRAFTS_FILE, drafts)
    return jsonify({'success': True})

@app.route('/drafts')
@require_login
def get_drafts():
    me = session['username']
    drafts = load_json(DRAFTS_FILE, {})
    return jsonify({'success': True, 'drafts': drafts.get(me, {})})

# ──────────────────────────────────────────────
# Chat Wallpapers
# ──────────────────────────────────────────────
WALLPAPERS_FILE = DATA_DIR / 'wallpapers.json'
WALLPAPER_PRESETS = [
    {'id': 'default', 'name': 'Standard', 'css': ''},
    {'id': 'stars', 'name': 'Stjerner', 'css': 'radial-gradient(2px 2px at 20px 30px, #eee, transparent), radial-gradient(2px 2px at 40px 70px, #ccc, transparent), radial-gradient(1px 1px at 90px 40px, #fff, transparent), radial-gradient(2px 2px at 160px 120px, #ddd, transparent), radial-gradient(1px 1px at 200px 60px, #fff, transparent); background-size: 250px 200px; background-color: #0f1826;'},
    {'id': 'gradient', 'name': 'Gradient', 'css': 'background: linear-gradient(135deg, #0f1826 0%, #1c1030 50%, #0f1424 100%);'},
    {'id': 'grid', 'name': 'Rutenett', 'css': 'background-image: linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px); background-size: 30px 30px; background-color: #0f1826;'},
    {'id': 'ocean', 'name': 'Hav', 'css': 'background: linear-gradient(180deg, #0a1628 0%, #0d2137 40%, #102a40 70%, #0f1826 100%);'},
    {'id': 'forest', 'name': 'Skog', 'css': 'background: linear-gradient(180deg, #0d1a12 0%, #112218 50%, #0d1a12 100%);'},
    {'id': 'sunset', 'name': 'Solnedgang', 'css': 'background: linear-gradient(180deg, #1a0f0a 0%, #2a1510 30%, #3a2018 60%, #1a0f0a 100%);'},
]

@app.route('/wallpapers')
def get_wallpaper_presets():
    return jsonify({'success': True, 'presets': WALLPAPER_PRESETS})

@app.route('/wallpaper/<chat_type>/<chat_id>', methods=['POST'])
@require_login
def set_wallpaper(chat_type, chat_id):
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    wallpaper_id = data.get('wallpaper_id', 'default')
    wp = load_json(WALLPAPERS_FILE, {})
    key = f"{me}:{chat_type}:{chat_id}"
    wp[key] = wallpaper_id
    save_json(WALLPAPERS_FILE, wp)
    return jsonify({'success': True})

@app.route('/wallpaper/<chat_type>/<chat_id>')
@require_login
def get_wallpaper(chat_type, chat_id):
    me = session['username']
    wp = load_json(WALLPAPERS_FILE, {})
    key = f"{me}:{chat_type}:{chat_id}"
    wallpaper_id = wp.get(key, 'default')
    preset = next((p for p in WALLPAPER_PRESETS if p['id'] == wallpaper_id), WALLPAPER_PRESETS[0])
    return jsonify({'success': True, 'wallpaper': preset})

# ──────────────────────────────────────────────
# Silent Messages
# ──────────────────────────────────────────────
# Handled in send_message via 'silent' field in request body
# No new endpoint needed - just pass silent:true with the send

# ──────────────────────────────────────────────
# PWA Push Notifications
# ──────────────────────────────────────────────
@app.route('/push/subscribe', methods=['POST'])
@require_login
def push_subscribe():
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    subscription = data.get('subscription')
    if not subscription:
        return jsonify({'success': False, 'message': 'Manglende abonnement.'}), 400
    subs = load_json(PUSH_SUBSCRIPTIONS_FILE, {})
    subs.setdefault(me, [])
    endpoint = subscription.get('endpoint', '')
    subs[me] = [s for s in subs[me] if s.get('endpoint') != endpoint]
    subs[me].append(subscription)
    save_json(PUSH_SUBSCRIPTIONS_FILE, subs)
    return jsonify({'success': True})

@app.route('/push/unsubscribe', methods=['POST'])
@require_login
def push_unsubscribe():
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    endpoint = data.get('endpoint', '')
    subs = load_json(PUSH_SUBSCRIPTIONS_FILE, {})
    if me in subs:
        subs[me] = [s for s in subs[me] if s.get('endpoint') != endpoint]
        save_json(PUSH_SUBSCRIPTIONS_FILE, subs)
    return jsonify({'success': True})

@app.route('/push/vapid-key')
def push_vapid_key():
    vapid_key = os.environ.get('VAPID_PUBLIC_KEY', '')
    return jsonify({'success': True, 'key': vapid_key})

# ──────────────────────────────────────────────
# Link Previews
# ──────────────────────────────────────────────
@app.route('/link-preview')
@require_login
def get_link_preview():
    url = (request.args.get('url') or '').strip()
    if not url or not url.startswith(('http://', 'https://')):
        return jsonify({'success': True, 'preview': None})
    cache = load_json(LINK_PREVIEWS_FILE, {})
    if url in cache:
        return jsonify({'success': True, 'preview': cache[url]})
    import urllib.request
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; CryptoChat/1.0)'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            html = resp.read(200000).decode('utf-8', errors='ignore')
        import re
        title_match = re.search(r'<title[^>]*>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
        desc_match = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']', html, re.IGNORECASE) or re.search(r'<meta[^>]*content=["\'](.*?)["\'][^>]*name=["\']description["\']', html, re.IGNORECASE)
        og_img = re.search(r'<meta[^>]*property=["\']og:image["\'][^>]*content=["\'](.*?)["\']', html, re.IGNORECASE) or re.search(r'<meta[^>]*content=["\'](.*?)["\'][^>]*property=["\']og:image["\']', html, re.IGNORECASE)
        preview = {
            'url': url,
            'title': (title_match.group(1).strip() if title_match else '')[:200],
            'description': (desc_match.group(1).strip() if desc_match else '')[:300],
            'image': (og_img.group(1).strip() if og_img else ''),
        }
        cache[url] = preview
        if len(cache) > 500:
            oldest = list(cache.keys())[:100]
            for k in oldest: del cache[k]
        save_json(LINK_PREVIEWS_FILE, cache)
        return jsonify({'success': True, 'preview': preview})
    except Exception:
        return jsonify({'success': True, 'preview': None})

# ──────────────────────────────────────────────
# Key Rotation
# ──────────────────────────────────────────────
@app.route('/key/rotate', methods=['POST'])
@require_login
def rotate_key():
    me = session['username']
    users = load_json(USERS_FILE, {})
    if me not in users:
        return jsonify({'success': False, 'message': 'Bruker ikke funnet.'}), 404
    new_keypair = generate_identity_keypair()
    users[me]['identity_keypair'] = new_keypair
    users[me]['key_rotated_at'] = now_iso()
    save_json(USERS_FILE, users)
    return jsonify({'success': True, 'message': 'Noekkel rotert. Del den nye offentlige noekkelen med kontakter.'})

@app.route('/key/rotation-status')
@require_login
def key_rotation_status():
    me = session['username']
    users = load_json(USERS_FILE, {})
    user = users.get(me, {})
    return jsonify({
        'success': True,
        'rotated_at': user.get('key_rotated_at'),
        'created_at': user.get('created_at'),
    })

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
    sw = """const CACHE='cryptochat-v2';const ASSETS=['/','/static/css/style.css','/static/js/chat.js','/static/js/crypto.js','/manifest.json'];
self.addEventListener('install',(e)=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',(e)=>{e.waitUntil(self.clients.claim());});
self.addEventListener('fetch',(event)=>{event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));});
self.addEventListener('push',(event)=>{
  const data=event.data?event.data.json():{};
  const title=data.title||'CryptoChat';
  const options={body:data.body||'',icon:'/static/img/icon-192.png',badge:'/static/img/icon-192.png',data:data.url||'/'};
  event.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener('notificationclick',(event)=>{
  event.notification.close();
  event.waitUntil(clients.matchAll({type:'window'}).then(c=>{
    const url=event.notification.data||'/';
    for(const client of c){if(client.url.includes(url)&&'focus' in client)return client.focus();}
    return clients.openWindow(url);
  }));
});"""
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
