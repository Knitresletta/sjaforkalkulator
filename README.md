# Sjåførkalkulator

Liten web-app som regner ut hva en kjøretur koster: **drivstoff** (literpris ×
forbruk × avstand) pluss **slitasje** (dekk, service, vedlikehold), og deler
gjerne summen på antall passasjerer.

Mobil-først, ingen byggesteg, ingen avhengigheter. Ren HTML/CSS/JS — laget for å
kjøre på GitHub Pages og senere pakkes inn i en iOS-app.

## Funksjoner

- Literpris, forbruk (l/100 km) og avstand inn → kostnad ut, **live** mens du skriver
- **Tur/retur**-bryter som dobler avstanden
- **Slitasje** som forhåndsvalg (Ingen 0 / Lav 1,0 / Middels 1,5 / Høy 2,0 kr/km) eller eget tall. «Ingen» gir ren drivstoffkostnad, nyttig for å anslå hva en tur koster deg selv i bensin
- **Spleis**: del totalen på antall personer
- Oppdeling i drivstoff vs. slitasje, pluss kr/mil
- Norske kommatall (`21,90`) håndteres, og mobiltastaturet viser tall
- Husker verdiene dine mellom besøk (localStorage)
- Installerbar på Hjem-skjerm (PWA-manifest), følger lys/mørk systemtema

## Kjøre lokalt

Det er en statisk side — åpne `index.html` rett i nettleseren, eller server den:

```bash
python3 -m http.server 8000
# åpne http://localhost:8000
```

(En server trengs kun for at PWA-manifestet skal lastes; selve kalkulatoren
fungerer fint ved å åpne fila direkte.)

## Tester

Regnelogikken i `calc.js` er dekket av tester som kjører på Nodes innebygde
test-runner — ingen `npm install`:

```bash
node --test
node --check app.js   # rask syntaks-sjekk av frontend-koden
```

## Slitasjetallene

Kalkulatoren skiller bevisst slitasje fra drivstoff. Den kjente satsen på
**3,50 kr/km** (statens kjøregodtgjørelse) *inkluderer* drivstoff og passer
derfor ikke her — da ville bensinen telt dobbelt. Forhåndsvalgene (1,0–2,0
kr/km) er "ren slitasje": dekk, service og vedlikehold, basert på
NAF-/bransjeestimater.

Kilder: [NAF – kostnader](https://www.naf.no/bilhold/kostnader),
[NAF – kjøregodtgjørelse](https://nye.naf.no/bilhold/kostnader/satser-for-kjoregodtgjorelse).

## Filer

| Fil | Ansvar |
|-----|--------|
| `index.html` | Struktur og felter |
| `style.css` | Mobil-først styling (`sk-`-prefiks) |
| `calc.js` | Ren regnelogikk — testbar, uten DOM |
| `app.js` | Kobler skjema til skjerm + localStorage |
| `test/calc.test.js` | Tester for `calc.js` |
| `manifest.webmanifest`, `icon.svg` | PWA / Hjem-skjerm |

## Publisere på GitHub Pages

1. Lag et repo og push disse filene til `main`.
2. **Settings → Pages → Source: Deploy from a branch**, velg `main` / `/ (root)`.
3. Siden blir tilgjengelig på `https://<bruker>.github.io/<repo>/` etter litt.

## Veien videre mot App Store

Siden dette er en ren web-app, er den naturlige veien til iOS å pakke den inn
(f.eks. [Capacitor](https://capacitorjs.com/) eller en enkel `WKWebView`).
Da gjenbrukes all koden her som den er. Før innpakking bør `icon.svg`
suppleres med PNG-ikoner i App Store-størrelsene.
