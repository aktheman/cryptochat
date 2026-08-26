# Google Play Store — klargjøring

## Steg 1: Utviklerkonto
1. Gå til https://play.google.com/console
2. Opprett konto (engangsavgift $25 USD)
3. Vent på identitetsverifisering (kan ta 1–3 virkedager)

## Steg 2: Opprett app
1. «Opprett app» → navn: **CryptoChat** → app (ikke spill) → Gratis
2. Pakkenavn: `no.aktheman.cryptochat` (må stemme med build.gradle)

## Steg 3: Store listing

### Navn
CryptoChat

### Kort beskrivelse (80 tegn)
Sikker, ende-til-ende-kryptert meldingstjeneste. Bare du og mottakeren kan lese meldingene.

### Fullstendig beskrivelse
CryptoChat er en ende-til-ende-kryptert chat-app bygget med personvern i sentrum.

Funksjoner:
• Ende-til-ende-kryptering (E2EE) på alle meldinger og filer
• Forsvinnende meldinger med selvdestruering
• Stemme- og videosamtaler via WebRTC
• Grupper med E2EE og nøkkelrotasjon
• Historier, avstemninger og pinning av meldinger
• To-faktor-autentisering (TOTP)
• Usynlig modus og stille timer
• AI-genererte svarforslag (valgfritt)
• Søk i meldinger med full dekryptering
• Flere økter med enhetskontroll

Kildekoden er åpen og revisjonbar. CryptoChat drives ikke av annonser og selger aldri dine data.

### Screenshots (minimum 2, anbefalt 4–8)
Ta screenshots i disse situasjonene:
1. **Hovedskjerm / samtaleliste** — vis uleste meldinger og samtaleoversikt
2. **Åpen chat** — vis E2EE-ikon, meldingsbobler, reaksjoner
3. **Gruppechat** — vis medlemsliste og gruppefunksjoner
4. **Stemmevideosamtale** — vis anropsgrensesnitt
5. **Innstillinger / sikkerhet** — vis 2FA, enheter, forsvinnende meldinger
6. **Historier / avstemninger** — vis rike meldingstyper

Krav:
- PNG eller JPEG
- Minst 2 skjermbilder
- Minste oppløsning: 320px, største: 3840px
- Sideforhold: 16:9 eller 9:16
- Anbefalt: 1080×1920 (mobilskjermer)

### Ikon
- 512×512 PNG, allerede generert: `static/img/icon-512.png`

### Feature-grafikk
- 1024×500 PNG — ikke generert ennå
- Bruk ikonet + «Sikker. Kryptert. Din.» som tekst

### Kategori
Sosialt

### Kontakt-e-post
Din e-postadresse

### Personvernerklæring
URL: `https://[domene]/privacy` (allerede opprettet)

## Steg 4: Data Safety
I Google Play Console → Appinnstillinger → Data Safety:
- Samler inn: Plasseringsdata (nei), Personlige meldinger (ja), Finansiell info (nei)
- Deler med tredjeparter: Nei
- Kryptering i transit: Ja
- Sletting av data: Ja, brukere kan slette egne data
- Ansvarlig utgiver: CryptChat

## Steg 5: Innholdsvurdering
- Ingen seksuelt innhold
- Ingen vold
- Ingen rusmidler
- Resultat: Alle aldre (Everyone / PEGI 3)

## Steg 6: Intern testing
1. Testing → Intern testing
2. Last opp AAB fra GitHub Actions: `cryptochat-release-aab`-artefakten
3. Legg til testere via Google Groups eller e-post
4. Tester installerer via Play Store Testing-lenke

## Steg 7: Produksjon
- Etter test: send til gjennomgang
- Gjennomgang tar vanligvis 1–3 dager
- Ha minst 2 tester klare for intern testing før du sender

## Nødvendige GitHub-secrets (allerede på plass)
- `GOOGLE_SERVICES_JSON`
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
