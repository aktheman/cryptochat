#!/bin/bash
# CryptoChat Backup Script
# Run daily via cron: 0 2 * * * /home/aktheman/cryptochat/backup.sh

set -euo pipefail

BACKUP_DIR="/home/aktheman/cryptochat/backups"
DATA_DIR="/home/aktheman/cryptochat/data"
KEEP_DAYS=14
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting CryptoChat backup..."

# Backup SQLite database
if [ -f "$DATA_DIR/cryptochat.db" ]; then
    cp "$DATA_DIR/cryptochat.db" "$BACKUP_DIR/db_${TIMESTAMP}.db"
    echo "  Database backed up: db_${TIMESTAMP}.db"
fi

# Backup uploaded files
if [ -d "$DATA_DIR/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz" -C "$DATA_DIR" uploads/ 2>/dev/null || true
    echo "  Uploads backed up: uploads_${TIMESTAMP}.tar.gz"
fi

# Cleanup old backups
find "$BACKUP_DIR" -name "*.db" -mtime +${KEEP_DAYS} -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +${KEEP_DAYS} -delete 2>/dev/null || true
echo "  Cleaned backups older than ${KEEP_DAYS} days"

# Report disk usage
DISK_USAGE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
echo "  Backup directory: ${DISK_USAGE}"
echo "[$(date)] Backup complete."
