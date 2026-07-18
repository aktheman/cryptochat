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

Public funnel (optional):
```bash
sudo tailscale funnel 80 http://127.0.0.1:8080
# Access via https://<pi-hostname>.ts.net
```

## Caddyfile
Configured for local reverse proxy on port `:8080`.

To enable HTTPS with a real domain in Cloudflare, replace the Caddyfile with:
```
chat.din-domene.no {
  reverse_proxy 127.0.0.1:5000
  encode gzip
}
```

## Reports
- Health: `GET /health`
- Login page: `GET /login`
