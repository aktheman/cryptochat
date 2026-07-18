# CryptoChat - Deployment

## Systemd services
- App: `cryptochat.service` -> binds `127.0.0.1:5000`
- Caddy: `caddy.service` -> serves HTTP on `*:8080`

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
