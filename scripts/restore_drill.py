#!/usr/bin/env python3
"""Gjenopprettingstest: dekrypter siste backup, verifiser innhold og SQLite."""
import json, os, sqlite3, subprocess, sys, tempfile
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
BACKUP_DIR = Path(os.environ.get('CRYPTOCHAT_BACKUP_DIR', '/var/backups/cryptochat'))
PYTHON = str(BASE_DIR / '.venv/bin/python')

def find_latest_backup():
    candidates = sorted(BACKUP_DIR.glob('cryptochat-backup-*.enc'), reverse=True)
    return candidates[0] if candidates else None

def drill():
    enc_path = find_latest_backup()
    if not enc_path:
        print('FEIL: ingen backup-filer funnet')
        return False
    print(f'Tester: {enc_path.name}')

    with tempfile.TemporaryDirectory() as tmp:
        tar_path = Path(tmp) / 'restore.tar.gz'
        dec_ok = subprocess.run(
            [PYTHON, str(BASE_DIR / 'backup_crypto.py'), 'dec', str(enc_path), str(tar_path)],
            capture_output=True, text=True, timeout=60,
        )
        if dec_ok.returncode != 0:
            print(f'FEIL: dekryptering feilet: {dec_ok.stderr.strip()}')
            return False
        print('Dekryptering: OK')

        if not tar_path.exists() or tar_path.stat().st_size < 100:
            print('FEIL: dekryptert fil mangler eller er tom')
            return False

        list_ok = subprocess.run(['tar', 'tzf', str(tar_path)], capture_output=True, text=True, timeout=30)
        if list_ok.returncode != 0:
            print(f'FEIL: arkivet kan ikke leses: {list_ok.stderr.strip()}')
            return False

        members = list_ok.stdout.strip().split('\n')
        has_data = any('data/' in m for m in members)
        has_secrets = any('secrets/' in m for m in members)
        has_messages = any('messages.json' in m or 'cryptochat.sqlite3' in m for m in members)
        print(f'Innhold: data={has_data} secrets={has_secrets} messages/meldinger={has_messages} filer={len(members)}')

        if not (has_data and has_secrets):
            print('FEIL: mangler data/ eller secrets/ i arkivet')
            return False

        # Test SQLite-integritet
        sqlite_path = Path(tmp) / 'data' / 'cryptochat.sqlite3'
        if any('cryptochat.sqlite3' in m for m in members):
            subprocess.run(['tar', 'xzf', str(tar_path), '-C', str(tmp)], capture_output=True, timeout=30)
            if sqlite_path.exists():
                con = sqlite3.connect(str(sqlite_path))
                result = con.execute('PRAGMA quick_check').fetchone()[0]
                con.close()
                if result != 'ok':
                    print(f'FEIL: SQLite quick_check={result}')
                    return False
                print('SQLite: OK')
            else:
                print('INFO: cryptochat.sqlite3 ikke i arkivet (ingen data ennå)')

    print(f'Gjenopprettingstest: OK ({enc_path.name})')
    return True

if __name__ == '__main__':
    ok = drill()
    if not ok:
        sys.exit(1)
