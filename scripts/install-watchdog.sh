#!/usr/bin/env bash
# Installer vaktmester-timer + gjenopprettingstest-timer + sikkerhetsoppdateringer (debian/raspbian)
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "1. Installerer unattended-upgrades..."
sudo apt-get install -y unattended-upgrades apt-listchanges 2>/dev/null || true
sudo dpkg-reconfigure -f noninteractive unattended-upgrades 2>/dev/null || true

echo "2. Setter opp systemd-timere..."
for unit in cryptochat-watchdog cryptochat-restore-drill; do
  sudo cp "$SCRIPT_DIR/$unit.service" /etc/systemd/system/
  sudo cp "$SCRIPT_DIR/$unit.timer"   /etc/systemd/system/
done
sudo systemctl daemon-reload
sudo systemctl enable --now cryptochat-watchdog.timer
sudo systemctl enable --now cryptochat-restore-drill.timer

echo "3. Status:"
systemctl list-timers --no-pager | grep cryptochat
echo ""
echo "Ferdig! Vaktmester kjører hvert 3 min, gjenopprettingstest månedlig."
echo "TIPS: sett CRYPTOCHAT_OFFSITE_DEST i /etc/default/cryptochat for off-site backup."
echo "      (f.eks. CRYPTOCHAT_OFFSITE_DEST=aktheman@umbrel:~/backups/cryptochat)"
