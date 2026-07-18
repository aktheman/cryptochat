from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_from_directory, make_response
from flask_httpauth import HTTPBasicAuth
import os, json, time, hmac, hashlib, secrets, base64, io, qrcode
from pathlib import Path
from functools import wraps
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import x25519
from cryptography.hazmat.bindings._openssl import ffi as _ffi
import pyotp

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY") or (Path(os.environ.get("SECRET_KEY_FILE", "/run/secret_key")).read_bytes().decode() if Path(os.environ.get("SECRET_KEY_FILE", "/run/secret_key")).exists() else None)
if not app.secret_key:
    raise SystemExit('SECRET_KEY eller SECRET_KEY_FILE må settes i produksjon')
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    PERMANENT_SESSION_LIFETIME=timedelta(days=1),
)

BASE = Path(__file__).resolve().parent / "data"
UPLOAD_DIR = BASE / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_UPLOAD_MB = 8

def _load(path):
    if not path.exists():
        return {} if path.suffix == ".json" or path.name == "sessions.json" or path.name == "presence.json" else []
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {} if path.suffix == ".json" or path.name == "sessions.json" or path.name == "presence.json" else []

def _save(path, obj):
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")

def users_path(): return BASE / "users.json"
def messages_path(): return BASE / "messages.json"
def sessions_path(): return BASE / "sessions.json"
def presence_path(): return BASE / "presence.json"

def now_iso(): return datetime.utcnow().isoformat() + "Z"

def _hash_password(pw): return generate_password_hash(pw)
def _check_password(h, pw): return check_password_hash(h, pw)

def get_user(username):
    users = _load(users_path())
    return users.get(username)

def require_login(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if "user" not in session:
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return wrapper

@app.route("/")
def index():
    if "user" in session:
        return redirect(url_for("chat"))
    return redirect(url_for("login"))

@app.route("/login", methods=["GET"])
def login():
    return render_template("login.html")

@app.route("/auth/register", methods=["POST"])
def register():
    data = request.get_json(force=True, silent=True) or {}
    username = (data.get("username") or "").strip().lower()
    password = data.get("password") or ""
    if not username or not password:
        return jsonify({"error": "missing_fields"}), 400
    users = _load(users_path())
    if username in users:
        return jsonify({"error": "username_taken"}), 409
    users[username] = {
        "username": username,
        "password_hash": _hash_password(password),
        "created_at": now_iso(),
        "two_factor_secret": None,
        "two_factor_enabled": False,
        "public_key": None,
        "encrypted_private_key": None
    }
    _save(users_path(), users)
    return jsonify({"success": True})

@app.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json(force=True, silent=True) or {}
    username = (data.get("username") or "").strip().lower()
    password = data.get("password") or ""
    user = get_user(username)
    if not user or not _check_password(user.get("password_hash", ""), password):
        return jsonify({"error": "invalid_credentials"}), 401
    session.clear()
    session["user"] = username
    session.permanent = True
    app.permanent_session_lifetime = timedelta(days=1)
    return jsonify({"success": True, "username": username})

@app.route("/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True})

@app.route("/chat")
@require_login
def chat():
    return render_template("chat.html", username=session.get("user"))

@app.route("/users")
@require_login
def users():
    me = session.get("user")
    users = _load(users_path())
    return jsonify([{"username": u, "online": False} for u in users if u != me])

@app.route("/messages/<recipient>")
@require_login
def get_messages(recipient):
    msgs = _load(messages_path())
    convo = []
    for m in msgs if isinstance(msgs, list) else msgs.get("items", []):
        if isinstance(m, dict) and ((m.get("from") == session.get("user") and m.get("to") == recipient) or (m.get("from") == recipient and m.get("to") == session.get("user"))):
            convo.append(m)
    return jsonify(convo)

@app.route("/send", methods=["POST"])
@require_login
def send_message():
    data = request.get_json(force=True, silent=True) or {}
    to = (data.get("to") or "").strip().lower()
    ciphertext = data.get("ciphertext") or data.get("message") or ""
    if not to:
        return jsonify({"error": "missing_recipient"}), 400
    item = {"from": session.get("user"), "to": to, "ciphertext": ciphertext, "ts": int(time.time()), "read": False}
    path = messages_path()
    msgs = _load(path)
    if isinstance(msgs, dict):
        msgs.setdefault("items", []).append(item)
        _save(path, msgs)
    else:
        if not isinstance(msgs, list):
            msgs = []
        msgs.append(item)
        _save(path, msgs)
    return jsonify({"success": True})

@app.route("/uploads/<path:filename>")
@require_login
def uploaded_file(filename):
    return send_from_directory(str(UPLOAD_DIR), filename, as_attachment=False)

if __name__ == "__main__":
    app.run(port=5000, debug=False)
