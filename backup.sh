#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

BACKUP_DIR="./backups"
DATA_DIR="./data"
KEEP_DAYS=14
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
KEY_FILE="./secrets/backup_key"
ENC_SUFFIX=".enc"

mkdir -p "$BACKUP_DIR"

enc() {
  python3 ./backup_crypto.py enc "$1" "$2"
}

if [ -f "$DATA_DIR/cryptochat.db" ]; then
  enc "$DATA_DIR/cryptochat.db" "$BACKUP_DIR/db_${TIMESTAMP}${ENC_SUFFIX}"
  echo "[$(date)] Database encrypted backup: db_${TIMESTAMP}${ENC_SUFFIX}"
fi

if [ -d "$DATA_DIR/uploads" ]; then
  tar -C "$DATA_DIR" -czf /tmp/uploads_${TIMESTAMP}.tar.gz uploads 2>/dev/null || true
  enc "/tmp/uploads_${TIMESTAMP}.tar.gz" "$BACKUP_DIR/uploads_${TIMESTAMP}${ENC_SUFFIX}"
  rm -f /tmp/uploads_${TIMESTAMP}.tar.gz
  echo "[$(date)] Uploads encrypted backup: uploads_${TIMESTAMP}${ENC_SUFFIX}"
fi

find "$BACKUP_DIR" -name "*${ENC_SUFFIX}" -mtime +${KEEP_DAYS} -delete 2>/dev/null || true
echo "[$(date)] Backup complete."
