# CryptoChat - Deployment

## Systemd services
- App: `cryptochat.service` -> binds `127.0.0.1:5000`
- Caddy: `caddy.service` -> serves HTTP on `*:80`

**Note:** WebSocket support requires gevent-websocket workers. Update the systemd service:
```
ExecStart=/home/aktheman/cryptochat/.venv/bin/gunicorn \
  --worker-class geventwebsocket.gunicorn.workers.GeventWebSocketWorker \
  --bind 127.0.0.1:5000 \
  --workers 1 \
  --worker-connections 1000 \
  --timeout 120 \
  --log-file /var/log/cryptochat/gunicorn.log \
  --error-logfile /var/log/cryptochat/gunicorn-error.log \
  app:app
```

## Access
Local:
```bash
http://127.0.0.1:8080
curl -s http://127.0.0.1:8080/health
```

VPN/remote:
```bash
tailscale serve --http 8080
# Access via https://<pi-hostname>.ts.net:8080
```

Public funnel (optional, must be enabled in tailnet settings):
```bash
sudo tailscale funnel --yes http://127.0.0.1:8080
tailscale funnel status
# Access via https://<pi-hostname>.ts.net
```

Local HTTPS with Caddy (self-signed, no external tunnel):
```bash
sudo cp Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```
Then on each client:
```bash
sudo caddy trust
```

## Real domain HTTPS
If you have a domain and want Caddy to auto-manage TLS:

1. Point DNS A/AAAA to this machine's public IP.
2. Use this Caddyfile:
```
chat.din-domene.no {
  reverse_proxy 127.0.0.1:5000
  encode gzip
}
```
3. Reload Caddy.

## Reports
- Health: `GET /health`
- Login page: `GET /login`

## Backup og restore

### Automatisk backup
Daglig kryptert backup kl 03:17 (systemd-timer). Se status:
```bash
systemctl list-timers cryptochat-backup.timer
sudo journalctl -u cryptochat-backup.service --since today
```
Backups lagres i `/var/backups/cryptochat/` (AES-256-GCM).

Manuell backup:
```bash
sudo scripts/backup.sh          # beholder de 7 nyeste
sudo scripts/backup.sh 30       # beholder de 30 nyeste
```

**Viktig om `backup_key`:** `secrets/backup_key` lagres ALDRI i backupen.
Oppbevar den sikkert utenfor maskinen — uten den kan backups ikke dekrypteres.
Sjekk at den finnes: `ls -l secrets/backup_key`.

### Restore
```bash
sudo systemctl stop cryptochat
sudo scripts/restore.sh /var/backups/cryptochat/cryptochat-backup-<stamp>.enc
sudo systemctl start cryptochat
```
Scriptet krever at `secrets/backup_key` finnes, verifiserer SQLite-integritet,
og sikkerhetskopierer nåværende `data/` til `/var/backups/cryptochat/pre-restore-*.tar.gz`
før det overskriver. Legg til `--secrets` for også å gjenopprette `secrets/`
(ved migrering til ny maskin).

### VAPID-nøkkelrotasjon (push)
```bash
sudo scripts/rotate_vapid.py
sudo systemctl restart cryptochat
```
Gamle nøkler lagres i `secrets/*.old`. Klienter re-subscriber automatisk
ved neste besøk (bootstrap.js).
