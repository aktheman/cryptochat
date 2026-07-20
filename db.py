import sqlite3
import json
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / 'data'
DB_PATH = DATA_DIR / 'cryptochat.sqlite3'

USERS_JSON = DATA_DIR / 'users.json'
MESSAGES_JSON = DATA_DIR / 'messages.json'


def _conn():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), detect_types=sqlite3.PARSE_DECLTYPES)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    return conn


# Alias for tests/imports that use `_get_conn`
_get_conn = _conn


def init_db(force_migrate=False):
    with _conn() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password_hash TEXT NOT NULL,
            display_name TEXT DEFAULT '',
            avatar TEXT DEFAULT '',
            bio TEXT DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            pair_key TEXT NOT NULL,
            sender TEXT NOT NULL,
            recipient TEXT NOT NULL,
            ciphertext TEXT NOT NULL,
            type TEXT DEFAULT 'text',
            timestamp TEXT NOT NULL,
            read INTEGER DEFAULT 0,
            self_destruct_at TEXT DEFAULT '',
            filename TEXT DEFAULT '',
            deleted INTEGER DEFAULT 0,
            edited INTEGER DEFAULT 0,
            edited_at TEXT DEFAULT '',
            e2ee INTEGER DEFAULT 0,
            reply_to TEXT DEFAULT '',
            forwarded_from TEXT DEFAULT '',
            silent INTEGER DEFAULT 0,
            message_json TEXT DEFAULT '{}'
        );
        CREATE TABLE IF NOT EXISTS meta (
            key TEXT PRIMARY KEY,
            value TEXT DEFAULT ''
        );
        CREATE INDEX IF NOT EXISTS idx_messages_pair_ts ON messages(pair_key, timestamp);
        CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient);
        CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender);
        CREATE TABLE IF NOT EXISTS kv_store (
            key TEXT PRIMARY KEY,
            value TEXT DEFAULT ''
        );
        """)

    migrated = _get_meta('migrated')
    if force_migrate or not migrated:
        migrate_json_to_sqlite()


def _get_meta(key, default=''):
    try:
        with _conn() as conn:
            row = conn.execute("SELECT value FROM meta WHERE key=?", (key,)).fetchone()
            if row:
                return row['value']
    except Exception:
        pass
    return default


def _set_meta(key, value):
    try:
        with _conn() as conn:
            conn.execute("INSERT OR REPLACE INTO meta(key, value) VALUES(?,?)", (key, str(value)))
    except Exception:
        pass


def migrate_json_to_sqlite():
    with _conn() as conn:
        if USERS_JSON.exists():
            try:
                users = json.loads(USERS_JSON.read_text(encoding='utf-8') or '{}')
                if isinstance(users, dict):
                    for user, data in users.items():
                        conn.execute(
                            "INSERT OR REPLACE INTO users VALUES(?,?,?,?,?)",
                            (
                                str(user),
                                str(data.get('password_hash', '')),
                                str(data.get('display_name', '')),
                                str(data.get('avatar', '')),
                                str(data.get('bio', '')),
                            ),
                        )
            except Exception:
                pass

        if MESSAGES_JSON.exists():
            try:
                data = json.loads(MESSAGES_JSON.read_text(encoding='utf-8') or '[]')
                if isinstance(data, list):
                    for m in data:
                        conn.execute(
                            """INSERT OR REPLACE INTO messages(
                                id, pair_key, sender, recipient, ciphertext, type, timestamp,
                                read, self_destruct_at, filename, deleted, edited, edited_at,
                                e2ee, reply_to, forwarded_from, silent, message_json
                            ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                            (
                                str(m.get('id', '')),
                                str(m.get('pair_key', '')),
                                str(m.get('sender', '')),
                                str(m.get('recipient', '')),
                                str(m.get('ciphertext', '')),
                                str(m.get('type', 'text')),
                                str(m.get('timestamp', '')),
                                1 if m.get('read') else 0,
                                str(m.get('self_destruct_at', '')),
                                str(m.get('filename', '')),
                                1 if m.get('deleted') else 0,
                                1 if m.get('edited') else 0,
                                str(m.get('edited_at', '')),
                                1 if m.get('e2ee') else 0,
                                str(m.get('reply_to', '')),
                                str(m.get('forwarded_from', '')),
                                1 if m.get('silent') else 0,
                                json.dumps(m, ensure_ascii=False),
                            ),
                        )
            except Exception:
                pass

    _set_meta('migrated', '1')


def json_fallback(loader):
    try:
        return loader()
    except Exception:
        return []


def is_migrated():
    return _get_meta('migrated') == '1'


if __name__ == '__main__':
    init_db(force_migrate=True)
    print('migrated=', _get_meta('migrated'))


# Backward-compatible wrappers for app.py
import threading
_cache = {}
_cache_lock = threading.Lock()


def invalidate_cache(*args, **kwargs):
    with _cache_lock:
        _cache.clear()


def load_json(path, default=None):
    p = Path(path)
    key = str(p)
    with _cache_lock:
        if key in _cache:
            return _cache[key]
    if not p.exists():
        return default if default is not None else {}
    try:
        data = json.loads(p.read_text(encoding='utf-8') or '{}')
    except Exception:
        data = default if default is not None else {}
    with _cache_lock:
        _cache[key] = data
    return data


def save_json(path, data):
    p = Path(path)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    with _cache_lock:
        _cache[str(p)] = data

# Aliases used by app.py
migrate_json_files = migrate_json_to_sqlite
