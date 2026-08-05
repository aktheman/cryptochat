#!/usr/bin/env bash
# Lokal verifikasjon før commit/push — speiler .github/workflows/ci.yml.
set -euo pipefail
cd "$(dirname "$0")/.."

VENV=.
if [ -x .venv/bin/python ]; then VENV=.venv; fi

echo "[1/4] Python-syntaks"
$VENV/bin/python -m compileall -q app.py config.py db.py sockets.py backup_crypto.py

echo "[2/4] JS-syntaks"
node --check static/js/chat.js
node --check static/js/socket.js
node --check static/js/bootstrap.js
node --check static/sw.js

echo "[3/4] Tester"
$VENV/bin/python -m pytest tests/ -q

echo "[4/4] Sårbarheter i avhengigheter"
if $VENV/bin/python -c "import pip_audit" 2>/dev/null; then
  $VENV/bin/python -m pip_audit -r requirements.txt --skip-editable
else
  echo "pip-audit ikke installert — installér med: $VENV/bin/pip install pip-audit"
fi

echo "OK: alt grønt."
