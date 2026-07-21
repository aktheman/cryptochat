import json
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / 'data'

# Backward-compatible wrappers for app.py
import threading
_cache = {}
_cache_lock = threading.Lock()


def invalidate_cache(*args, **kwargs):
    with _cache_lock:
        _cache.clear()


def load_json(path, default=None, **kwargs):
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
    import tempfile
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=p.parent, suffix='.tmp')
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, str(p))
    except Exception:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise
    with _cache_lock:
        _cache[str(p)] = data


# Minimal SQLite for tests and health check
import sqlite3
DB_PATH = DATA_DIR / 'cryptochat.sqlite3'


def _conn():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), detect_types=sqlite3.PARSE_DECLTYPES)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    return conn


_get_conn = _conn


def init_db(force_migrate=False):
    with _conn() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS kv_store (
            key TEXT PRIMARY KEY,
            value TEXT DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS meta (
            key TEXT PRIMARY KEY,
            value TEXT DEFAULT ''
        );
        """)


# Alias used by app.py
def migrate_json_files():
    pass
