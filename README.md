# CryptoChat

Selv-hostet, ende-til-ende-kryptert chatteapplikasjon. Kjører på Raspberry Pi / Linux med Flask + Socket.IO.

## Funksjoner

### Meldinger
- ✅ Ende-til-ende-kryptering (E2EE) — AES-256-GCM + ECDH
- ✅ Sanntidsmeldinger via WebSocket (Socket.IO)
- ✅ Gruppechatter med E2EE og nøkkelrotasjon
- ✅ Kanaler (broadcast)
- ✅ Forsvinnende meldinger (selvdestruerende etter tid)
- ✅ Søk i meldinger med full dekryptering (tekst, avsender, dato, type)
- ✅ Planlagte meldinger
- ✅ Trådsvar, @-mentions, emoji-auto-complete
- ✅ Reaksjoner og effekter (konfetti, hjerter, fyrverkeri, snø, stjerner)

### Kommunikasjon
- ✅ Videosamtaler og lydsamtaler (WebRTC, STUN/TURN)
- ✅ Skjermdeling
- ✅ Talemeldinger (opptak + avspilling)
- ✅ PDF-forhåndsvisning og videoavspilling i meldinger
- ✅ Fildeling med kryptering

### Organisering
- ✅ Chat-mapper og arkivering
- ✅ Fastgjorte meldinger (pins)
- ✅ Tagger/labels
- ✅ Globalt meldingssøk
- ✅ Historier (stories)
- ✅ Avstemninger

### Sikkerhet
- ✅ To-faktorautentisering (TOTP)
- ✅ App-lås (PIN-kode)
- ✅ Usynlig modus
- ✅ Selvødeleggende konto
- ✅ Blokkering av brukere
- ✅ Flere økter med enhetskontroll (logg ut enkelte enheter)
- ✅ CSRF-beskyttelse, rate-limiting, HSTS, CSP
- ✅ Null-downtime deploy (graceful restart)
- ✅ Strukturert logging (parsebart)

### Varsler & Oppetid
- ✅ Native push-varsler via FCM (Android-app)
- ✅ Web-push (nettlesere)
- ✅ Vaktmester: server-feil → FCM-varsel på telefonen
- ✅ Kryptert backup + off-site-kopi (Tailscale)
- ✅ Automatisk gjenopprettingstest (månedlig)
- ✅ Automatiske OS-sikkerhetsoppdateringer (unattended-upgrades)

### Klient
- ✅ Offline-støtte (Service Worker)
- ✅ Progressiv Web App (PWA)
- ✅ Android-app (Capacitor wrapper)
- ✅ Mobilvennlig grensesnitt
- ✅ Tastatursnarveier (Esc, Ctrl+K, Ctrl+N, Ctrl+D)
- ✅ Temaer (flere fargetemaer)
- ✅ AI-genererte svarforslag (suggest/rewrite/shorten)
- ✅ Administrasjonspanel

## Installasjon

### Krav
- Python 3.10+
- Node.js 18+ (kun for Android-build)
- Linux (testet på Raspberry Pi OS / Debian)

### 1. Klon og sett opp
```bash
git clone https://github.com/aktheman/cryptochat.git
cd cryptochat
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Konfigurasjon
```bash
# Secrets (opprettet automatisk ved første kjøring)
mkdir -p secrets data

# Miljøvariabler (valgfritt — har defaults)
export FLASK_ENV=production
export SESSION_COOKIE_SECURE=true
export CSRF_ENABLED=true
```

### 3. Kjør
```bash
.venv/bin/python app.py          # Utvikling
.venv/bin/gunicorn --bind 127.0.0.1:5000 --workers 2 app:app  # Produksjon
```

### 4. Systemd-tjeneste (anbefalt)
```bash
sudo cp cryptochat.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now cryptochat
```

### 5. HTTPS via Tailscale (anbefalt)
```bash
sudo tailscale serve --https 443 http://127.0.0.1:5000
```

### 6. Vaktmester + oppdateringer
```bash
bash scripts/install-watchdog.sh
```

## Android-app

```bash
npm install
npx cap sync android
cd android && ./gradlew assembleDebug
```

CI bygger debug + release + signert AAB automatisk (GitHub Actions).
Se `docs/play-store.md` for Google Play-oppsett.

## Drift

| Kommando | Formål |
|----------|--------|
| `sudo systemctl restart cryptochat` | Deploy ny versjon |
| `bash scripts/check.sh` | Full kvalitetssjekk |
| `.venv/bin/python scripts/restore_drill.py` | Test backup-gjenoppretting |
| `systemctl list-timers \| grep cryptochat` | Se aktive timere |
| `journalctl -u cryptochat -f` | Følg logger |

## Arkitektur

```
cryptochat/
├── app.py                  # Flask + API + E2EE + push
├── sockets.py              # Socket.IO-hendelser
├── db.py                   # SQLite + JSON-lagring
├── config.py               # Konfigurasjon
├── static/js/
│   ├── chat.js             # Hovedklient (7000+ linjer)
│   ├── bootstrap.js        # Oppstart + FCM-registrering
│   ├── crypto.js           # E2EE-nøkkelhåndtering
│   └── socket.js           # Sanntid
├── templates/
│   ├── chat.html           # Hovedchat
│   ├── login.html          # Innlogging
│   └── privacy.html        # Personvernerklæring
├── android/                # Capacitor Android-app
├── scripts/
│   ├── backup.sh           # Kryptert backup + off-site
│   ├── watchdog.py         # Service-overvåking + FCM-push
│   ├── restore_drill.py    # Automatisk gjenopprettingstest
│   └── install-watchdog.sh # Installer timere
├── docs/
│   └── play-store.md       # Google Play-oppsett
└── tests/
    └── test_app.py         # 350+ tester
```

## Sikkerhet

- E2EE: AES-256-GCM + X25519 ECDH (meldinger, filer, grupper)
- Nøkler lagres kun i nettleseren (IndexedDB) — aldri på serveren
- Passord saltsede hash (werkzeug)
- HSTS, CSP, X-Frame-Options: DENY
- Rate-limiting på sensitive endepunkter
- Sikkerhetsrevisjon gjennomført (se commit-logg)

## Lisens

MIT
