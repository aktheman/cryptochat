# CryptoChat — Agent-notater

## Kommandoer

- **Tester**: `.venv/bin/python -m pytest tests/test_app.py -x -q`
- **Full sjekk**: `bash scripts/check.sh` (Python-syntaks, JS-syntaks, pytest, pip-audit)
- **Dev-server**: `.venv/bin/python app.py` (localhost:5000)
- **Deploy**: `sudo systemctl restart cryptochat && sudo systemctl status cryptochat`

## Nye endepunkter

| Metode |bane | Beskrivelse | Tilgang |
|--------|-----|-------------|---------|
| POST | `/settings/invisible` | Slå på/av usynlig modus | `require_login` |
| POST | `/ai/draft` | AI-generert svarforslag (suggest/rewrite/shorten) | `require_login`, rate-limit 6/120s |
| POST | `/groups/<id>/invite` | Opprett engangsgjestelenke (E2EE) | `require_login`, eier/mod |
| POST | `/groups/<id>/invite/<token>/key` | Lever wrappedKey til invitasjon | `require_login`, medlem |
| POST | `/groups/<id>/keys/rotate` | Roter gruppe-E2EE-nøkkel | `require_login`, eier |
| GET  | `/config` | Returnerer vindu for slett-for-alle + versjon | `require_login` |

## Klient-side hendelser (socket)

- `kicked` — bruker ble fjernet fra gruppe
- `group_members_changed` — medlemsliste endret (bruk `groupId` felt)
- `message_deleted` — melding slettet (bruk `messageId` felt)
- `pair_key_rotated` — E2EE-nøkkel rotert

## Byggeendringer

- `GET /config` returnerer `deleteEveryoneWindowSeconds` og `version`
- `DELETE_EVERYONE_WINDOW_MS` caches i `localStorage` (TTL 5 min)
- `updateInvisibleIndicator()` oppdaterer onlineStatus-badge med "👻 Usynlig"
- ASCII-norske tegn (`noekkel`, `maa`, `foerst`) er erstattet med Unicode (`nøkkel`, `må`, `først`)
- `Unknown` → `Ukjent` i alle `device`-defaulter
