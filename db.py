import sqlite3
import json
import threading
import os
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / 'data' / 'cryptochat.db'
_db_lock = threading.Lock()

def _get_conn():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), timeout=10)
    conn.execute('PRAGMA journal_mode=WAL')
    conn.execute('PRAGMA busy_timeout=5000')
    conn.execute('PRAGMA synchronous=NORMAL')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = _get_conn()
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS kv_store (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_kv_prefix ON kv_store(key);
    ''')
    conn.close()

def load_json(path, default):
    key = str(path)
    try:
        conn = _get_conn()
        row = conn.execute('SELECT value FROM kv_store WHERE key = ?', (key,)).fetchone()
        conn.close()
        if row:
            return json.loads(row['value'])
    except Exception:
        pass
    return default

def save_json(path, obj):
    key = str(path)
    value = json.dumps(obj, ensure_ascii=False, indent=2)
    with _db_lock:
        conn = _get_conn()
        conn.execute('INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)', (key, value))
        conn.commit()
        conn.close()

def migrate_json_files():
    """One-time migration: import existing JSON files into SQLite."""
    data_dir = Path(__file__).resolve().parent / 'data'
    for json_file in data_dir.glob('*.json'):
        if json_file.name == 'cryptochat.db':
            continue
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            save_json(json_file, data)
            print(f'  Migrated {json_file.name}')
        except Exception:
            pass
