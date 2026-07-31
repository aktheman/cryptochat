#!/usr/bin/env bash
set -e

echo "=== CryptoChat Installer ==="

if ! command -v python3 &> /dev/null; then
    echo "Python 3 er ikke installert. Installer med: sudo apt install python3 python3-venv"
    exit 1
fi

if [ ! -d ".venv" ]; then
    echo "Oppretter virtuelt miljo..."
    python3 -m venv .venv
fi

echo "Installerer avhengigheter..."
source .venv/bin/activate
pip install -r requirements.txt

mkdir -p data/uploads

echo ""
echo "=== Installasjon fullfort! ==="
echo ""
echo "For å starte:"
echo "  1. source .venv/bin/activate"
echo "  2. export SECRET_KEY=\"din-hemmelige-nokkel\""
echo "  3. gunicorn --bind 127.0.0.1:5000 --workers 2 app:app"
echo ""
echo "Eller med systemd:"
echo "  sudo cp cryptochat.service /etc/systemd/system/"
echo "  sudo systemctl enable --now cryptochat"
