# CryptoChat - Deployment

## Systemd services
- App: `cryptochat.service` -> binds `127.0.0.1:5000`
- Caddy: `caddy.service` -> serves HTTPS via `Caddyfile` on port `:8080`

## HTTPS
### Domain setup
Replace `chat.din-domene.no` in `Caddyfile` with your actual domain.
Ensure your router forwards ports 80 and 443 to this machine,
and DNS points to this host's public IP.

Apply config:
```bash
sudo cp Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy will request and renew Let's Encrypt certs automatically.

### Local self-signed fallback
If DNS is not ready, use:
```
:8080 {
  reverse_proxy 127.0.0.1:5000
  tls internal
  encode gzip
}
```
Install Caddy's internal CA locally:
```bash
sudo caddy trust
```

## Reports
- Health: `GET /health`
- Login page: `GET /login`
