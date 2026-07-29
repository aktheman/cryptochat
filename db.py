import json
import os
import time
import threading
import sqlite3
from pathlib import Path
import logging

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / 'data'

_cache = {}
_cache_ttl = {}
_cache_lock = threading.Lock()

logger = logging.getLogger('cryptochat')

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
        CREATE TABLE IF NOT EXISTS json_store (
            file_key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        """)


def invalidate_cache(*args, **kwargs):
    with _cache_lock:
        _cache.clear()
        _cache_ttl.clear()


def _read_from_sqlite(file_key):
    try:
        with _conn() as conn:
            row = conn.execute('SELECT value FROM json_store WHERE file_key = ?', (file_key,)).fetchone()
            if row:
                return json.loads(row['value'])
    except Exception as e:
        logger.warning('sqlite read failed for %s: %s', file_key, e)
    return None


def _write_to_sqlite(file_key, data):
    try:
        value = json.dumps(data, ensure_ascii=False)
        with _conn() as conn:
            conn.execute('INSERT OR REPLACE INTO json_store (file_key, value) VALUES (?, ?)', (file_key, value))
    except Exception as e:
        logger.warning('sqlite write failed for %s: %s', file_key, e)
        pass


def _delete_from_sqlite(file_key):
    try:
        with _conn() as conn:
            conn.execute('DELETE FROM json_store WHERE file_key = ?', (file_key,))
    except Exception as e:
        logger.warning('sqlite delete failed for %s: %s', file_key, e)
        pass


def load_json(path, default=None, ttl=None):
    p = Path(path)
    key = str(p)
    now = time.time()
    with _cache_lock:
        if key in _cache:
            if ttl is None or (key in _cache_ttl and now - _cache_ttl[key] < ttl):
                return _cache[key]

    data = _read_from_sqlite(key)

    if data is None and p.exists():
        try:
            data = json.loads(p.read_text(encoding='utf-8') or '{}')
            _write_to_sqlite(key, data)
        except Exception:
            data = None

    if data is None:
        data = default if default is not None else {}

    with _cache_lock:
        _cache[key] = data
        _cache_ttl[key] = now
    return data


def save_json(path, data):
    import tempfile
    p = Path(path)
    key = str(p)
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

    _write_to_sqlite(key, data)

    with _cache_lock:
        _cache[key] = data


def migrate_json_files():
    json_extensions = ('.json', '.jsonl')
    for f in DATA_DIR.iterdir():
        if f.suffix in json_extensions and f.is_file():
            key = str(f)
            existing = _read_from_sqlite(key)
            if existing is not None:
                continue
            try:
                data = json.loads(f.read_text(encoding='utf-8') or '{}')
                _write_to_sqlite(key, data)
            except Exception:
                pass
