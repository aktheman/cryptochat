# CryptoChat

Ende-til-ende-kryptert chatteapplikasjon med fokus på personvern.

## Funksjoner

- **Krypterte meldinger** — ECDH + AES-256-GCM med forward secrecy
- **Grupper** — med admin/moderator-roller, invitasjonslenker, sakte modus
- **Samtaler** — WebRTC video/audio med signaling via polling
- **Filer og bilder** — opplasting og deling med forhåndsvisning
- **Selvdestruerende meldinger** — tidsbestemt sletting
- **2FA** — TOTP-basert tofaktorautentisering
- **Gjenopprettingskoder** — for å komme inn igjen ved glemt passord
- **Avstemninger** — med enkelt- eller flervalg
- **Klistremerker og GIF** — for moro skyld
- **Historier/Status** — 24-timers innlegg
- **Kanaler** — broadcast til mange abonnenter
- **Stedstjenester** — send posisjon og levende stedsdeling
- **Multi-device** — synkroniser nøkler på tvers av enheter
- **Mørk/lys-tema** — og tilpassede bakgrunnsbilder
- **PWA** — installer som app, push-varsler, offline-støtte
- **Adminpanel** — brukeradministrasjon, rapportering, statistikk

## Kom i gang

### Lokalt (utvikling)

```bash
# Generer hemmelig nøkkel
python3 -c "import secrets; open('secrets/secret_key','wb').write(secrets.token_bytes(32))"

# Installer avhengigheter
pip install -r requirements.txt

# Start (utviklingsmodus)
python app.py

# Åpne i nettleser
open http://localhost:5000
```

### Produksjon (systemd)

```bash
# Installer avhengigheter i virtuelt miljø
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Kopier og start systemd-tjeneste
sudo cp cryptochat.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now cryptochat
```

### Produksjon (Docker)

```bash
./start-prod.sh
# eller
docker compose up -d --build
```

## Push-varsler (PWA)

For push-varsler trenger du VAPID-nøkler:

```bash
# Generer VAPID-nøkler
pip install pywebpush
python3 -c "
from pywebpush import generate_vapid_keys
keys = generate_vapid_keys()
print('VAPID_PUBLIC_KEY=' + keys['public_key'])
print('VAPID_PRIVATE_KEY=' + keys['private_key'])
"
```

Sett miljøvariablene `VAPID_PUBLIC_KEY` og `VAPID_PRIVATE_KEY` før du starter appen.

## API

Appen har et REST API. Alle endepunkter krever innlogging (session) med mindre annet er spesifisert.

### Autentisering

| Metode | Sti | Beskrivelse |
|--------|-----|-------------|
| POST | `/auth/register` | Opprett konto |
| POST | `/auth/login` | Logg inn |
| POST | `/auth/logout` | Logg ut |
| POST | `/auth/logout-all` | Logg ut alle enheter |
| POST | `/auth/2fa/enable` | Aktiver 2FA |
| POST | `/auth/2fa/disable` | Deaktiver 2FA |
| POST | `/auth/recovery` | Tilbakestill passord med gjenopprettingskode |

### Meldinger

| Metode | Sti | Beskrivelse |
|--------|-----|-------------|
| GET | `/messages/<bruker>` | Hent meldinger |
| POST | `/send` | Send melding |
| PUT | `/messages/<id>/edit` | Rediger melding |
| DELETE | `/messages/<id>` | Slett melding |

### Gruppen

| Metode | Sti | Beskrivelse |
|--------|-----|-------------|
| GET | `/groups` | List grupper |
| POST | `/groups` | Opprett gruppe |
| POST | `/groups/<id>/send` | Send gruppemelding |
| GET | `/groups/<id>/messages` | Hent gruppemeldinger |
| DELETE | `/groups/<id>` | Slett gruppe |

### Helse

| Metode | Sti | Beskrivelse |
|--------|-----|-------------|
| GET | `/health` | Helse-sjekk |

## Tester

```bash
pytest tests/ -v
```

## Deployment

Se [DEPLOY.md](DEPLOY.md) for detaljer om deployment med Tailscale, Caddy og Docker.

## Lisens

Privat prosjekt.