#!/bin/bash
set -e
cd "$(dirname "$0")"

# Generate secret key if it doesn't exist
if [ ! -f secrets/secret_key ]; then
    mkdir -p secrets
    python3 -c "import secrets; open('secrets/secret_key','wb').write(secrets.token_bytes(32))"
    echo "Generated new secret key"
fi

# Start with docker compose
docker compose up -d --build
echo "CryptoChat started. Access at http://localhost"
echo "Logs: docker compose logs -f"
