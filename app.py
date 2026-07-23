import os, json, base64, secrets, hashlib, hmac, time, re, collections, threading
import fcntl
import ipaddress
from datetime import datetime, timedelta
from pathlib import Path
from functools import wraps
from urllib.parse import urlparse

from flask import (
    Flask, render_template, request, jsonify, session,
    redirect, url_for, send_from_directory, Response, make_response
)
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import x25519
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag
import pyotp
from db import load_json, save_json, init_db, migrate_json_files, invalidate_cache, _cache

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
    CSRF_ENABLED=bool(os.environ.get('CSRF_ENABLED', 'false').lower() in ('true', '1', 'yes')),
    CSRF_TRUSTED_ORIGINS=[o.strip() for o in os.environ.get('CSRF_TRUSTED_ORIGINS', '').split(',') if o.strip()],
)
app.config.update(
    MAX_CONTENT_LENGTH=50 * 1024 * 1024,
    UPLOAD_FOLDER=os.path.join(os.path.dirname(__file__), 'data/uploads'),
    ALLOWED_EXTENSIONS={'png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf', 'txt', 'zip', 'mp3', 'wav', 'ogg', 'webm', 'opus', 'm4a'}
)
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
init_db()
migrate_json_files()
app._start_time = time.time()

@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'camera=(self), microphone=(self), geolocation=()'
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self'; "
        "font-src 'self' data:; "
        "img-src 'self' data: blob: https:; "
        "media-src 'self' blob: data:; "
        "connect-src 'self' wss: https: blob:; "
        "frame-ancestors 'none'; "
        "base-uri 'none'; "
        "form-action 'self'; "
        "upgrade-insecure-requests"
    )
    if request.path.startswith('/static/'):
        response.headers['Cache-Control'] = 'public, max-age=604800'
    else:
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate'
    return response

def_rate_store = {'ts': [], 'n': 0}
def _rl_get(store, key):
    item = store.setdefault(key, {'ts': [], 'n': 0})
    return item
def _rl_prune(store, now, window_seconds=3600):
    limit = now - window_seconds
    for k in list(store):
        item = store[k]
        item['ts'] = [t for t in item['ts'] if t > limit]
        if not item['ts']:
            del store[k]

class _RateStore:
    __slots__ = ('_d', '_max_items', '_window')
    def __init__(self, max_items=10000, window_seconds=3600):
        self._d = {}
        self._max_items = max_items
        self._window = window_seconds
    def allow(self, key: str, max_requests: int, window_seconds: int):
        now = time.time()
        item = _rl_get(self._d, key)
        item['ts'] = [t for t in item['ts'] if now - t < window_seconds]
        if len(item['ts']) >= max_requests:
            return False
        item['ts'].append(now)
        if len(self._d) > self._max_items:
            _rl_prune(self._d, now, self._window)
        return True
    def clear(self):
        self._d.clear()

RATE_LIMIT_STORE = _RateStore()

def rate_limit(max_requests=30, window_seconds=60):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            username = session.get('username') or request.remote_addr
            key = f"{f.__name__}:{username}"
            if not RATE_LIMIT_STORE.allow(key, max_requests, window_seconds):
                audit('rate_limited', actor=str(username or ''), target=request.path)
                return jsonify({'success': False, 'message': 'For mange forespørsler. Vent litt.'}), 429
            return f(*args, **kwargs)
        return wrapper
    return decorator

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / 'data'
DATA_DIR.mkdir(exist_ok=True)
(DATA_DIR / 'uploads').mkdir(exist_ok=True)

USERS_FILE = DATA_DIR / 'users.json'
AUDIT_LOG_FILE = DATA_DIR / 'audit.jsonl'
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
PINNED_CHATS_FILE = DATA_DIR / 'pinned_chats.json'
FOLDERS_FILE = DATA_DIR / 'folders.json'
CHANNELS_FILE = DATA_DIR / 'channels.json'
INVITE_LINKS_FILE = DATA_DIR / 'invite_links.json'
MUTED_CHATS_FILE = DATA_DIR / 'muted_chats.json'
ARCHIVE_FILE = DATA_DIR / 'archive.json'
CONTACTS_FILE = DATA_DIR / 'contacts.json'
STORIES_FILE = DATA_DIR / 'stories.json'

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

def audit(event: str, actor: str = '', target: str = '', meta: str = ''):
    try:
        line = json.dumps({
            'ts': datetime.utcnow().isoformat() + 'Z',
            'event': event,
            'actor': actor,
            'target': target,
            'meta': meta,
        }, ensure_ascii=False) + '\n'
        with AUDIT_LOG_FILE.open('a', encoding='utf-8') as f:
            f.write(line)
        try:
            if AUDIT_LOG_FILE.stat().st_size > 5 * 1024 * 1024:
                lines = AUDIT_LOG_FILE.read_text(encoding='utf-8', errors='ignore').splitlines()
                keep = lines[-2000:]
                AUDIT_LOG_FILE.write_text('\n'.join(keep) + ('\n' if keep else ''), encoding='utf-8')
        except Exception:
            pass
    except Exception:
        pass

def touch_presence(username):
    presence = load_json(USER_PRESENCE_FILE, {})
    if not isinstance(presence.get(username), dict):
        presence[username] = {}
    presence[username]['lastSeen'] = now_iso()
    save_json(USER_PRESENCE_FILE, presence)

def parse_iso(dt):
    if not dt:
        return None
    try:
        value = datetime.fromisoformat(dt.replace('Z', '+00:00'))
        if value.tzinfo:
            value = value.replace(tzinfo=None)
        return value
    except Exception:
        return None

def is_online(username, timeout_minutes=5):
    presence = load_json(USER_PRESENCE_FILE, {})
    entry = presence.get(username)
    ts = entry.get('lastSeen') if isinstance(entry, dict) else entry
    last = parse_iso(ts)
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
            save_json(SESSIONS_FILE, sessions)
        elif isinstance(user_sessions, dict):
            for sid in user_sessions:
                if isinstance(user_sessions[sid], dict):
                    user_sessions[sid]['active'] = False
                    user_sessions[sid]['revoked'] = True
            save_json(SESSIONS_FILE, sessions)
        invalidate_cache()

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
    users = load_json(USERS_FILE, {}, ttl=5)
    return users.get(username)

def require_login(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        username = session.get('username')
        if not username or not is_user_session_active(username):
            session.clear()
            return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
        return f(*args, **kwargs)
    return wrapper

_encoded_prefixes = ('http://', 'https://')

def _is_public_ip(host: str) -> bool:
    try:
        addr = ipaddress.ip_address(host)
        return not (addr.is_private or addr.is_loopback or addr.is_reserved or addr.is_link_local or addr.is_multicast) and not (addr.version == 6 and str(addr) == '::1')
    except ValueError:
        return False

def _is_public_site_url(url: str) -> bool:
    if not url.startswith(_encoded_prefixes):
        return False
    try:
        parsed = urlparse(url)
        if parsed.scheme != 'https' and parsed.scheme != 'http':
            return False
        host = (parsed.hostname or '').lower().split(':')[0]
        if not host:
            return False
        if host in ('localhost', '127.0.0.1', '0.0.0.0'):
            return False
        try:
            addr = ipaddress.ip_address(host)
            return not (addr.is_private or addr.is_loopback or addr.is_reserved or addr.is_link_local or addr.is_multicast)
        except ValueError:
            return True
    except Exception:
        return False

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

def password_strength_ok(pw: str) -> bool:
    if len(pw) < 10:
        return False
    if not any(c.isupper() for c in pw):
        return False
    if not any(c.islower() for c in pw):
        return False
    if not any(c.isdigit() for c in pw):
        return False
    symbols = set('!@#$%^&*()-_=+[]{}|;:\',"./<>?`~')
    if not any(c in symbols for c in pw):
        return False
    return True

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
    derived = HKDF(algorithm=hashes.SHA256(), length=32, salt=secrets.token_bytes(16), info=b'cryptochat-v1').derive(shared)
    return derived

def _encrypt_2fa_secret(plaintext: str) -> str:
    key = app.secret_key[:32]
    aes = AESGCM(key)
    nonce = secrets.token_bytes(12)
    ct = aes.encrypt(nonce, plaintext.encode('utf-8'), None)
    return base64.urlsafe_b64encode(nonce + ct).decode('utf-8')


def _decrypt_2fa_secret(enc: str) -> str:
    data = base64.urlsafe_b64decode(enc)
    nonce, ct = data[:12], data[12:]
    aes = AESGCM(app.secret_key[:32])
    return aes.decrypt(nonce, ct, None).decode('utf-8')


def _encrypt_payload(plaintext: str) -> str:
    key = app.secret_key[:32]
    aes = AESGCM(key)
    nonce = secrets.token_bytes(12)
    ct = aes.encrypt(nonce, plaintext.encode('utf-8'), None)
    return base64.urlsafe_b64encode(nonce + ct).decode('utf-8')


def _decrypt_payload(enc: str) -> str:
    data = base64.urlsafe_b64decode(enc)
    nonce, ct = data[:12], data[12:]
    aes = AESGCM(app.secret_key[:32])
    return aes.decrypt(nonce, ct, None).decode('utf-8')

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
            'key_b64': base64.b64encode(new_key).decode(),
            'created': now_iso(),
        }
        save_json(KEYS_FILE, keys)
    return keys[group_id]['key_b64']

# ──────────────────────────────────────────────
# Pages
# ──────────────────────────────────────────────
@app.route('/', methods=['GET'])
def index():
    if 'username' not in session:
        if request.accept_mimetypes.accept_html:
            return redirect(url_for('login_page'))
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    return redirect(url_for('chat_page'))


def require_csrf(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if request.method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            if not app.config.get('CSRF_ENABLED', False):
                return f(*args, **kwargs)
            origin = request.headers.get('Origin') or request.headers.get('Referer', '')
            if origin:
                allowed = app.config.get('CSRF_TRUSTED_ORIGINS', [])
                if allowed and not any(origin.startswith(o.rstrip('/')) for o in allowed):
                    return jsonify({'success': False, 'message': 'Ugyldig forespørselskilde.'}), 400
        return f(*args, **kwargs)
    return wrapper

@app.route('/login')
def login_page():
    if 'username' in session:
        return redirect(url_for('chat_page'))
    resp = make_response(render_template('login.html'))
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    resp.headers['Pragma'] = 'no-cache'
    resp.headers['Expires'] = '0'
    return resp

@app.route('/chat')
def chat_page():
    if 'username' not in session:
        return redirect(url_for('login_page'))
    return render_template('chat.html',
        username=session.get('username'),
        turn_url=os.environ.get('TURN_URL', ''),
        turn_user=os.environ.get('TURN_USER', ''),
    )

# ──────────────────────────────────────────────
# Recovery codes for password reset
# ──────────────────────────────────────────────
def generate_recovery_codes(count=5):
    codes = []
    hashed = []
    for _ in range(count):
        code = secrets.token_hex(4).upper()
        code_formatted = f"{code[:4]}-{code[4:8]}"
        codes.append(code_formatted)
        hashed.append(hashlib.sha256(code_formatted.encode()).hexdigest())
    return codes, hashed

def verify_recovery_code(code_input, stored_hashes):
    code = code_input.strip().upper().replace('-', '')
    if len(code) != 8:
        return False, -1
    code_formatted = f"{code[:4]}-{code[4:8]}"
    code_hash = hashlib.sha256(code_formatted.encode()).hexdigest()
    for i, h in enumerate(stored_hashes):
        if h == code_hash:
            return True, i
    return False, -1

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
    if not password_strength_ok(password):
        return jsonify({'success': False, 'message': 'Passordet må være minst 10 tegn og inneholde store og små bokstaver, tall og spesialtegn (!@#$%...).'}), 400
    users = load_json(USERS_FILE, {})
    if username in users:
        return jsonify({'success': False, 'message': 'Brukernavnet er opptatt.'}), 400
    recovery_codes_plain, recovery_codes_hashed = generate_recovery_codes()
    users[username] = {
        'password_hash': generate_password_hash(password),
        'created_at': now_iso(),
        'theme': 'dark',
        'is_admin': False,
        'twofa_enabled': False,
        'twofa_secret_hash': None,
        'identity_keypair': generate_identity_keypair(),
        'notifications_enabled': True,
        'recovery_codes': recovery_codes_hashed,
    }
    save_json(USERS_FILE, users)
    session['username'] = username
    session_id = secrets.token_hex(16)
    session['session_token'] = session_id
    audit('registered', actor=username, target=username)
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
    users = load_json(USERS_FILE, {})
    user = users.get(username)
    if not user or not check_password_hash(user.get('password_hash', ''), password):
        audit('login_failed', actor=username, target=username, meta='invalid_credentials')
        return jsonify({'success': False, 'message': 'Ugyldig brukernavn eller passord.'}), 401
    if user.get('banned'):
        return jsonify({'success': False, 'message': 'Kontoen din er utestengt.'}), 403
    if user.get('twofa_enabled') and user.get('twofa_secret_hash'):
        totp = pyotp.TOTP(_decrypt_2fa_secret(user['twofa_secret_hash']))
        if not totp.verify(twofa_code):
            audit('login_failed', actor=username, target=username, meta='bad_2fa')
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
    audit('login_success', actor=username, target=username)
    return jsonify({'success': True})

@app.route('/auth/logout', methods=['POST'])
@rate_limit(max_requests=30, window_seconds=60)
@require_csrf
def logout():
    username = session.get('username', '')
    session_id = session.get('session_token', '')
    if username and session_id:
        invalidate_session(username, session_id)
    session.clear()
    audit('logout', actor=username, target=username)
    return jsonify({'success': True})

@app.route('/auth/logout-all', methods=['POST'])
@rate_limit(max_requests=10, window_seconds=300)
@require_csrf
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
@rate_limit(max_requests=20, window_seconds=120)
@require_login
def revoke_session(session_id):
    username = session['username']
    if session_id == session.get('session_token'):
        return jsonify({'success': False, 'message': 'Kan ikke avbryte nåværende økt.'}), 400
    invalidate_session(username, session_id)
    return jsonify({'success': True})

@app.route('/auth/2fa/enable', methods=['POST'])
@rate_limit(max_requests=5, window_seconds=600)
@require_csrf
def enable_2fa():
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(name=username, issuer_name='CryptoChat')
    users = load_json(USERS_FILE, {})
    users[username]['twofa_secret_hash'] = _encrypt_2fa_secret(secret)
    users[username]['twofa_enabled'] = True
    save_json(USERS_FILE, users)
    audit('twofa_enabled', actor=username, target=username)
    return jsonify({'success': True, 'secret': secret, 'uri': uri})

@app.route('/auth/2fa/disable', methods=['POST'])
@rate_limit(max_requests=5, window_seconds=600)
@require_csrf
def disable_2fa():
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    users = load_json(USERS_FILE, {})
    users[username]['twofa_enabled'] = False
    users[username]['twofa_secret_hash'] = None
    save_json(USERS_FILE, users)
    audit('twofa_disabled', actor=username, target=username)
    return jsonify({'success': True})

@app.route('/auth/recovery', methods=['POST'])
@rate_limit(max_requests=5, window_seconds=300)
def recover_password():
    data = request.get_json(force=True, silent=True) or {}
    username = (data.get('username') or '').strip().lower()
    code = (data.get('code') or '').strip()
    new_password = data.get('new_password') or ''
    if not username or not code or not new_password:
        return jsonify({'success': False, 'message': 'Brukernavn, kode og nytt passord er påkrevd.'}), 400
    if not password_strength_ok(new_password):
        return jsonify({'success': False, 'message': 'Det nye passordet er ikke sterkt nok.'}), 400
    users = load_json(USERS_FILE, {})
    user = users.get(username)
    if not user:
        return jsonify({'success': False, 'message': 'Ugyldig kode eller bruker.'}), 401
    stored_hashes = user.get('recovery_codes', [])
    if not stored_hashes:
        return jsonify({'success': False, 'message': 'Ingen gjenopprettingskoder funnet for denne brukeren.'}), 401
    valid, idx = verify_recovery_code(code, stored_hashes)
    if not valid:
        audit('recovery_failed', actor=username, target=username, meta='invalid_code')
        return jsonify({'success': False, 'message': 'Ugyldig gjenopprettingskode.'}), 401
    stored_hashes.pop(idx)
    users[username]['recovery_codes'] = stored_hashes
    users[username]['password_hash'] = generate_password_hash(new_password)
    save_json(USERS_FILE, users)
    invalidate_all_sessions(username)
    audit('password_recovered', actor=username, target=username)
    return jsonify({'success': True, 'message': 'Passord tilbakestilt. Logg inn med det nye passordet.', 'codes_remaining': len(stored_hashes)})

@app.route('/auth/session/pin', methods=['POST'])
@rate_limit(max_requests=5, window_seconds=60)
@require_login
def session_pin():
    data = request.get_json(force=True, silent=True) or {}
    pin = (data.get('pin') or '').strip()
    if not pin:
        return jsonify({'success': False, 'message': 'PIN mangler.'}), 400
    users = load_json(USERS_FILE, {})
    me = session.get('username')
    user = users.get(me) if me else None
    if not user:
        return jsonify({'success': False, 'message': 'Bruker ikke funnet.'}), 404
    expected = user.get('session_pin')
    if expected and expected == hashlib.sha256(pin.encode()).hexdigest()[:16]:
        session['unlocked'] = True
        return jsonify({'success': True})
    return jsonify({'success': False, 'message': 'Feil PIN.'}), 401

@app.route('/auth/recovery/generate', methods=['POST'])
@rate_limit(max_requests=3, window_seconds=3600)
@require_login
@require_csrf
def regenerate_recovery_codes():
    me = session['username']
    users = load_json(USERS_FILE, {})
    if me not in users:
        return jsonify({'success': False, 'message': 'Bruker ikke funnet.'}), 404
    codes_plain, codes_hashed = generate_recovery_codes()
    users[me]['recovery_codes'] = codes_hashed
    save_json(USERS_FILE, users)
    audit('recovery_codes_regenerated', actor=me, target=me)
    return jsonify({'success': True, 'recovery_codes': codes_plain})

# ──────────────────────────────────────────────
# Presence
# ──────────────────────────────────────────────
@app.route('/presence/batch', methods=['POST'])
@rate_limit(max_requests=60, window_seconds=60)
@require_login
def presence_batch():
    data = request.get_json(force=True, silent=True) or {}
    users = data.get('users', [])
    presence = load_json(USER_PRESENCE_FILE, {})
    now = datetime.utcnow()
    result = []
    for u in users:
        entry = presence.get(u)
        ts = entry.get('lastSeen') if isinstance(entry, dict) else entry
        last_dt = parse_iso(ts)
        online = bool(last_dt and (now - last_dt) < timedelta(minutes=5))
        result.append({'username': u, 'online': online, 'lastSeen': ts})
    return jsonify({'success': True, 'presence': result})

# ──────────────────────────────────────────────
# Public key identity
# ──────────────────────────────────────────────
@app.route('/key/publish', methods=['POST'])
@rate_limit(max_requests=20, window_seconds=120)
@require_csrf
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
        audit('key_published', actor=session['username'], target=session['username'])
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
@rate_limit(max_requests=20, window_seconds=120)
@require_csrf
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
@rate_limit(max_requests=30, window_seconds=120)
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
@require_login
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
    resp.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin') or ''
    resp.headers['Vary'] = 'Origin'
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
    limit = min(int(request.args.get('limit', 200)), 500)
    offset = max(int(request.args.get('offset', 0)), 0)
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
            'effect': m.get('effect'),
        })
    filtered.sort(key=lambda x: x['timestamp'])
    total = len(filtered)
    filtered = filtered[offset:offset + limit]
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
    return jsonify({'success': True, 'messages': filtered, 'pair_key': pk, 'total': total, 'has_more': (offset + limit) < total})

@app.route('/send', methods=['POST'])
@rate_limit(max_requests=30, window_seconds=60)
@require_csrf
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
    effect = (data.get('effect') or '').strip() or None
    if effect and effect not in ('confetti', 'hearts', 'fireworks', 'snow', 'stars'):
        effect = None
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
        'effect': effect,
    })
    save_json(MESSAGES_FILE, messages)
    audit('message_sent', actor=session['username'], target=recipient, meta=mtype)
    return jsonify({'success': True, 'message': 'Melding sendt.'})

@app.route('/upload', methods=['POST'])
@rate_limit(max_requests=20, window_seconds=120)
@require_csrf
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
    if not filename:
        return jsonify({'success': False, 'message': 'Ugyldig filnavn.'}), 400
    target = os.path.join(app.config['UPLOAD_FOLDER'], f"{time.time()}_{filename}")
    abs_target = os.path.abspath(target)
    abs_root = os.path.abspath(app.config['UPLOAD_FOLDER'])
    if not abs_target.startswith(abs_root + os.sep):
        return jsonify({'success': False, 'message': 'Ugyldig filsti.'}), 400
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
@rate_limit(max_requests=60, window_seconds=60)
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
@rate_limit(max_requests=60, window_seconds=60)
@require_login
def get_notifications():
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    notify = load_json(NOTIFICATIONS_FILE, {})
    entries = notify.get(username, [])
    return jsonify({'success': True, 'notifications': entries})

def create_notification(username, type_, message, data=None):
    data = data or {}
    entry = {
        'type': type_,
        'message': message,
        'data': data,
        'read': False,
        'created': now_iso(),
    }
    notify = load_json(NOTIFICATIONS_FILE, {})
    notify.setdefault(username, [])
    notify[username].append(entry)
    if len(notify[username]) > 500:
        notify[username] = notify[username][-200:]
    save_json(NOTIFICATIONS_FILE, notify)
    return entry

@app.route('/notifications', methods=['POST'])
@rate_limit(max_requests=30, window_seconds=120)
@require_login
def add_notification():
    me = session['username']
    payload = request.get_json(force=True, silent=True) or {}
    type_ = (payload.get('type') or 'info').strip()
    message = (payload.get('message') or '').strip()
    if not message:
        return jsonify({'success': False, 'message': 'Mangler melding.'}), 400
    entry = create_notification(me, type_, message, payload.get('data') or {})
    return jsonify({'success': True, 'notification': entry})

@app.route('/notifications/read', methods=['POST'])
@rate_limit(max_requests=30, window_seconds=120)
@require_login
def mark_notifications_read():
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    payload = request.get_json(force=True, silent=True) or {}
    ids = payload.get('ids') or []
    if not isinstance(ids, list):
        return jsonify({'success': False, 'message': 'ids må være liste.'}), 400
    notify = load_json(NOTIFICATIONS_FILE, {})
    entries = notify.get(username, [])
    read_set = set(str(i) for i in ids)
    updated = 0
    for i, item in enumerate(entries):
        if str(i) in read_set and item.get('read') is False:
            entries[i]['read'] = True
            updated += 1
    save_json(NOTIFICATIONS_FILE, notify)
    return jsonify({'success': True, 'updated': updated})

# ──────────────────────────────────────────────
# Groups
# ──────────────────────────────────────────────
# Group E2EE key distribution
# ──────────────────────────────────────────────
@app.route('/groups/<group_id>/keys', methods=['POST'])
@rate_limit(max_requests=20, window_seconds=120)
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
@rate_limit(max_requests=10, window_seconds=300)
@require_csrf
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
    audit('group_created', actor=session['username'], target=group_id, meta=name)
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
                'effect': m.get('effect'),
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
@rate_limit(max_requests=10, window_seconds=300)
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
@rate_limit(max_requests=30, window_seconds=120)
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
            all_msgs = load_json(MESSAGES_FILE, [])
            user_msgs = [m for m in all_msgs if m.get('group_id') == group_id and m.get('sender') == session['username']]
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
@rate_limit(max_requests=60, window_seconds=60)
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
@rate_limit(max_requests=60, window_seconds=60)
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
@rate_limit(max_requests=30, window_seconds=60)
@require_csrf
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
            audit('message_edited', actor=username, target=message_id)
            return jsonify({'success': True})
    return jsonify({'success': False, 'message': 'Melding ikke funnet.'}), 404

@app.route('/messages/<message_id>', methods=['DELETE'])
@rate_limit(max_requests=30, window_seconds=60)
@require_csrf
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
            audit('message_deleted', actor=username, target=message_id)
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
@rate_limit(max_requests=20, window_seconds=120)
@require_csrf
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

@app.route('/profile/avatar', methods=['POST'])
@rate_limit(max_requests=10, window_seconds=300)
@require_csrf
def upload_avatar():
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    file = request.files.get('file')
    if not file or not file.filename:
        return jsonify({'success': False, 'message': 'Ingen fil valgt.'}), 400
    allowed = {'image/png', 'image/jpeg', 'image/webp', 'image/gif'}
    if file.content_type not in allowed:
        return jsonify({'success': False, 'message': 'Kun PNG, JPEG, WebP og GIF er tillatt.'}), 400
    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    if size > 2 * 1024 * 1024:
        return jsonify({'success': False, 'message': 'Filen er for stor (maks 2 MB).'}), 400
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else 'png'
    data_b64 = base64.b64encode(file.read()).decode()
    avatar_data = f"data:image/{ext};base64,{data_b64}"
    users = load_json(USERS_FILE, {})
    users[username]['avatar'] = avatar_data
    save_json(USERS_FILE, users)
    audit('avatar_updated', actor=username, target=username)
    return jsonify({'success': True, 'avatar': avatar_data})

@app.route('/profile/avatar/<target_user>')
def get_avatar(target_user):
    users = load_json(USERS_FILE, {})
    user = users.get(target_user, {})
    avatar = user.get('avatar', '')
    if not avatar:
        return '', 204
    return jsonify({'avatar': avatar})

@app.route('/profile/pin', methods=['POST'])
@rate_limit(max_requests=5, window_seconds=60)
@require_csrf
def set_profile_pin():
    data = request.get_json(force=True, silent=True) or {}
    pin = (data.get('pin') or '').strip()
    if not pin or len(pin) < 4:
        return jsonify({'success': False, 'message': 'PIN må være minst 4 siffer.'}), 400
    username = session.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'Ikke innlogget.'}), 401
    users = load_json(USERS_FILE, {})
    users[username]['session_pin'] = hashlib.sha256(pin.encode()).hexdigest()[:16]
    save_json(USERS_FILE, users)
    audit('session_pin_set', actor=username, target=username)
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
@rate_limit(max_requests=20, window_seconds=120)
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
@rate_limit(max_requests=20, window_seconds=120)
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
@rate_limit(max_requests=60, window_seconds=60)
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
    active_sessions = 0
    for user_sessions in sessions.values():
        if isinstance(user_sessions, dict):
            for sid, sdata in user_sessions.items():
                if isinstance(sdata, dict) and sdata.get('active'):
                    active_sessions += 1
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
@rate_limit(max_requests=10, window_seconds=300)
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
@rate_limit(max_requests=10, window_seconds=300)
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
@rate_limit(max_requests=10, window_seconds=300)
@require_admin
def admin_unban_user(username):
    users = load_json(USERS_FILE, {})
    if username not in users:
        return jsonify({'success': False, 'message': 'Bruker ikke funnet.'}), 404
    users[username]['banned'] = False
    save_json(USERS_FILE, users)
    return jsonify({'success': True})

@app.route('/admin/users/<username>/delete', methods=['POST'])
@rate_limit(max_requests=10, window_seconds=300)
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
@require_admin
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
@rate_limit(max_requests=10, window_seconds=600)
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
@rate_limit(max_requests=10, window_seconds=120)
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
@rate_limit(max_requests=10, window_seconds=120)
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
@rate_limit(max_requests=10, window_seconds=300)
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
@rate_limit(max_requests=60, window_seconds=60)
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
@rate_limit(max_requests=20, window_seconds=300)
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
    for m in messages:
        sf = m.get('scheduled_for')
        if not sf or m.get('cancelled'):
            continue
        try:
            sched_dt = datetime.fromisoformat(sf.replace('Z', '+00:00')).replace(tzinfo=None)
        except Exception:
            continue
        if sched_dt <= now:
            m['scheduled_for'] = None
            m['timestamp'] = now.isoformat()
            changed = True
            audit('scheduled_delivered', actor=m.get('sender', ''), target=m.get('recipient', ''))
    if changed:
        save_json(MESSAGES_FILE, messages)
        save_json(SCHEDULED_FILE, scheduled)

def cleanup_disappearing_messages():
    messages = load_json(MESSAGES_FILE, [])
    now = datetime.utcnow()
    before = len(messages)
    cleaned = []
    for m in messages:
        sda = m.get('self_destruct_at')
        if not sda:
            cleaned.append(m)
            continue
        parsed = parse_iso(sda)
        if parsed and parsed.replace(tzinfo=None) > now:
            cleaned.append(m)
    if len(cleaned) < before:
        save_json(MESSAGES_FILE, cleaned)

def cleanup_typing_indicators():
    typing = load_json(TYPING_FILE, {})
    now = datetime.utcnow()
    changed = False
    for user in list(typing.keys()):
        for target in list(typing[user].keys()):
            ts = parse_iso(typing[user][target])
            if not ts or (now - ts.replace(tzinfo=None)) > timedelta(minutes=5):
                del typing[user][target]
                changed = True
        if not typing[user]:
            del typing[user]
            changed = True
    if changed:
        save_json(TYPING_FILE, typing)

def _background_worker():
    import threading
    while True:
        time.sleep(60)
        try:
            deliver_scheduled_messages()
            cleanup_disappearing_messages()
            cleanup_typing_indicators()
        except Exception:
            pass

_bg_thread = threading.Thread(target=_background_worker, daemon=True)
_bg_thread.start()

@app.before_request
def touch_session():
    pass

# ──────────────────────────────────────────────
# Forward Messages
# ──────────────────────────────────────────────
@app.route('/messages/<message_id>/forward', methods=['POST'])
@rate_limit(max_requests=30, window_seconds=120)
@require_login
@require_csrf
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
@rate_limit(max_requests=30, window_seconds=60)
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
# Last Messages (sidebar previews)
# ──────────────────────────────────────────────
@app.route('/last-messages')
@require_login
def last_messages_preview():
    me = session['username']
    messages = load_json(MESSAGES_FILE, [])
    groups = load_json(GROUPS_FILE, [])
    last_by_user = {}
    last_by_group = {}
    for m in messages:
        ts = m.get('timestamp', '')
        sender = m.get('sender', '')
        recipient = m.get('recipient', '')
        group_id = m.get('group_id', '')
        text = m.get('ciphertext', '')
        mtype = m.get('type', 'text')
        if group_id:
            gid = group_id
            if me not in [u for u in (m.get('members', []) if isinstance(m.get('members'), list) else [])] and m.get('sender') != me:
                grp = next((g for g in groups if g.get('id') == gid), None)
                if grp and me not in grp.get('members', []):
                    continue
            if gid not in last_by_group or ts > last_by_group[gid].get('timestamp', ''):
                snippet = text[:80] if mtype == 'text' else ('📎 Fil' if mtype == 'file' else '📊 Avstemning' if mtype == 'poll' else '🎙 Lyd' if mtype == 'voice' else '📷 Bilde' if mtype == 'image' else '💬')
                last_by_group[gid] = {
                    'text': snippet,
                    'timestamp': ts,
                    'sender': sender,
                }
        elif recipient == me and sender != me:
            if sender not in last_by_user or ts > last_by_user[sender].get('timestamp', ''):
                snippet = text[:80] if mtype == 'text' else ('📎 Fil' if mtype == 'file' else '📊 Avstemning' if mtype == 'poll' else '🎙 Lyd' if mtype == 'voice' else '📷 Bilde' if mtype == 'image' else '💬')
                last_by_user[sender] = {
                    'text': snippet,
                    'timestamp': ts,
                    'sender': sender,
                }
        elif sender == me and recipient != me:
            if recipient not in last_by_user or ts > last_by_user[recipient].get('timestamp', ''):
                snippet = text[:80] if mtype == 'text' else ('📎 Fil' if mtype == 'file' else '📊 Avstemning' if mtype == 'poll' else '🎙 Lyd' if mtype == 'voice' else '📷 Bilde' if mtype == 'image' else '💬')
                last_by_user[recipient] = {
                    'text': 'Du: ' + snippet,
                    'timestamp': ts,
                    'sender': me,
                }
    return jsonify({'success': True, 'users': last_by_user, 'groups': last_by_group})

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
@rate_limit(max_requests=20, window_seconds=120)
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
@rate_limit(max_requests=60, window_seconds=60)
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
@rate_limit(max_requests=20, window_seconds=300)
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
    },
    'reactions': {
        'name': 'Reaksjoner',
        'stickers': [
            {'id': 'r1', 'emoji': '✅', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%2322c55e"/%3E%3Cpath d="M30 50 L45 65 L72 35" stroke="%23fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/%3E%3C/svg%3E'},
            {'id': 'r2', 'emoji': '❌', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%23e53935"/%3E%3Cpath d="M32 32 L68 68" stroke="%23fff" stroke-width="7" stroke-linecap="round"/%3E%3Cpath d="M68 32 L32 68" stroke="%23fff" stroke-width="7" stroke-linecap="round"/%3E%3C/svg%3E'},
            {'id': 'r3', 'emoji': '👍', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%23fdd835"/%3E%3Cpath d="M50 75 L50 50" stroke="%23333" stroke-width="8" stroke-linecap="round"/%3E%3Ccircle cx="50" cy="38" r="8" fill="%23333"/%3E%3Cpath d="M35 55 L50 50 L65 55" stroke="%23333" stroke-width="4" fill="none" stroke-linecap="round"/%3E%3C/svg%3E'},
            {'id': 'r4', 'emoji': '👎', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%2390a4ae"/%3E%3Cpath d="M50 25 L50 50" stroke="%23333" stroke-width="8" stroke-linecap="round"/%3E%3Ccircle cx="50" cy="62" r="8" fill="%23333"/%3E%3Cpath d="M35 45 L50 50 L65 45" stroke="%23333" stroke-width="4" fill="none" stroke-linecap="round"/%3E%3C/svg%3E'},
            {'id': 'r5', 'emoji': '😍', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%23fdd835"/%3E%3Ctext x="30" y="48" font-size="20" fill="%23e53935"%3E%E2%9D%A4%3C/text%3E%3Ctext x="55" y="48" font-size="20" fill="%23e53935"%3E%E2%9D%A4%3C/text%3E%3Cpath d="M35 60 Q50 75 65 60" stroke="%23333" stroke-width="3" fill="none"/%3E%3C/svg%3E'},
            {'id': 'r6', 'emoji': '😢', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%23fdd835"/%3E%3Ccircle cx="35" cy="42" r="5" fill="%23333"/%3E%3Ccircle cx="65" cy="42" r="5" fill="%23333"/%3E%3Cpath d="M30 55 Q50 70 70 55" stroke="%23333" stroke-width="3" fill="none"/%3E%3Cpath d="M30 48 Q28 60 32 65" stroke="%232196f3" stroke-width="3" fill="none"/%3E%3C/svg%3E'},
            {'id': 'r7', 'emoji': '🤦', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="55" r="40" fill="%23fdd835"/%3E%3Crect x="25" y="35" width="50" height="30" rx="5" fill="%238d6e63"/%3E%3Ccircle cx="50" cy="25" r="8" fill="%23333"/%3E%3Cpath d="M35 75 Q50 85 65 75" stroke="%23333" stroke-width="3" fill="none"/%3E%3C/svg%3E'},
            {'id': 'r8', 'emoji': '🤷', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%23fdd835"/%3E%3Ccircle cx="38" cy="40" r="4" fill="%23333"/%3E%3Ccircle cx="62" cy="40" r="4" fill="%23333"/%3E%3Cpath d="M42 62 Q50 68 58 62" stroke="%23333" stroke-width="3" fill="none"/%3E%3Cpath d="M20 35 L30 25" stroke="%23333" stroke-width="3" stroke-linecap="round"/%3E%3Cpath d="M80 35 L70 25" stroke="%23333" stroke-width="3" stroke-linecap="round"/%3E%3C/svg%3E'},
            {'id': 'r9', 'emoji': '🤔', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%23fdd835"/%3E%3Ccircle cx="38" cy="38" r="5" fill="%23333"/%3E%3Ccircle cx="62" cy="35" r="5" fill="%23333"/%3E%3Cpath d="M40 65 Q50 70 60 62" stroke="%23333" stroke-width="3" fill="none"/%3E%3Ccircle cx="75" cy="15" r="4" fill="%23333"/%3E%3Cpath d="M68 20 L62 28" stroke="%23333" stroke-width="3" stroke-linecap="round"/%3E%3C/svg%3E'},
            {'id': 'r10', 'emoji': '🤯', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="55" r="40" fill="%23fdd835"/%3E%3Ccircle cx="38" cy="48" r="6" fill="%23fff"/%3E%3Ccircle cx="62" cy="48" r="6" fill="%23fff"/%3E%3Ccircle cx="38" cy="48" r="3" fill="%23333"/%3E%3Ccircle cx="62" cy="48" r="3" fill="%23333"/%3E%3Cpath d="M40 68 Q50 78 60 68" stroke="%23333" stroke-width="3" fill="none"/%3E%3Cpath d="M20 25 L15 10" stroke="%23ff9800" stroke-width="3" stroke-linecap="round"/%3E%3Cpath d="M50 15 L50 5" stroke="%23ff9800" stroke-width="3" stroke-linecap="round"/%3E%3Cpath d="M80 25 L85 10" stroke="%23ff9800" stroke-width="3" stroke-linecap="round"/%3E%3C/svg%3E'},
            {'id': 'r11', 'emoji': '🥳', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%23fdd835"/%3E%3Ccircle cx="35" cy="42" r="5" fill="%23333"/%3E%3Ccircle cx="65" cy="42" r="5" fill="%23333"/%3E%3Cpath d="M35 60 Q50 78 65 60" stroke="%23333" stroke-width="3" fill="%23ff9800"/%3E%3Cpolygon points="50,5 55,18 45,18" fill="%237a3bff"/%3E%3Ccircle cx="20" cy="30" r="3" fill="%23e53935"/%3E%3Ccircle cx="80" cy="35" r="3" fill="%2322c55e"/%3E%3Ccircle cx="15" cy="60" r="2" fill="%232196f3"/%3E%3Ccircle cx="85" cy="55" r="2" fill="%23ff9800"/%3E%3C/svg%3E'},
            {'id': 'r12', 'emoji': '✨', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%23fdd835"/%3E%3Cpath d="M50 15 L55 35 L75 40 L55 45 L50 65 L45 45 L25 40 L45 35Z" fill="%23fff"/%3E%3Ccircle cx="30" cy="70" r="3" fill="%23fff"/%3E%3Ccircle cx="72" cy="72" r="2" fill="%23fff"/%3E%3C/svg%3E'},
        ]
    },
    'food': {
        'name': 'Mat',
        'stickers': [
            {'id': 'f1', 'emoji': '🍕', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Cpath d="M50 10 L10 90 L90 90Z" fill="%23fdd835" stroke="%23e6a800" stroke-width="2"/%3E%3Ccircle cx="40" cy="55" r="5" fill="%23e53935"/%3E%3Ccircle cx="60" cy="65" r="5" fill="%23e53935"/%3E%3Ccircle cx="50" cy="75" r="4" fill="%234caf50"/%3E%3C/svg%3E'},
            {'id': 'f2', 'emoji': '🍔', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Cellipse cx="50" cy="30" rx="38" ry="18" fill="%238d6e63"/%3E%3Crect x="15" y="45" width="70" height="12" rx="4" fill="%234caf50"/%3E%3Crect x="13" y="55" width="74" height="14" rx="4" fill="%23e53935"/%3E%3Cellipse cx="50" cy="80" rx="38" ry="14" fill="%23fdd835"/%3E%3C/svg%3E'},
            {'id': 'f3', 'emoji': '🌮', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Cpath d="M10 70 Q50 10 90 70" fill="%23fdd835" stroke="%23e6a800" stroke-width="2"/%3E%3Cpath d="M25 60 Q50 30 75 60" fill="%234caf50"/%3E%3Ccircle cx="40" cy="52" r="4" fill="%23e53935"/%3E%3Ccircle cx="58" cy="48" r="3" fill="%23ff9800"/%3E%3C/svg%3E'},
            {'id': 'f4', 'emoji': '🍣', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Cellipse cx="50" cy="60" rx="40" ry="18" fill="%23fff" stroke="%23ddd" stroke-width="2"/%3E%3Cellipse cx="50" cy="55" rx="28" ry="14" fill="%23e53935"/%3E%3Crect x="35" y="42" width="30" height="6" rx="3" fill="%23333"/%3E%3C/svg%3E'},
            {'id': 'f5', 'emoji': '☕', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect x="20" y="35" width="50" height="50" rx="8" fill="%238d6e63"/%3E%3Cpath d="M70 45 Q90 45 90 60 Q90 75 70 75" stroke="%238d6e63" stroke-width="4" fill="none"/%3E%3Cpath d="M30 35 Q30 20 40 18" stroke="%23999" stroke-width="2" fill="none"/%3E%3Cpath d="M45 35 Q45 22 50 20" stroke="%23999" stroke-width="2" fill="none"/%3E%3C/svg%3E'},
            {'id': 'f6', 'emoji': '🍺', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect x="20" y="25" width="45" height="60" rx="6" fill="%23fdd835"/%3E%3Crect x="65" y="35" width="15" height="35" rx="5" fill="%23fdd835" stroke="%23e6a800" stroke-width="2"/%3E%3Cellipse cx="42" cy="30" rx="20" ry="8" fill="%23fff" opacity=".6"/%3E%3C/svg%3E'},
            {'id': 'f7', 'emoji': '🎂', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect x="15" y="50" width="70" height="35" rx="6" fill="%23e91e63"/%3E%3Crect x="15" y="40" width="70" height="18" rx="6" fill="%23fff3e0"/%3E%3Crect x="45" y="20" width="10" height="25" rx="3" fill="%23fdd835"/%3E%3Ccircle cx="50" cy="18" r="5" fill="%23ff5722"/%3E%3C/svg%3E'},
            {'id': 'f8', 'emoji': '🍦', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Cpath d="M35 50 L50 95 L65 50" fill="%23fdd835"/%3E%3Ccircle cx="50" cy="40" r="22" fill="%23e91e63"/%3E%3Ccircle cx="38" cy="45" r="4" fill="%23fff" opacity=".5"/%3E%3Ccircle cx="55" cy="35" r="3" fill="%23fff" opacity=".5"/%3E%3C/svg%3E'},
        ]
    },
    'objects': {
        'name': 'Objekter',
        'stickers': [
            {'id': 'o1', 'emoji': '🚀', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Cpath d="M50 10 C50 10 30 35 30 60 L70 60 C70 35 50 10 50 10Z" fill="%23fff" stroke="%23ddd" stroke-width="2"/%3E%3Ccircle cx="50" cy="42" r="8" fill="%232196f3"/%3E%3Cpath d="M30 60 L20 75 L30 70" fill="%23e53935"/%3E%3Cpath d="M70 60 L80 75 L70 70" fill="%23e53935"/%3E%3Cpath d="M40 65 L50 90 L60 65" fill="%23ff9800"/%3E%3C/svg%3E'},
            {'id': 'o2', 'emoji': '⚡', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Cpolygon points="55,5 25,50 45,50 38,95 75,42 52,42" fill="%23fdd835" stroke="%23e6a800" stroke-width="2"/%3E%3C/svg%3E'},
            {'id': 'o3', 'emoji': '⭐', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Cpolygon points="50,8 61,38 95,38 68,58 78,90 50,70 22,90 32,58 5,38 39,38" fill="%23fdd835" stroke="%23e6a800" stroke-width="2"/%3E%3C/svg%3E'},
            {'id': 'o4', 'emoji': '👑', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Cpath d="M15 70 L10 30 L30 50 L50 20 L70 50 L90 30 L85 70Z" fill="%23fdd835" stroke="%23e6a800" stroke-width="2"/%3E%3Crect x="15" y="70" width="70" height="12" rx="3" fill="%23fdd835" stroke="%23e6a800" stroke-width="2"/%3E%3Ccircle cx="50" cy="76" r="4" fill="%23e53935"/%3E%3C/svg%3E'},
            {'id': 'o5', 'emoji': '❤️', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Cpath d="M50 88 C25 65 5 50 5 30 C5 15 18 5 30 5 C40 5 48 12 50 18 C52 12 60 5 70 5 C82 5 95 15 95 30 C95 50 75 65 50 88Z" fill="%23e53935"/%3E%3C/svg%3E'},
            {'id': 'o6', 'emoji': '💎', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Cpolygon points="50,8 75,35 50,92 25,35" fill="%232196f3" stroke="%231565c0" stroke-width="2"/%3E%3Cpolygon points="25,35 75,35" fill="%2342a5f5" stroke="%231565c0" stroke-width="1"/%3E%3Cpolygon points="25,35 35,55 50,92" fill="%231e88e5" stroke="none"/%3E%3C/svg%3E'},
            {'id': 'o7', 'emoji': '💣', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="58" r="32" fill="%23333"/%3E%3Crect x="47" y="18" width="6" height="15" rx="2" fill="%23795548"/%3E%3Cpath d="M53 18 Q65 10 60 22" stroke="%23ff9800" stroke-width="3" fill="none"/%3E%3Ccircle cx="62" cy="18" r="4" fill="%23ff9800"/%3E%3Ccircle cx="42" cy="50" r="3" fill="%23fff" opacity=".3"/%3E%3C/svg%3E'},
            {'id': 'o8', 'emoji': '🔮', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="45" r="35" fill="%237a3bff"/%3E%3Ccircle cx="42" cy="38" r="10" fill="%239c6fff" opacity=".6"/%3E%3Ccircle cx="55" cy="35" r="5" fill="%23fff" opacity=".3"/%3E%3Crect x="35" y="78" width="30" height="8" rx="4" fill="%23795548"/%3E%3Crect x="30" y="82" width="40" height="10" rx="5" fill="%23795548"/%3E%3C/svg%3E'},
        ]
    },
    'nature': {
        'name': 'Natur',
        'stickers': [
            {'id': 'n1', 'emoji': '☀️', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="25" fill="%23fdd835"/%3E%3Cg stroke="%23fdd835" stroke-width="4" stroke-linecap="round"%3E%3Cline x1="50" y1="8" x2="50" y2="18"/%3E%3Cline x1="50" y1="82" x2="50" y2="92"/%3E%3Cline x1="8" y1="50" x2="18" y2="50"/%3E%3Cline x1="82" y1="50" x2="92" y2="50"/%3E%3Cline x1="20" y1="20" x2="27" y2="27"/%3E%3Cline x1="73" y1="73" x2="80" y2="80"/%3E%3Cline x1="80" y1="20" x2="73" y2="27"/%3E%3Cline x1="27" y1="73" x2="20" y2="80"/%3E%3C/g%3E%3C/svg%3E'},
            {'id': 'n2', 'emoji': '🌙', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="40" fill="%23fdd835"/%3E%3Ccircle cx="35" cy="35" r="35" fill="%230f1826"/%3E%3Ccircle cx="70" cy="70" r="4" fill="%23fdd835" opacity=".6"/%3E%3Ccircle cx="80" cy="55" r="2" fill="%23fdd835" opacity=".4"/%3E%3C/svg%3E'},
            {'id': 'n3', 'emoji': '☁️', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Cellipse cx="50" cy="55" rx="35" ry="20" fill="%23e0e0e0"/%3E%3Ccircle cx="35" cy="48" r="18" fill="%23e0e0e0"/%3E%3Ccircle cx="58" cy="42" r="22" fill="%23e0e0e0"/%3E%3C/svg%3E'},
            {'id': 'n4', 'emoji': '🌧️', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Cellipse cx="50" cy="38" rx="30" ry="18" fill="%2390a4ae"/%3E%3Ccircle cx="35" cy="32" r="15" fill="%2390a4ae"/%3E%3Ccircle cx="58" cy="28" r="18" fill="%2390a4ae"/%3E%3Cline x1="30" y1="60" x2="25" y2="78" stroke="%232196f3" stroke-width="3" stroke-linecap="round"/%3E%3Cline x1="48" y1="60" x2="43" y2="82" stroke="%232196f3" stroke-width="3" stroke-linecap="round"/%3E%3Cline x1="65" y1="58" x2="60" y2="75" stroke="%232196f3" stroke-width="3" stroke-linecap="round"/%3E%3C/svg%3E'},
            {'id': 'n5', 'emoji': '❄️', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Cline x1="50" y1="10" x2="50" y2="90" stroke="%232196f3" stroke-width="4"/%3E%3Cline x1="10" y1="50" x2="90" y2="50" stroke="%232196f3" stroke-width="4"/%3E%3Cline x1="22" y1="22" x2="78" y2="78" stroke="%232196f3" stroke-width="3"/%3E%3Cline x1="78" y1="22" x2="22" y2="78" stroke="%232196f3" stroke-width="3"/%3E%3Ccircle cx="50" cy="50" r="6" fill="%232196f3"/%3E%3C/svg%3E'},
            {'id': 'n6', 'emoji': '🌸', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="8" fill="%23fdd835"/%3E%3Cellipse cx="50" cy="30" rx="10" ry="14" fill="%23f48fb1"/%3E%3Cellipse cx="50" cy="70" rx="10" ry="14" fill="%23f48fb1"/%3E%3Cellipse cx="30" cy="50" rx="14" ry="10" fill="%23f48fb1"/%3E%3Cellipse cx="70" cy="50" rx="14" ry="10" fill="%23f48fb1"/%3E%3C/svg%3E'},
            {'id': 'n7', 'emoji': '🌳', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect x="43" y="65" width="14" height="25" rx="3" fill="%23795548"/%3E%3Ccircle cx="50" cy="40" r="30" fill="%234caf50"/%3E%3Ccircle cx="35" cy="50" r="15" fill="%23388e3c"/%3E%3Ccircle cx="65" cy="50" r="15" fill="%23388e3c"/%3E%3C/svg%3E'},
            {'id': 'n8', 'emoji': '🏔️', 'url': 'data:image/svg+xml,' + '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Cpolygon points="50,10 90,90 10,90" fill="%23607d8b"/%3E%3Cpolygon points="50,10 65,40 35,40" fill="%23fff"/%3E%3Cpolygon points="30,90 55,45 70,60 90,90" fill="%2378909c"/%3E%3Cpolygon points="55,45 62,52 48,52" fill="%23fff"/%3E%3C/svg%3E'},
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
        url = 'https://tenor.googleapis.com/v2/search?q=' + urllib.parse.quote(query) + '&key=' + urllib.parse.quote(os.environ.get('TENOR_API_KEY', '')) + '&limit=20&media_filter=gif,tinygif'
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
@rate_limit(max_requests=30, window_seconds=120)
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
@rate_limit(max_requests=20, window_seconds=120)
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
# Group Member Management
# ──────────────────────────────────────────────
@app.route('/groups/<group_id>/members', methods=['GET'])
@require_login
def get_group_members(group_id):
    me = session['username']
    groups = load_json(GROUPS_FILE, [])
    group = next((g for g in groups if g.get('id') == group_id), None)
    if not group:
        return jsonify({'success': False, 'message': 'Gruppe ikke funnet.'}), 404
    if me not in group.get('members', []):
        return jsonify({'success': False, 'message': 'Ikke medlem.'}), 403
    users = load_json(USERS_FILE, {})
    presence = load_json(USER_PRESENCE_FILE, {})
    members = []
    for u in group.get('members', []):
        ud = users.get(u, {})
        p = presence.get(u, {})
        is_online = False
        if isinstance(p, dict) and p.get('lastSeen'):
            try:
                ls = parse_iso(p['lastSeen'])
                if ls and (datetime.utcnow() - ls.replace(tzinfo=None)).total_seconds() < 300:
                    is_online = True
            except Exception:
                pass
        members.append({
            'username': u,
            'displayName': ud.get('displayName', u),
            'role': 'owner' if u == group.get('created_by') else ('admin' if u in group.get('admins', []) else 'member'),
            'online': is_online,
            'lastSeen': p.get('lastSeen') if isinstance(p, dict) else None,
        })
    return jsonify({'success': True, 'members': members, 'total': len(members)})

@app.route('/groups/<group_id>/members', methods=['POST'])
@rate_limit(max_requests=20, window_seconds=120)
@require_login
def add_group_member(group_id):
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    target = sanitize_input(data.get('username', ''), 30).lower()
    if not target:
        return jsonify({'success': False, 'message': 'Brukernavn er påkrevd.'}), 400
    groups = load_json(GROUPS_FILE, [])
    group = next((g for g in groups if g.get('id') == group_id), None)
    if not group:
        return jsonify({'success': False, 'message': 'Gruppe ikke funnet.'}), 404
    if me not in group.get('members', []):
        return jsonify({'success': False, 'message': 'Ikke medlem.'}), 403
    if me != group.get('created_by') and me not in group.get('admins', []):
        return jsonify({'success': False, 'message': 'Mangler tillatelse.'}), 403
    users = load_json(USERS_FILE, {})
    if target not in users:
        return jsonify({'success': False, 'message': 'Bruker ikke funnet.'}), 404
    if target in group.get('members', []):
        return jsonify({'success': False, 'message': 'Allerede medlem.'}), 400
    group.setdefault('members', []).append(target)
    save_json(GROUPS_FILE, groups)
    return jsonify({'success': True, 'message': f'{target} lagt til.'})

@app.route('/groups/<group_id>/members/<username>', methods=['DELETE'])
@rate_limit(max_requests=20, window_seconds=120)
@require_login
def remove_group_member(group_id, username):
    me = session['username']
    groups = load_json(GROUPS_FILE, [])
    group = next((g for g in groups if g.get('id') == group_id), None)
    if not group:
        return jsonify({'success': False, 'message': 'Gruppe ikke funnet.'}), 404
    is_owner = me == group.get('created_by')
    is_admin = me in group.get('admins', [])
    is_self = me == username
    if not is_owner and not is_admin and not is_self:
        return jsonify({'success': False, 'message': 'Mangler tillatelse.'}), 403
    if username not in group.get('members', []):
        return jsonify({'success': False, 'message': 'Ikke medlem.'}), 400
    group['members'] = [m for m in group.get('members', []) if m != username]
    group['admins'] = [a for a in group.get('admins', []) if a != username]
    group['mods'] = [m for m in group.get('mods', []) if m != username]
    save_json(GROUPS_FILE, groups)
    keys_data = load_json(KEYS_FILE, {})
    e2ee_key = f"e2ee::{group_id}"
    if e2ee_key in keys_data and 'encrypted_keys' in keys_data[e2ee_key]:
        keys_data[e2ee_key]['encrypted_keys'].pop(username, None)
        keys_data[e2ee_key]['rekeyed'] = now_iso()
        save_json(KEYS_FILE, keys_data)
    return jsonify({'success': True, 'message': f'{username} fjernet.'})

@app.route('/groups/<group_id>/leave', methods=['POST'])
@rate_limit(max_requests=20, window_seconds=120)
@require_login
def leave_group(group_id):
    me = session['username']
    groups = load_json(GROUPS_FILE, [])
    group = next((g for g in groups if g.get('id') == group_id), None)
    if not group:
        return jsonify({'success': False, 'message': 'Gruppe ikke funnet.'}), 404
    if me not in group.get('members', []):
        return jsonify({'success': False, 'message': 'Ikke medlem.'}), 400
    if me == group.get('created_by'):
        return jsonify({'success': False, 'message': 'Oppretter kan ikke forlate. Slett gruppen i stedet.'}), 400
    group['members'] = [m for m in group.get('members', []) if m != me]
    group['admins'] = [a for a in group.get('admins', []) if a != me]
    group['mods'] = [m for m in group.get('mods', []) if m != me]
    save_json(GROUPS_FILE, groups)
    keys_data = load_json(KEYS_FILE, {})
    e2ee_key = f"e2ee::{group_id}"
    if e2ee_key in keys_data and 'encrypted_keys' in keys_data[e2ee_key]:
        keys_data[e2ee_key]['encrypted_keys'].pop(me, None)
        save_json(KEYS_FILE, keys_data)
    return jsonify({'success': True, 'message': 'Forlatt gruppe.'})

# ──────────────────────────────────────────────
# Group E2EE Key Rotation
# ──────────────────────────────────────────────
@app.route('/groups/<group_id>/keys/rotate', methods=['POST'])
@rate_limit(max_requests=10, window_seconds=300)
@require_login
def rotate_group_key(group_id):
    me = session['username']
    groups = load_json(GROUPS_FILE, [])
    group = next((g for g in groups if g.get('id') == group_id), None)
    if not group:
        return jsonify({'success': False, 'message': 'Gruppe ikke funnet.'}), 404
    if me != group.get('created_by') and me not in group.get('admins', []):
        return jsonify({'success': False, 'message': 'Mangler tillatelse.'}), 403
    keys_data = load_json(KEYS_FILE, {})
    e2ee_key = f"e2ee::{group_id}"
    keys_data[e2ee_key] = {
        'encrypted_keys': {},
        'uploaded_by': me,
        'updated': now_iso(),
        'rotation_id': secrets.token_hex(8),
    }
    save_json(KEYS_FILE, keys_data)
    return jsonify({'success': True, 'message': 'Nøkkel rotert. Last inn nøkler på nytt.'})

# ──────────────────────────────────────────────
# Multi-Device Key Sync
# ──────────────────────────────────────────────
@app.route('/sync/keys', methods=['POST'])
@rate_limit(max_requests=20, window_seconds=120)
@require_login
def sync_upload_key():
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    public_key = data.get('publicKey', '')
    device_id = sanitize_input(data.get('deviceId', ''), 64)
    if not public_key:
        return jsonify({'success': False, 'message': 'Manglende nøkkel.'}), 400
    users = load_json(USERS_FILE, {})
    user = users.get(me, {})
    synced = user.setdefault('synced_keys', {})
    synced[device_id] = {
        'publicKey': public_key,
        'updated': now_iso(),
    }
    save_json(USERS_FILE, users)
    return jsonify({'success': True})

@app.route('/sync/keys', methods=['GET'])
@require_login
def sync_get_keys():
    me = session['username']
    users = load_json(USERS_FILE, {})
    user = users.get(me, {})
    synced = user.get('synced_keys', {})
    own_public = user.get('identity_keypair', {}).get('public', '')
    return jsonify({'success': True, 'syncedKeys': synced, 'ownPublicKey': own_public})

@app.route('/sync/keys/<device_id>', methods=['DELETE'])
@rate_limit(max_requests=20, window_seconds=120)
@require_login
def sync_remove_key(device_id):
    me = session['username']
    users = load_json(USERS_FILE, {})
    user = users.get(me, {})
    synced = user.get('synced_keys', {})
    synced.pop(device_id, None)
    save_json(USERS_FILE, users)
    return jsonify({'success': True})

# ──────────────────────────────────────────────
# SECRET_KEY Rotation
# ──────────────────────────────────────────────
@app.route('/auth/change-password', methods=['POST'])
@rate_limit(max_requests=5, window_seconds=300)
@require_csrf
@require_login
def change_password():
    data = request.get_json(force=True, silent=True) or {}
    old_password = data.get('old_password', '')
    new_password = data.get('new_password', '')
    if not old_password or not new_password:
        return jsonify({'success': False, 'message': 'Gamelt og nytt passord er påkrevd.'}), 400
    if not password_strength_ok(new_password):
        return jsonify({'success': False, 'message': 'Det nye passordet er ikke sterkt nok. Minst 10 tegn med store/små bokstaver, tall og spesialtegn.'}), 400
    username = session.get('username')
    users = load_json(USERS_FILE, {})
    user = users.get(username)
    if not user or not check_password_hash(user.get('password_hash', ''), old_password):
        return jsonify({'success': False, 'message': 'Feil gamalt passord.'}), 401
    users[username]['password_hash'] = generate_password_hash(new_password)
    save_json(USERS_FILE, users)
    invalidate_all_sessions(username)
    session.clear()
    audit('password_changed', actor=username, target=username)
    return jsonify({'success': True, 'message': 'Passord endra. Logg inn på nytt.'})


@app.route('/admin/rotate-secret', methods=['POST'])
@require_login
@require_admin
def rotate_secret_key():
    me = session['username']
    new_key = secrets.token_bytes(32)
    key_path = Path('secrets/secret_key')
    key_path.parent.mkdir(parents=True, exist_ok=True)
    key_path.write_bytes(new_key)
    key_path.chmod(0o600)
    app.secret_key = new_key
    invalidate_all_sessions(me)
    session.clear()
    audit('secret_rotated', actor=me, target=me)
    return jsonify({'success': True, 'message': 'SECRET_KEY rotert. Logg inn på nytt.'})

# ──────────────────────────────────────────────
# Draft Messages
# ──────────────────────────────────────────────
DRAFTS_FILE = DATA_DIR / 'drafts.json'

@app.route('/drafts', methods=['POST'])
@rate_limit(max_requests=60, window_seconds=60)
@require_login
@require_csrf
def save_draft():
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    target = sanitize_input(data.get('target', ''), 30).lower()
    text = sanitize_input(data.get('text', ''), 5000)
    drafts = load_json(DRAFTS_FILE, {})
    drafts.setdefault(me, {})
    if text:
        drafts[me][target] = {'text': _encrypt_payload(text), 'updated_at': datetime.utcnow().isoformat()}
    else:
        drafts[me].pop(target, None)
        if not drafts[me]:
            drafts.pop(me, None)
    save_json(DRAFTS_FILE, drafts)
    return jsonify({'success': True})

@app.route('/drafts')
@require_login
def get_drafts():
    me = session['username']
    drafts = load_json(DRAFTS_FILE, {})
    out = {}
    for target, item in (drafts.get(me) or {}).items():
        try:
            out[target] = {'text': _decrypt_payload(item['text']), 'updated_at': item.get('updated_at')}
        except Exception:
            out[target] = {'text': '', 'updated_at': item.get('updated_at')}
    return jsonify({'success': True, 'drafts': out})

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
@rate_limit(max_requests=20, window_seconds=120)
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
@rate_limit(max_requests=10, window_seconds=300)
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
    item = dict(subscription)
    item['_payload'] = _encrypt_payload(json.dumps(item, ensure_ascii=False))
    subs[me].append(item)
    save_json(PUSH_SUBSCRIPTIONS_FILE, subs)
    return jsonify({'success': True})

@app.route('/push/unsubscribe', methods=['POST'])
@rate_limit(max_requests=10, window_seconds=300)
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
@rate_limit(max_requests=20, window_seconds=120)
@require_login
def get_link_preview():
    url = (request.args.get('url') or '').strip()
    if not url:
        return jsonify({'success': True, 'preview': None})
    try:
        parsed = urlparse(url)
        host = (parsed.hostname or '').lower()
        allowed_hosts = {'tenor.googleapis.com', 'giphy.com', 'imgur.com', 'i.imgur.com'}
        if parsed.scheme not in ('https',) or host not in allowed_hosts:
            return jsonify({'success': True, 'preview': None})
    except Exception:
        return jsonify({'success': True, 'preview': None})
    cache = load_json(LINK_PREVIEWS_FILE, {})
    if url in cache:
        return jsonify({'success': True, 'preview': cache[url]})
    try:
        import urllib.request
        import socket

        class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, req, fp, code, msg, headers, newurl):
                raise urllib.error.HTTPError(newurl, code, msg, headers, fp)

        opener = urllib.request.build_opener(NoRedirectHandler)
        req = urllib.request.Request(url, headers={'User-Agent': 'CryptoChat/1.0'})
        with opener.open(req, timeout=5) as resp:
            final_url = resp.geturl()
            if final_url != url:
                return jsonify({'success': True, 'preview': None})
            html = resp.read(200000).decode('utf-8', errors='ignore')
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
            for k in oldest:
                del cache[k]
        save_json(LINK_PREVIEWS_FILE, cache)
        return jsonify({'success': True, 'preview': preview})
    except Exception:
        return jsonify({'success': True, 'preview': None})



# ──────────────────────────────────────────────
# Key Rotation
# ──────────────────────────────────────────────
@app.route('/key/rotate', methods=['POST'])
@rate_limit(max_requests=5, window_seconds=600)
@require_login
@require_csrf
def rotate_key():
    me = session['username']
    users = load_json(USERS_FILE, {})
    if me not in users:
        return jsonify({'success': False, 'message': 'Bruker ikke funnet.'}), 404
    new_keypair = generate_identity_keypair()
    users[me]['identity_keypair'] = new_keypair
    users[me]['key_rotated_at'] = now_iso()
    save_json(USERS_FILE, users)
    audit('key_rotated', actor=me, target=me)
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
        'description': 'Ende-til-ende-kryptert chat',
        'start_url': '/chat',
        'scope': '/',
        'display': 'standalone',
        'background_color': '#0b0c12',
        'theme_color': '#cf6fef',
        'orientation': 'portrait-primary',
        'categories': ['social', 'communication'],
        'shortcuts': [
            {
                'name': 'Åpne samtaler',
                'url': '/chat'
            }
        ],
        'prefer_related_applications': False,
        'icons': [
            {'src': '/static/img/icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any maskable'},
            {'src': '/static/img/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any maskable'}
        ]
    })

@app.route('/sw.js')
def service_worker():
    sw = """
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll(clients => {
        for (const c of clients) { if (c.url.includes('/chat')) c.navigate('/chat'); }
      }))
  );
});
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
"""
    return Response(sw, mimetype='application/javascript')

@app.route('/offline.html')
def offline_page():
    return render_template('offline.html')

# ──────────────────────────────────────────────
# Pinned Chats (per-user sidebar pinning)
# ──────────────────────────────────────────────
@app.route('/pinned-chats', methods=['GET'])
@require_login
def get_pinned_chats():
    me = session['username']
    pins = load_json(PINNED_CHATS_FILE, {})
    return jsonify({'success': True, 'pinned': pins.get(me, [])})

@app.route('/pinned-chats', methods=['POST'])
@rate_limit(max_requests=30, window_seconds=120)
@require_login
def toggle_pinned_chat():
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    chat_id = data.get('chatId', '')
    chat_type = data.get('chatType', 'user')
    if not chat_id:
        return jsonify({'success': False, 'message': 'Manglende chatId.'}), 400
    pins = load_json(PINNED_CHATS_FILE, {})
    user_pins = pins.setdefault(me, [])
    entry = {'id': chat_id, 'type': chat_type}
    existing = next((p for p in user_pins if p['id'] == chat_id and p['type'] == chat_type), None)
    if existing:
        user_pins.remove(existing)
        pinned = False
    else:
        user_pins.append(entry)
        pinned = True
    save_json(PINNED_CHATS_FILE, pins)
    return jsonify({'success': True, 'pinned': pinned})

@app.route('/archive', methods=['GET'])
@require_login
def get_archive():
    me = session['username']
    data = load_json(ARCHIVE_FILE, {})
    return jsonify({'success': True, 'archive': data.get(me, [])})

@app.route('/archive', methods=['POST'])
@rate_limit(max_requests=30, window_seconds=120)
@require_login
@require_csrf
def toggle_archive():
    me = session['username']
    payload = request.get_json(force=True, silent=True) or {}
    chat_type = payload.get('chatType', 'user')
    chat_id = payload.get('chatId', '')
    if not chat_id:
        return jsonify({'success': False, 'message': 'Manglende chatId.'}), 400
    all_archive = load_json(ARCHIVE_FILE, {})
    user_archive = set(all_archive.setdefault(me, []))
    entry = chat_type + ':' + chat_id
    if entry in user_archive:
        user_archive.discard(entry)
    else:
        user_archive.add(entry)
    all_archive[me] = list(user_archive)
    save_json(ARCHIVE_FILE, all_archive)
    return jsonify({'success': True, 'archived': entry in user_archive})

# ──────────────────────────────────────────────
# Chat Folders (Telegram-style tabs)
# ──────────────────────────────────────────────
@app.route('/folders', methods=['GET'])
@require_login
def get_folders():
    me = session['username']
    all_folders = load_json(FOLDERS_FILE, {})
    user_folders = all_folders.get(me, [
        {'id': 'all', 'name': 'Alle', 'filters': []},
    ])
    return jsonify({'success': True, 'folders': user_folders})

@app.route('/folders', methods=['POST'])
@rate_limit(max_requests=20, window_seconds=120)
@require_login
def save_folders():
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    folders = data.get('folders', [])
    if not isinstance(folders, list):
        return jsonify({'success': False, 'message': 'Ugyldig format.'}), 400
    all_folders = load_json(FOLDERS_FILE, {})
    all_folders[me] = folders
    save_json(FOLDERS_FILE, all_folders)
    return jsonify({'success': True})

# ──────────────────────────────────────────────
# Channels / Broadcast
# ──────────────────────────────────────────────
@app.route('/channels', methods=['GET'])
@require_login
def list_channels():
    me = session['username']
    channels = load_json(CHANNELS_FILE, [])
    visible = [c for c in channels if me in c.get('subscribers', []) or me == c.get('created_by')]
    return jsonify({'success': True, 'channels': visible})

@app.route('/channels', methods=['POST'])
@rate_limit(max_requests=10, window_seconds=300)
@require_login
def create_channel():
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    name = sanitize_input(data.get('name', ''), 50).strip()
    description = sanitize_input(data.get('description', ''), 500)
    if not name:
        return jsonify({'success': False, 'message': 'Navn er påkrevd.'}), 400
    channels = load_json(CHANNELS_FILE, [])
    ch_id = hashlib.sha256(f"{name}{me}{datetime.utcnow().isoformat()}".encode()).hexdigest()[:16]
    channel = {
        'id': ch_id,
        'name': name,
        'description': description,
        'created_by': me,
        'created': now_iso(),
        'subscribers': [me],
        'admins': [me],
        'type': 'channel',
    }
    channels.append(channel)
    save_json(CHANNELS_FILE, channels)
    return jsonify({'success': True, 'channel': channel})

@app.route('/channels/<channel_id>/send', methods=['POST'])
@rate_limit(max_requests=30, window_seconds=120)
@require_login
def send_channel_message(channel_id):
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    ciphertext = sanitize_input(data.get('ciphertext', ''), 10000)
    mtype = data.get('type', 'text')
    filename = data.get('filename')
    reply_to = (data.get('reply_to') or '').strip() or None
    if not ciphertext:
        return jsonify({'success': False, 'message': 'Manglende innhold.'}), 400
    channels = load_json(CHANNELS_FILE, [])
    ch = next((c for c in channels if c['id'] == channel_id), None)
    if not ch:
        return jsonify({'success': False, 'message': 'Kanal ikke funnet.'}), 404
    if me != ch.get('created_by') and me not in ch.get('admins', []):
        return jsonify({'success': False, 'message': 'Kun administratorer kan sende.'}), 403
    messages = load_json(MESSAGES_FILE, [])
    messages.append({
        'id': hashlib.sha256(f"{ciphertext}{channel_id}{datetime.utcnow().isoformat()}{me}".encode()).hexdigest(),
        'channel_id': channel_id,
        'sender': me,
        'ciphertext': ciphertext,
        'type': mtype,
        'timestamp': datetime.utcnow().isoformat(),
        'filename': filename,
        'reply_to': reply_to,
    })
    save_json(MESSAGES_FILE, messages)
    return jsonify({'success': True})

@app.route('/channels/<channel_id>/messages')
@require_login
def get_channel_messages(channel_id):
    me = session['username']
    channels = load_json(CHANNELS_FILE, [])
    ch = next((c for c in channels if c['id'] == channel_id), None)
    if not ch:
        return jsonify({'success': False, 'message': 'Kanal ikke funnet.'}), 404
    if me not in ch.get('subscribers', []) and me not in ch.get('admins', []):
        return jsonify({'success': False, 'message': 'Ikke abonnent.'}), 403
    messages = load_json(MESSAGES_FILE, [])
    filtered = [m for m in messages if m.get('channel_id') == channel_id]
    filtered.sort(key=lambda x: x['timestamp'], reverse=True)
    msg_by_id = {m['id']: m for m in filtered if 'id' in m}
    for m in filtered:
        reply_to = m.get('reply_to')
        if reply_to and reply_to in msg_by_id:
            rm = msg_by_id[reply_to]
            sender = rm.get('sender', '')
            txt = rm.get('ciphertext', '')
            m['reply_preview'] = f"({sender}) {txt[:60]}"
        else:
            m['reply_preview'] = ''
    return jsonify({'success': True, 'messages': filtered[:100]})

@app.route('/channels/<channel_id>/subscribe', methods=['POST'])
@rate_limit(max_requests=20, window_seconds=120)
@require_login
def subscribe_channel(channel_id):
    me = session['username']
    channels = load_json(CHANNELS_FILE, [])
    ch = next((c for c in channels if c['id'] == channel_id), None)
    if not ch:
        return jsonify({'success': False, 'message': 'Kanal ikke funnet.'}), 404
    ch.setdefault('subscribers', [])
    if me not in ch['subscribers']:
        ch['subscribers'].append(me)
        save_json(CHANNELS_FILE, channels)
    return jsonify({'success': True})

@app.route('/channels/<channel_id>/unsubscribe', methods=['POST'])
@rate_limit(max_requests=20, window_seconds=120)
@require_login
def unsubscribe_channel(channel_id):
    me = session['username']
    channels = load_json(CHANNELS_FILE, [])
    ch = next((c for c in channels if c['id'] == channel_id), None)
    if not ch:
        return jsonify({'success': False, 'message': 'Kanal ikke funnet.'}), 404
    ch['subscribers'] = [s for s in ch.get('subscribers', []) if s != me]
    save_json(CHANNELS_FILE, channels)
    return jsonify({'success': True})

# ──────────────────────────────────────────────
# Group Invite Links
# ──────────────────────────────────────────────
@app.route('/groups/<group_id>/invite-link', methods=['GET'])
@require_login
def get_invite_link(group_id):
    me = session['username']
    groups = load_json(GROUPS_FILE, [])
    group = next((g for g in groups if g['id'] == group_id), None)
    if not group:
        return jsonify({'success': False, 'message': 'Gruppe ikke funnet.'}), 404
    if me not in group.get('members', []):
        return jsonify({'success': False, 'message': 'Ikke medlem.'}), 403
    links = load_json(INVITE_LINKS_FILE, {})
    link_data = links.get(group_id)
    if not link_data:
        token = secrets.token_urlsafe(16)
        link_data = {'token': token, 'group_id': group_id, 'created': now_iso(), 'created_by': me}
        links[group_id] = link_data
        save_json(INVITE_LINKS_FILE, links)
    return jsonify({'success': True, 'link': link_data['token'], 'groupId': group_id, 'groupName': group['name']})

@app.route('/invite/<token>')
def resolve_invite(token):
    links = load_json(INVITE_LINKS_FILE, {})
    link_data = next((v for v in links.values() if v.get('token') == token), None)
    if not link_data:
        return jsonify({'success': False, 'message': 'Ugyldig lenke.'}), 404
    groups = load_json(GROUPS_FILE, [])
    group = next((g for g in groups if g['id'] == link_data['group_id']), None)
    if not group:
        return jsonify({'success': False, 'message': 'Gruppe slettet.'}), 404
    return jsonify({'success': True, 'groupId': group['id'], 'groupName': group['name'], 'members': len(group.get('members', []))})

@app.route('/invite/<token>/join', methods=['POST'])
@rate_limit(max_requests=10, window_seconds=60)
@require_login
def join_via_invite(token):
    me = session['username']
    links = load_json(INVITE_LINKS_FILE, {})
    link_data = next((v for v in links.values() if v.get('token') == token), None)
    if not link_data:
        return jsonify({'success': False, 'message': 'Ugyldig lenke.'}), 404
    groups = load_json(GROUPS_FILE, [])
    group = next((g for g in groups if g['id'] == link_data['group_id']), None)
    if not group:
        return jsonify({'success': False, 'message': 'Gruppe slettet.'}), 404
    if me in group.get('members', []):
        return jsonify({'success': True, 'message': 'Allerede medlem.', 'groupId': group['id']})
    group.setdefault('members', []).append(me)
    save_json(GROUPS_FILE, groups)
    return jsonify({'success': True, 'message': 'Bli med!', 'groupId': group['id']})

# ──────────────────────────────────────────────
# Per-Chat Notification Mute
# ──────────────────────────────────────────────
@app.route('/settings/mute', methods=['POST'])
@rate_limit(max_requests=20, window_seconds=120)
@require_login
def toggle_mute_chat():
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    chat_id = data.get('chatId', '')
    muted = data.get('muted', True)
    if not chat_id:
        return jsonify({'success': False, 'message': 'Manglende chatId.'}), 400
    mutes = load_json(MUTED_CHATS_FILE, {})
    user_mutes = mutes.setdefault(me, [])
    if muted and chat_id not in user_mutes:
        user_mutes.append(chat_id)
    elif not muted:
        user_mutes = [c for c in user_mutes if c != chat_id]
    mutes[me] = user_mutes
    save_json(MUTED_CHATS_FILE, mutes)
    return jsonify({'success': True, 'muted': muted})

@app.route('/settings/mute')
@require_login
def get_muted_chats():
    me = session['username']
    mutes = load_json(MUTED_CHATS_FILE, {})
    return jsonify({'success': True, 'muted': mutes.get(me, [])})

# ──────────────────────────────────────────────
# Enhanced Search (date range + groups + mentions)
# ──────────────────────────────────────────────
@app.route('/search/v2')
@require_login
def search_v2():
    me = session['username']
    q = (request.args.get('q') or '').strip()
    partner = (request.args.get('partner') or '').strip().lower()
    group_id = (request.args.get('group') or '').strip()
    date_from = (request.args.get('from') or '').strip()
    date_to = (request.args.get('to') or '').strip()
    sender = (request.args.get('sender') or '').strip().lower()
    msg_type = (request.args.get('type') or '').strip()
    if not q and not sender and not group_id:
        return jsonify({'success': True, 'results': []})
    messages = load_json(MESSAGES_FILE, [])
    results = []
    for m in messages:
        is_group = bool(m.get('group_id'))
        is_dm = bool(m.get('pair_key'))
        if group_id:
            if m.get('group_id') != group_id:
                continue
        elif partner:
            if not is_dm:
                continue
            pk = pair_key(me, partner)
            if m.get('pair_key') != pk:
                continue
        else:
            if is_dm:
                pk = m.get('pair_key', '')
                if me not in pk.split('::'):
                    continue
            elif is_group:
                continue
        if sender and m.get('sender', '').lower() != sender:
            continue
        if msg_type and m.get('type', 'text') != msg_type:
            continue
        ts = m.get('timestamp', '')
        if date_from and ts < date_from:
            continue
        if date_to and ts > date_to:
            continue
        text = ''
        try:
            if is_dm:
                sk = get_or_create_pair_key(me, m.get('sender', '') if m.get('recipient') == me else m.get('recipient', ''))
                text = decrypt_symmetric(m['ciphertext'], sk) if m.get('type') == 'text' else m.get('filename', '')
            elif is_group:
                is_e2ee = convert_to_bool(m.get('e2ee'), False)
                if not is_e2ee:
                    gk = get_or_create_group_key(m['group_id'])
                    text = decrypt_symmetric(m['ciphertext'], gk) if m.get('type') == 'text' else m.get('filename', '')
                else:
                    text = m.get('ciphertext', '')
            else:
                text = m.get('ciphertext', '')
        except Exception:
            text = ''
        if q and q.lower() not in text.lower():
            continue
        if len(results) >= 200:
            break
        results.append({
            'id': m.get('id'),
            'sender': m.get('sender'),
            'recipient': m.get('recipient'),
            'group_id': m.get('group_id'),
            'channel_id': m.get('channel_id'),
            'text': text[:200] if text else '',
            'type': m.get('type', 'text'),
            'timestamp': m.get('timestamp'),
        })
    results.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    return jsonify({'success': True, 'results': results[:100]})

# ──────────────────────────────────────────────
# Admin Dashboard Enhanced
# ──────────────────────────────────────────────
@app.route('/admin/dashboard')
@require_admin
def admin_dashboard_data():
    me = session['username']
    users = load_json(USERS_FILE, {})
    messages = load_json(MESSAGES_FILE, [])
    groups = load_json(GROUPS_FILE, [])
    channels = load_json(CHANNELS_FILE, [])
    sessions = load_json(SESSIONS_FILE, {})
    total_sessions = sum(len(s) for s in sessions.values() if isinstance(s, dict))
    active_sessions = 0
    for s in sessions.values():
        if isinstance(s, dict):
            active_sessions += sum(1 for v in s.values() if isinstance(v, dict) and v.get('active'))
    return jsonify({
        'success': True,
        'stats': {
            'total_users': len(users),
            'total_messages': len(messages),
            'total_groups': len(groups),
            'total_channels': len(channels),
            'total_sessions': total_sessions,
            'active_sessions': active_sessions,
            'admin_count': sum(1 for u in users.values() if u.get('is_admin')),
            'banned_count': sum(1 for u in users.values() if u.get('banned')),
            'two_fa_count': sum(1 for u in users.values() if u.get('twofa_enabled')),
        },
        'recent_messages': [{
            'sender': m.get('sender'),
            'recipient': m.get('recipient'),
            'group_id': m.get('group_id'),
            'channel_id': m.get('channel_id'),
            'type': m.get('type'),
            'timestamp': m.get('timestamp'),
        } for m in messages[-100:]],
        'groups': [{'id': g['id'], 'name': g['name'], 'members': len(g.get('members', [])), 'created_by': g.get('created_by')} for g in groups],
        'channels': [{'id': c['id'], 'name': c['name'], 'subscribers': len(c.get('subscribers', [])), 'created_by': c.get('created_by')} for c in channels],
    })

# ──────────────────────────────────────────────
# Message Translation
# ──────────────────────────────────────────────
@app.route('/translate', methods=['POST'])
@rate_limit(max_requests=30, window_seconds=60)
@require_login
def translate_message():
    data = request.get_json(force=True, silent=True) or {}
    text = sanitize_input(data.get('text', ''), 5000)
    target_lang = sanitize_input(data.get('target', 'en'), 5)
    if not text:
        return jsonify({'success': False, 'message': 'Ingen tekst.'}), 400
    try:
        import urllib.request, urllib.parse
        url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=' + urllib.parse.quote(target_lang) + '&dt=t&q=' + urllib.parse.quote(text)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            result = json.loads(resp.read().decode())
            translated = ''.join(part[0] for part in result[0] if part[0])
            detected = result[2] if len(result) > 2 else target_lang
            return jsonify({'success': True, 'translated': translated, 'sourceLang': detected, 'targetLang': target_lang})
    except Exception as e:
        return jsonify({'success': False, 'message': 'Oversettelse feilet.'}), 500

@app.route('/translate/languages')
@require_login
def list_languages():
    return jsonify({'success': True, 'languages': [
        {'code': 'en', 'name': 'English'}, {'code': 'no', 'name': 'Norsk'},
        {'code': 'de', 'name': 'Deutsch'}, {'code': 'fr', 'name': 'Français'},
        {'code': 'es', 'name': 'Español'}, {'code': 'it', 'name': 'Italiano'},
        {'code': 'pt', 'name': 'Português'}, {'code': 'ru', 'name': 'Русский'},
        {'code': 'zh', 'name': '中文'}, {'code': 'ja', 'name': '日本語'},
        {'code': 'ko', 'name': '한국어'}, {'code': 'ar', 'name': 'العربية'},
        {'code': 'hi', 'name': 'हिन्दी'}, {'code': 'tr', 'name': 'Türkçe'},
        {'code': 'nl', 'name': 'Nederlands'}, {'code': 'sv', 'name': 'Svenska'},
        {'code': 'pl', 'name': 'Polski'}, {'code': 'da', 'name': 'Dansk'},
        {'code': 'fi', 'name': 'Suomi'}, {'code': 'uk', 'name': 'Українська'},
    ]})

# ──────────────────────────────────────────────
# Contact Book
# ──────────────────────────────────────────────
@app.route('/contacts', methods=['GET'])
@require_login
def get_contacts():
    me = session['username']
    contacts = load_json(CONTACTS_FILE, {})
    user_contacts = contacts.get(me, {})
    users = load_json(USERS_FILE, {})
    enriched = []
    for cid, cdata in user_contacts.items():
        u = users.get(cid, {})
        presence = load_json(USER_PRESENCE_FILE, {})
        p = presence.get(cid, {})
        is_online = False
        last_seen = None
        if isinstance(p, dict):
            last_seen = p.get('lastSeen')
            if last_seen:
                try:
                    ls = parse_iso(last_seen)
                    if ls and (datetime.utcnow() - ls.replace(tzinfo=None)).total_seconds() < 300:
                        is_online = True
                except Exception:
                    pass
        enriched.append({
            'username': cid,
            'displayName': cdata.get('name', cid),
            'phone': cdata.get('phone', ''),
            'notes': cdata.get('notes', ''),
            'added': cdata.get('added'),
            'online': is_online,
            'lastSeen': last_seen,
        })
    return jsonify({'success': True, 'contacts': enriched})

@app.route('/contacts', methods=['POST'])
@rate_limit(max_requests=20, window_seconds=120)
@require_login
def add_contact():
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    username = sanitize_input(data.get('username', ''), 30).lower()
    name = sanitize_input(data.get('name', ''), 50) or username
    phone = sanitize_input(data.get('phone', ''), 20)
    notes = sanitize_input(data.get('notes', ''), 500)
    if not username:
        return jsonify({'success': False, 'message': 'Brukernavn er påkrevd.'}), 400
    users = load_json(USERS_FILE, {})
    if username not in users:
        return jsonify({'success': False, 'message': 'Bruker ikke funnet.'}), 404
    contacts = load_json(CONTACTS_FILE, {})
    contacts.setdefault(me, {})[username] = {
        'name': name, 'phone': phone, 'notes': notes, 'added': now_iso()
    }
    save_json(CONTACTS_FILE, contacts)
    return jsonify({'success': True})

@app.route('/contacts/<username>', methods=['DELETE'])
@rate_limit(max_requests=20, window_seconds=120)
@require_login
def remove_contact(username):
    me = session['username']
    contacts = load_json(CONTACTS_FILE, {})
    user_contacts = contacts.get(me, {})
    user_contacts.pop(username, None)
    save_json(CONTACTS_FILE, contacts)
    return jsonify({'success': True})

@app.route('/contacts/<username>', methods=['PUT'])
@rate_limit(max_requests=20, window_seconds=120)
@require_login
def update_contact(username):
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    contacts = load_json(CONTACTS_FILE, {})
    user_contacts = contacts.get(me, {})
    if username not in user_contacts:
        return jsonify({'success': False, 'message': 'Kontakt ikke funnet.'}), 404
    c = user_contacts[username]
    if 'name' in data: c['name'] = sanitize_input(data['name'], 50)
    if 'phone' in data: c['phone'] = sanitize_input(data['phone'], 20)
    if 'notes' in data: c['notes'] = sanitize_input(data['notes'], 500)
    c['updated'] = now_iso()
    save_json(CONTACTS_FILE, contacts)
    return jsonify({'success': True})

@app.route('/contacts/sync', methods=['POST'])
@rate_limit(max_requests=20, window_seconds=120)
@require_login
def sync_contacts():
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    phone_list = data.get('phones', [])
    if not isinstance(phone_list, list):
        return jsonify({'success': False, 'message': 'Ugyldig format.'}), 400
    users = load_json(USERS_FILE, {})
    matches = []
    for u, udata in users.items():
        if u == me:
            continue
        if udata.get('phone') in phone_list:
            matches.append(u)
    return jsonify({'success': True, 'matches': matches})

# ──────────────────────────────────────────────
# Live Location Sharing
# ──────────────────────────────────────────────
LIVE_LOCATION_FILE = DATA_DIR / 'live_locations.json'

@app.route('/location/live', methods=['POST'])
@rate_limit(max_requests=30, window_seconds=120)
@require_login
def start_live_location():
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    lat = data.get('lat')
    lng = data.get('lng')
    target = data.get('target', '')
    target_type = data.get('targetType', 'user')
    duration = min(int(data.get('duration', 600)), 3600)
    if lat is None or lng is None:
        return jsonify({'success': False, 'message': 'Manglende posisjon.'}), 400
    live = load_json(LIVE_LOCATION_FILE, {})
    share_id = secrets.token_hex(8)
    live[share_id] = {
        'sender': me, 'lat': lat, 'lng': lng,
        'target': target, 'targetType': target_type,
        'started': now_iso(), 'duration': duration,
        'active': True,
    }
    save_json(LIVE_LOCATION_FILE, live)
    messages = load_json(MESSAGES_FILE, [])
    messages.append({
        'id': hashlib.sha256(f"live_loc{share_id}{datetime.utcnow().isoformat()}".encode()).hexdigest(),
        'sender': me,
        'recipient': target if target_type == 'user' else None,
        'group_id': target if target_type == 'group' else None,
        'ciphertext': json.dumps({'shareId': share_id, 'lat': lat, 'lng': lng, 'duration': duration, 'live': True}),
        'type': 'live_location',
        'timestamp': datetime.utcnow().isoformat(),
    })
    save_json(MESSAGES_FILE, messages)
    return jsonify({'success': True, 'shareId': share_id})

@app.route('/location/live/<share_id>', methods=['PUT'])
@rate_limit(max_requests=60, window_seconds=60)
@require_login
def update_live_location(share_id):
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    live = load_json(LIVE_LOCATION_FILE, {})
    entry = live.get(share_id)
    if not entry or entry['sender'] != me:
        return jsonify({'success': False, 'message': 'Ikke funnet.'}), 404
    entry['lat'] = data.get('lat', entry['lat'])
    entry['lng'] = data.get('lng', entry['lng'])
    entry['updated'] = now_iso()
    save_json(LIVE_LOCATION_FILE, live)
    return jsonify({'success': True})

@app.route('/location/live/<share_id>', methods=['GET'])
@require_login
def get_live_location(share_id):
    live = load_json(LIVE_LOCATION_FILE, {})
    entry = live.get(share_id)
    if not entry:
        return jsonify({'success': False, 'message': 'Ikke funnet.'}), 404
    started = parse_iso(entry.get('started', ''))
    if started and (datetime.utcnow() - started.replace(tzinfo=None)).total_seconds() > entry.get('duration', 600):
        entry['active'] = False
    return jsonify({'success': True, 'location': entry})

@app.route('/location/live/<share_id>', methods=['DELETE'])
@rate_limit(max_requests=20, window_seconds=120)
@require_login
def stop_live_location(share_id):
    me = session['username']
    live = load_json(LIVE_LOCATION_FILE, {})
    entry = live.get(share_id)
    if not entry or entry['sender'] != me:
        return jsonify({'success': False, 'message': 'Ikke funnet.'}), 404
    entry['active'] = False
    save_json(LIVE_LOCATION_FILE, live)
    return jsonify({'success': True})

# ──────────────────────────────────────────────
# Stories / Status (24h ephemeral posts)
# ──────────────────────────────────────────────
@app.route('/stories', methods=['GET'])
@require_login
def get_stories():
    me = session['username']
    stories = load_json(STORIES_FILE, {})
    now = datetime.utcnow()
    all_stories = []
    for user, user_stories in stories.items():
        for s in user_stories:
            try:
                created = parse_iso(s.get('created', ''))
                if created and (now - created.replace(tzinfo=None)).total_seconds() < 86400:
                    all_stories.append({
                        'id': s['id'],
                        'username': user,
                        'type': s.get('type', 'text'),
                        'content': s.get('content', ''),
                        'bgColor': s.get('bgColor', '#1c1030'),
                        'textColor': s.get('textColor', '#f3f1ff'),
                        'created': s.get('created'),
                        'views': s.get('views', []),
                    })
            except Exception:
                pass
    all_stories.sort(key=lambda x: x.get('created', ''), reverse=True)
    contacts = load_json(CONTACTS_FILE, {})
    user_contacts = set(contacts.get(me, {}).keys())
    user_contacts.add(me)
    visible = [s for s in all_stories if s['username'] in user_contacts or s['username'] == me]
    return jsonify({'success': True, 'stories': visible})

@app.route('/stories', methods=['POST'])
@rate_limit(max_requests=20, window_seconds=120)
@require_login
def create_story():
    me = session['username']
    data = request.get_json(force=True, silent=True) or {}
    content = sanitize_input(data.get('content', ''), 2000)
    stype = data.get('type', 'text')
    bg_color = data.get('bgColor', '#1c1030')
    text_color = data.get('textColor', '#f3f1ff')
    if not content:
        return jsonify({'success': False, 'message': 'Innhold er påkrevd.'}), 400
    stories = load_json(STORIES_FILE, {})
    user_stories = stories.setdefault(me, [])
    story = {
        'id': secrets.token_hex(8),
        'type': stype,
        'content': content,
        'bgColor': bg_color,
        'textColor': text_color,
        'created': now_iso(),
        'views': [],
    }
    user_stories.append(story)
    expired = []
    now = datetime.utcnow()
    for s in user_stories:
        try:
            created = parse_iso(s.get('created', ''))
            if created and (now - created.replace(tzinfo=None)).total_seconds() >= 86400:
                expired.append(s)
        except Exception:
            pass
    for s in expired:
        user_stories.remove(s)
    save_json(STORIES_FILE, stories)
    return jsonify({'success': True, 'story': story})

@app.route('/stories/<story_id>/view', methods=['POST'])
@rate_limit(max_requests=60, window_seconds=60)
@require_login
def view_story(story_id):
    me = session['username']
    stories = load_json(STORIES_FILE, {})
    for user, user_stories in stories.items():
        for s in user_stories:
            if s['id'] == story_id:
                s.setdefault('views', [])
                if me not in s['views']:
                    s['views'].append(me)
                save_json(STORIES_FILE, stories)
                return jsonify({'success': True})
    return jsonify({'success': False, 'message': 'Story ikke funnet.'}), 404

@app.route('/stories/<story_id>', methods=['DELETE'])
@rate_limit(max_requests=20, window_seconds=120)
@require_login
def delete_story(story_id):
    me = session['username']
    stories = load_json(STORIES_FILE, {})
    user_stories = stories.get(me, [])
    stories[me] = [s for s in user_stories if s['id'] != story_id]
    save_json(STORIES_FILE, stories)
    return jsonify({'success': True})

# ──────────────────────────────────────────────
# Block User
# ──────────────────────────────────────────────
BLOCKED_FILE = DATA_DIR / 'blocked_users.json'

@app.route('/blocked', methods=['GET'])
@require_login
def get_blocked():
    me = session['username']
    blocked = load_json(BLOCKED_FILE, {})
    return jsonify({'success': True, 'blocked': blocked.get(me, [])})

@app.route('/block/<username>', methods=['POST'])
@rate_limit(max_requests=20, window_seconds=120)
@require_login
def block_user(username):
    me = session['username']
    if username == me:
        return jsonify({'success': False, 'message': 'Kan ikke blokkere deg selv.'}), 400
    blocked = load_json(BLOCKED_FILE, {})
    blocked.setdefault(me, [])
    if username not in blocked[me]:
        blocked[me].append(username)
        save_json(BLOCKED_FILE, blocked)
    return jsonify({'success': True})

@app.route('/block/<username>', methods=['DELETE'])
@rate_limit(max_requests=20, window_seconds=120)
@require_login
def unblock_user(username):
    me = session['username']
    blocked = load_json(BLOCKED_FILE, {})
    if me in blocked:
        blocked[me] = [u for u in blocked[me] if u != username]
        save_json(BLOCKED_FILE, blocked)
    return jsonify({'success': True})

# ──────────────────────────────────────────────
# Delete for Me Only
# ──────────────────────────────────────────────
DELETED_FOR_ME_FILE = DATA_DIR / 'deleted_for_me.json'

@app.route('/messages/<message_id>/me', methods=['DELETE'])
@rate_limit(max_requests=30, window_seconds=60)
@require_login
@require_csrf
def delete_for_me(message_id):
    me = session['username']
    deleted = load_json(DELETED_FOR_ME_FILE, {})
    deleted.setdefault(me, [])
    if message_id not in deleted[me]:
        deleted[me].append(message_id)
        save_json(DELETED_FOR_ME_FILE, deleted)
    return jsonify({'success': True})

@app.route('/blocked/check/<username>', methods=['GET'])
@require_login
def check_blocked(username):
    me = session['username']
    blocked = load_json(BLOCKED_FILE, {})
    i_blocked = username in blocked.get(me, [])
    they_blocked = me in blocked.get(username, [])
    return jsonify({'success': True, 'iBlocked': i_blocked, 'theyBlocked': they_blocked})

@app.route('/health')
def health_check():
    try:
        from db import _get_conn
        conn = _get_conn()
        conn.execute('SELECT 1')
        db_ok = True
        conn.close()
    except Exception:
        db_ok = False
    return jsonify({
        'success': True,
        'status': 'healthy' if db_ok else 'degraded',
        'db': 'ok' if db_ok else 'error',
        'version': '3.0.0',
        'uptime': time.time() - app._start_time if hasattr(app, '_start_time') else 0,
        'cache_size': len(_cache),
    })

@app.route('/sw-test')
def service_worker_test():
    return jsonify({'success': True})

@app.route('/uploads/<path:filename>')
@require_login
def uploaded_file(filename):
    safe_name = secure_filename(filename)
    if not safe_name:
        return jsonify({'success': False, 'message': 'Ugyldig filnavn.'}), 400
    abs_root = os.path.abspath(app.config['UPLOAD_FOLDER'])
    abs_target = os.path.abspath(os.path.join(abs_root, safe_name))
    if not abs_target.startswith(abs_root + os.sep):
        return jsonify({'success': False, 'message': 'Ugyldig filsti.'}), 400
    return send_from_directory(abs_root, safe_name, as_attachment=False)

if __name__ == '__main__':
    app.run(debug=os.environ.get('FLASK_DEBUG', 'false').lower() in ('true', '1'), host='0.0.0.0', port=5000)

# Attach data files to app so tests/tools can clear or relocate them deterministically
app.users_file = USERS_FILE
app.messages_file = MESSAGES_FILE
app.keys_file = KEYS_FILE
app.groups_file = GROUPS_FILE
app.notifications_file = NOTIFICATIONS_FILE
app.presence_file = USER_PRESENCE_FILE
app.read_receipts_file = READ_RECEIPTS_FILE
app.sessions_file = SESSIONS_FILE
app.reactions_file = REACTIONS_FILE
app.typing_file = TYPING_FILE
app.verification_file = VERIFICATION_FILE
app.calls_file = CALLS_FILE
app.pins_file = PINS_FILE
app.scheduled_file = SCHEDULED_FILE
app.drafts_file = DATA_DIR / 'drafts.json'
app.push_subscriptions_file = PUSH_SUBSCRIPTIONS_FILE
app.link_previews_file = LINK_PREVIEWS_FILE
app.pinned_chats_file = PINNED_CHATS_FILE
app.folders_file = FOLDERS_FILE
app.channels_file = CHANNELS_FILE
app.invite_links_file = INVITE_LINKS_FILE
app.muted_chats_file = MUTED_CHATS_FILE
app.contacts_file = CONTACTS_FILE
app.stories_file = STORIES_FILE
app.blocked_file = BLOCKED_FILE
app.deleted_for_me_file = DATA_DIR / 'deleted_for_me.json'
app.live_location_file = LIVE_LOCATION_FILE
app.wallpapers_file = DATA_DIR / 'wallpapers.json'
app.slowmode_file = SLOWMODE_FILE
app.polls_file = DATA_DIR / 'polls.json'
