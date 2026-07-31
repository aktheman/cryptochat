# CryptoChat

Selv-hostet, ende-til-ende-kryptert chatteapplikasjon. Kjører på Raspberry Pi / Linux med Flask + Socket.IO + SQLite.

## Funksjoner

- ✅ Ende-til-ende-kryptering (E2EE) for meldinger og filer
- ✅ Sanntidsmeldinger via WebSocket (Socket.IO)
- ✅ Gruppechatter med E2EE
- ✅ Kanaler (broadcast)
- ✅ Talemeldinger (opptak + avspilling)
- ✅ Videosamtaler (WebRTC)
- ✅ Skjermdeling
- ✅ Trådsvar
- ✅ Emoji-auto-complete
- ✅ @-mention highlighting
- ✅ Raske maler (hurtigmeldinger)
- ✅ Tagger/labels
- ✅ Chat-mapper
- ✅ Arkivering av chatter
- ✅ Planlagte meldinger
- ✅ Globalt meldingssøk
- ✅ Blokkering av brukere
- ✅ Egendefinerte varsler per chat
- ✅ App-lås (PIN-kode)
- ✅ Stealth-modus
- ✅ Slett historikk
- ✅ Angre sletting
- ✅ Selvødeleggende konto
- ✅ PDF-forhåndsvisning
- ✅ Videoavspiller i meldinger
- ✅ Tofaktorautentisering (2FA)
- ✅ Invitasjonslenker
- ✅ Administrasjonspanel
- ✅ Temaer (Flere fargetemaer)
- ✅ Offline-støtte (Service Worker)
- ✅ Progressiv Web App (PWA)
- ✅ Mobilvennlig grensesnitt
- ✅ Push-varsler (browser-notifikasjoner)
- ✅ Tastatursnarveier (Esc, Ctrl+K, Ctrl+N)
- ✅ Send på Enter (valgfritt)

## Installasjon

### Krav
- Python 3.10+
- Linux (testet på Raspberry Pi OS / Ubuntu / Debian)

### 1. Klon repoet
```bash
git clone https://github.com/dittbrukernavn/cryptochat.git
cd cryptochat
```

### 2. Oppsett
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
mkdir -p data
```

### 3. Konfigurasjon
```bash
export SECRET_KEY="din-hemmelige-nokkel"
export APP_VERSION="3.4.0"
```

### 4. Kjør
```bash
gunicorn --bind 127.0.0.1:5000 --workers 2 app:app
```

### Systemd-tjeneste (anbefalt)
```ini
[Unit]
Description=CryptoChat
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/cryptochat
Environment=PATH=/home/pi/cryptochat/.venv/bin
Environment=SECRET_KEY=din-hemmelige-nokkel
ExecStart=/home/pi/cryptochat/.venv/bin/gunicorn --bind 127.0.0.1:5000 --workers 2 app:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Tailscale Serve (anbefalt for HTTPS)
```bash
sudo tailscale serve --https 443 http://127.0.0.1:5000
```

## Arkitektur

```
cryptochat/
├── app.py              # Flask-applikasjon + API-endepunkter
├── sockets.py          # Socket.IO-hendelser (sanntid)
├── config.py           # Konfigurasjon + fillagring
├── requirements.txt    # Python-avhengigheter
├── data/               # JSON-lagring (opprettes automatisk)
├── static/
│   ├── css/
│   │   ├── style.css   # Hovedstilark
│   │   └── login.css   # Innloggingsstil
│   ├── js/
│   │   ├── chat.js     # Hovedklient
│   │   ├── socket.js   # Socket.IO-klient
│   │   ├── auth.js     # Autentisering
│   │   ├── crypto.js   # Kryptografi
│   │   ├── bootstrap.js# Oppstart
│   │   ├── admin.js    # Adminpanel
│   │   └── offline.js  # Offline-støtte
│   ├── sw.js           # Service Worker
│   └── uploads/        # Filopplastinger
└── templates/
    ├── chat.html       # Hovedchat-grensesnitt
    └── login.html      # Innloggingsside
```

## API-endepunkter (utvalgte)

| Metode | Sti | Beskrivelse |
|--------|-----|-------------|
| POST | `/auth/login` | Logg inn |
| POST | `/auth/register` | Registrer bruker |
| POST | `/send` | Send melding |
| GET | `/messages/<other_user>` | Hent meldinger |
| POST | `/upload` | Last opp fil |
| POST | `/groups/create` | Opprett gruppe |
| POST | `/groups/<id>/send` | Send i gruppe |
| GET | `/users/all` | List brukere |
| GET | `/search?q=` | Globalt søk |
| POST | `/pins` | Fastgjør melding |
| POST | `/schedule` | Planlegg melding |
| POST | `/block/<user>` | Blokker bruker |
| POST | `/archive/<chat>` | Arkiver samtale |
| GET | `/health` | Health check |

## Kryptografi

- **Meldinger**: AES-256-GCM + ECDH-nøkkelutveksling
- **Grupper**: Felles AES-256-GCM-nøkkel delt med E2EE
- **Filer**: Kryptert med samme nøkkel som meldinger
- **Nøkkellagring**: IndexedDB i nettleseren

## Lisens

MIT
