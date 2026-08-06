#!/usr/bin/env bash
# Gjenopprett CryptoChat fra kryptert backup.
# Krever at secrets/backup_key finnes (lagres aldri i backupen).
# Bruk: sudo scripts/restore.sh <backup.enc> [--secrets]
#   --secrets  gjenopprett også secrets/ (bruk ved migrering til ny maskin)
set -euo pipefail

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_ENC="${1:?Bruk: $0 <backup.enc> [--secrets]}"
RESTORE_SECRETS=0
[ "${2:-}" = "--secrets" ] && RESTORE_SECRETS=1

[ -f "$BACKUP_ENC" ] || { echo "FEIL: $BACKUP_ENC finnes ikke."; exit 1; }
[ -f "$BASE_DIR/secrets/backup_key" ] || {
  echo "FEIL: $BASE_DIR/secrets/backup_key mangler — backupen kan ikke dekrypteres."
  exit 1
}

if systemctl is-active --quiet cryptochat.service 2>/dev/null; then
  echo "FEIL: cryptochat.service kjører. Stopp den først: sudo systemctl stop cryptochat"
  exit 1
fi

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "[1/4] Dekrypterer og verifiserer arkiv..."
"$BASE_DIR/.venv/bin/python" "$BASE_DIR/backup_crypto.py" dec "$BACKUP_ENC" "$WORK/restore.tar.gz"
tar tzf "$WORK/restore.tar.gz" >/dev/null || { echo "FEIL: arkivet er korrupt."; exit 1; }
tar xzf "$WORK/restore.tar.gz" -C "$WORK"

echo "[2/4] Verifiserer SQLite-snapshot..."
if [ -f "$WORK/data/cryptochat.sqlite3" ]; then
  SQLITE="$WORK/data/cryptochat.sqlite3"
elif [ -f "$WORK/cryptochat.sqlite3" ]; then
  SQLITE="$WORK/cryptochat.sqlite3"   # eldre format (før 2026-08-06)
else
  echo "FEIL: ingen SQLite-snapshot i backupen."; exit 1
fi
"$BASE_DIR/.venv/bin/python" - "$SQLITE" << 'PYEOF'
import sqlite3, sys
con = sqlite3.connect(sys.argv[1])
row = con.execute('PRAGMA integrity_check').fetchone()
con.close()
if row and row[0] == 'ok':
    print('sqlite integrity OK')
else:
    sys.exit('sqlite integrity feilet: %r' % (row,))
PYEOF

echo "[3/4] Sikkerhetskopierer nåværende data/ før overskriving..."
STAMP="$(date +%Y%m%d-%H%M%S)"
if [ -d "$BASE_DIR/data" ] && [ -n "$(ls -A "$BASE_DIR/data")" ]; then
  mkdir -p /var/backups/cryptochat
  tar czf "/var/backups/cryptochat/pre-restore-$STAMP.tar.gz" -C "$BASE_DIR" data
  echo "Nåværende data lagret: /var/backups/cryptochat/pre-restore-$STAMP.tar.gz"
fi

echo "[4/4] Gjenoppretter filer..."
cp -a "$WORK/data/." "$BASE_DIR/data/"
if [ "$RESTORE_SECRETS" = 1 ] && [ -d "$WORK/secrets" ]; then
  cp -a "$WORK/secrets/." "$BASE_DIR/secrets/"
  echo "secrets/ gjenopprettet (backup_key finnes ikke i backupen)."
else
  echo "secrets/ gjenopprettes ikke (bruk '--secrets' ved full migrering)."
fi

echo "Restore fullført. Start tjenesten: sudo systemctl start cryptochat"
