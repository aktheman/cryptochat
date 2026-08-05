#!/usr/bin/env bash
# Kryptert, konsistent sikkerhetskopi av CryptoChat (data/ + secrets/).
# Bruk: scripts/backup.sh [KEEP]   (KEEP = antall backups å beholde, standard 7)
set -euo pipefail

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${CRYPTOCHAT_BACKUP_DIR:-/var/backups/cryptochat}"
KEEP="${1:-7}"
STAMP="$(date +%Y%m%d-%H%M%S-%N)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

cd "$BASE_DIR"
mkdir -p "$BACKUP_DIR"

# Konsistent SQLite-snapshot (WAL flushet inn)
"$BASE_DIR/.venv/bin/python" - "$BASE_DIR" "$WORK" << 'PYEOF'
import sqlite3, sys
base, work = sys.argv[1], sys.argv[2]
src = base + '/data/cryptochat.sqlite3'
dst = work + '/cryptochat.sqlite3'
con = sqlite3.connect(src)
out = sqlite3.connect(dst)
con.backup(out)
out.close(); con.close()
print('sqlite snapshot OK')
PYEOF

# Pakk data/ (unntatt live sqlite; snapshot erstatter den) + secrets/
(cd "$WORK" && tar czf cryptochat-backup.tar.gz \
  --exclude='data/cryptochat.sqlite3*' \
  -C "$BASE_DIR" data secrets \
  -C "$WORK" cryptochat.sqlite3)

# Krypter med backup_key
"$BASE_DIR/.venv/bin/python" "$BASE_DIR/backup_crypto.py" enc \
  "$WORK/cryptochat-backup.tar.gz" \
  "$BACKUP_DIR/cryptochat-backup-$STAMP.enc"

# Rotasjon: behold de nyeste K
ls -1t "$BACKUP_DIR"/cryptochat-backup-*.enc 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f

# Verifiser: dekrypter tilbake og test arkivet
"$BASE_DIR/.venv/bin/python" "$BASE_DIR/backup_crypto.py" dec \
  "$BACKUP_DIR/cryptochat-backup-$STAMP.enc" "$WORK/verify.tar.gz"
tar tzf "$WORK/verify.tar.gz" >/dev/null

echo "Backup OK: $BACKUP_DIR/cryptochat-backup-$STAMP.enc ($(du -h "$BACKUP_DIR/cryptochat-backup-$STAMP.enc" | cut -f1))"
echo "Siste $KEEP backups beholdt:"
ls -1t "$BACKUP_DIR"/cryptochat-backup-*.enc | head -n "$KEEP"
