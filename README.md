# Irrlichter MVP

Leichtgewichtige, statische Website fuer das Moor-Kunst- und Umweltprojekt **Irrlichter**.

**Für KI-Assistenten / Handoff:** [AGENTS.md](AGENTS.md) · [docs/PROJECT-CONTEXT.md](docs/PROJECT-CONTEXT.md) · [docs/CODE-MAP.md](docs/CODE-MAP.md)

## Ziele

- MVP mit sehr kleinem Footprint
- Reine HTML/CSS/JavaScript-Dateien, kein Build-Schritt
- Direkter Upload per FTP, keine externen Dienste noetig
- Minimal JavaScript (Filter und Datenrendering)
- Flat-File Contentpflege ueber JSON im Repo

## Stack

- Reines HTML, CSS und JavaScript (Vanilla, ohne Framework)
- Inhalte aus JSON werden zur Laufzeit per `fetch` geladen und client-seitig gerendert
- Inhaltsmedien (Sammlung) in `assets/`; Website-Dateien (Icons, Favicon, Logos) in `files/`

## Projektstruktur

```
/
├── index.html          Startseite (Hero + Sammlung mit Filter)
├── 404.html            Fehlerseite (Apache ErrorDocument; mit &lt;base&gt; für beliebige URLs)
├── favicon.ico         Browser-Favicon (zusätzlich files/favicon.png)
├── veranstaltungen/index.html
├── ueber/index.html
├── impressum/index.html
├── datenschutz/index.html
├── css/
│   ├── style.css
│   └── fonts-italic.css   Fraunces Italic (async nachgeladen)
├── js/
│   ├── site-base.js    Site-Root, irrDataUrl, Scroll-Helfer
│   ├── site-icons.js   SVG-Icons (Sprite: files/icons.svg)
│   ├── main.js         Nav, Irrlicht, Scroll-Ambient
│   ├── collection.js   Sammlung aus collection.json
│   └── events.js       Termine aus events.json
├── data/
│   ├── collection.json Archiv-/Logbuch-Eintraege
│   └── events.json     Eventdaten
├── assets/             Inhaltsmedien (Sammlung: images/, audio/, video/)
│   ├── images/
│   ├── audio/
│   └── video/
├── files/              Website-Dateien (Icons, Favicon, Logos, UI-Bilder)
│   ├── icons.svg
│   ├── irrlicht.webp
│   └── icons/_parts/   Quell-SVGs für build-icon-sprite.sh
└── scripts/
    ├── deploy-ftp.sh           FTP-Deploy (Basis)
    ├── deploy-ftp-production.sh
    ├── deploy-ftp-beta.sh
    ├── smoke-test-live.sh      HTTP-Checks nach Deploy
    └── dev-server.py           Lokaler Server mit Kurz-URLs + 404.html
```

## Lokale Entwicklung

Die Seite laedt die JSON-Daten via `fetch`. Direktes Oeffnen der HTML-Dateien
ueber `file://` funktioniert in vielen Browsern nicht (CORS). Daher empfiehlt
sich ein einfacher statischer Webserver.

**Kurz-URLs lokal** (empfohlen):

```bash
python3 scripts/dev-server.py
# optional: python3 scripts/dev-server.py 8080
```

Danach: `http://127.0.0.1:8000/`, `http://127.0.0.1:8000/veranstaltungen`, …

**Im gleichen WLAN** (Handy, Tablet): Der Server hoert auf allen Interfaces und gibt
beim Start eine **Netzwerk-URL** aus (z. B. `http://192.168.1.42:8000/`) — diese im
Browser des anderen Geraets oeffnen, nicht `localhost`. Bei Verbindungsproblemen:
macOS-Firewall fuer Python eingehende Verbindungen erlauben; beide Geraete im gleichen
WLAN (kein Gast-Netz mit Client-Isolation).

Alternativ (ohne Legacy-Redirects): `python3 -m http.server 8000` — die Ordner
`/veranstaltungen/`, `/ueber/` usw. funktionieren direkt; nur `/veranstaltungen` ohne
Schraegstrich haengt vom Server ab (Dev-Server oben ist sicherer).

### SEO & Social (Meta)

Öffentliche Seiten haben `description`, `canonical`, Open Graph, Twitter Cards und (Startseite + Über) JSON-LD. Basis-URL: `https://irrlichter.net` — bei anderer Live-Domain in allen HTML-`<head>`-Blöcken anpassen. Vorschau-Bild: `/assets/images/260519_reading_fb.png`. Vorlage: `includes/page-meta.html`. Zusätzlich: `robots.txt`, `sitemap.xml`.

### Kurz-URLs (ohne `.html`)

Seiten liegen in **Ordnern** (`veranstaltungen/index.html` → URL `/veranstaltungen/`). Das
funktioniert auf Apache **auch ohne** `mod_rewrite` (per `DirectoryIndex`).

Zusaetzlich leitet `.htaccess` alte Pfade um (`/das-projekt` → `/ueber`, `/events` → `/veranstaltungen`, …).
Unbekannte URLs liefern die gestaltete **404-Seite** (`ErrorDocument 404 404.html`).
Beim FTP-Deploy **`.htaccess` mit hochladen** (versteckte Dateien einblenden).

Voraussetzungen Live-Server:

- Document Root = Ordner mit `index.html`, `404.html`, `veranstaltungen/`, `ueber/`, `.htaccess`
- Optional: `mod_rewrite` + `AllowOverride` fuer Legacy-Redirects und Cache-Header
- Unterordner-Deploy (z. B. `/beta/`): dieselbe `.htaccess` — Redirect-Ziele nutzen automatisch `/` bzw. `/beta/` (`IRR_PREFIX`)

VS Code-Nutzer koennen alternativ die Erweiterung **Live Server** verwenden.

## FTP-Deployment

Zwei Umgebungen auf demselben Server:

| Umgebung | Zielverzeichnis | URL | Skript / CI |
|----------|-----------------|-----|-------------|
| Production | `.` (Document Root) | `https://irrlichter.net/` | **Push auf `main`** (automatisch) oder `scripts/deploy-ftp-production.sh` |
| Staging | `beta/` | `https://irrlichter.net/beta/` | GitHub Actions → **Run workflow** → Target `beta` oder `scripts/deploy-ftp-beta.sh` |

**Workflow:** Auf `main` entwickeln → optional Staging per manuellem Workflow testen → Push auf `main` = Production.

Da kein Build-Schritt noetig ist, wird der Projekt-Inhalt direkt hochgeladen.

**Production vs. Inhalte:** Im Repo liegen Mock-Daten in `data/` und `assets/`; auf dem Live-Server stehen die echten Inhalte (Pflege per Filestash/FTP). Production-Deploys (Push auf `main`, `deploy-ftp-production.sh`, Workflow-Target `production`) setzen `FTP_SKIP_CONTENT=1` — `assets/` und `data/` werden nicht gespiegelt und auf dem Server nicht gelöscht. Staging (`beta`) lädt weiterhin alles inkl. Mock-Inhalte.

### Variante A: Per FTP-Client (FileZilla, Cyberduck, Transmit)

1. FTP-Client oeffnen und mit dem Server verbinden
2. Zielordner waehlen (haeufig `public_html/` oder `www/`)
3. Folgendes hochladen:
   - `index.html`, `404.html`, `favicon.ico`, `veranstaltungen/`, `ueber/`, `impressum/`, `datenschutz/`, `.htaccess`
   - `css/`, `js/`, `data/`, `assets/`, `files/`
4. Nicht hochladen: `.git/`, `scripts/`, `README.md`, `.cursor/`, `.vscode/`
5. Seite im Browser pruefen: `/`, `/ueber`, `/veranstaltungen` (ohne `.html`; siehe `.htaccess`)

### Variante B: Mit `scripts/deploy-ftp.sh`

Voraussetzung: `lftp` (macOS: `brew install lftp`)

Umgebungsvariablen setzen:

```bash
# Staging
bash scripts/deploy-ftp-beta.sh

# Production (Document Root)
bash scripts/deploy-ftp-production.sh
```

Alternativ mit Umgebungsvariablen:

```bash
export FTP_HOST="ftp.dein-host.tld"
export FTP_USER="dein-user"
export FTP_PASSWORD="dein-passwort"
export FTP_REMOTE_DIR="."   # Production; für Staging: beta
bash scripts/deploy-ftp.sh
```

Was das Skript macht:

1. Prueft, ob `lftp` verfuegbar ist
2. Prueft, ob `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD` gesetzt sind
3. Spiegelt den Projekt-Root in das Zielverzeichnis (`mirror -R --delete`), wobei
   `.git/`, `scripts/`, `README.md`, `node_modules/` ausgeschlossen sind.
   Mit `FTP_SKIP_CONTENT=1` (Production-Standard) zusätzlich `assets/` und `data/`.

### Production Go-Live

- **Automatisch:** Jeder Push auf `main` triggert GitHub Actions → FTP Production.
- **Manuell:** GitHub → **Actions** → **Deploy to Hetzner FTP** → Target `production` oder lokal `bash scripts/deploy-ftp-production.sh`
- **Nach Deploy prüfen:** `bash scripts/smoke-test-live.sh` (Root) und `bash scripts/smoke-test-live.sh https://irrlichter.net/beta` (Staging)

`FTP_REMOTE_DIR` für Production: `.` (Hetzner-FTP liegt oft schon im Document Root).

GitHub Secrets: `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD` (optional `FTP_REMOTE_DIR`).

## Contentpflege

`data/collection.json` und `data/events.json` direkt im Editor bearbeiten und
per FTP in den `data/`-Ordner auf dem Server hochladen.

## JSON-Schema

Die Seite ist nur auf Deutsch.

### Sammlung (`data/collection.json`)

Pflichtfelder pro Eintrag:

- `id` (eindeutig, nur Buchstaben/Zahlen/`-`/`_`)
- `title`
- `date` (ISO-Format `YYYY-MM-DD`)
- `type` (`image`, `video`, `audio`, `text`)
- `tags` (Array von Strings)
- `summary`
- `media.src`, `media.alt`

Optionale Felder:

- `media.poster` (optionales eigenes Video-Vorschaubild; sonst erster Frame automatisch)
- `location`
- `coordinates` (z. B. `"53.501, 8.702"`)

### Veranstaltungen (`data/events.json`)

Pflichtfelder pro Eintrag:

- `id`
- `date`
- `title`
- `location`
- `description`

Optional:

- `time` (z. B. `"17:00"`)
- `endDate` (ISO `YYYY-MM-DD`, letzter Tag bei mehrtaegigen Terminen — steuert „vergangen“)
- `dateLabel` (Anzeige bei mehrtaegigen Terminen, z. B. `"3.–5. Juli"`)
- `hours` (z. B. `"täglich 12–20 Uhr"` oder `"Den ganzen Tag"`)
- `with` (z. B. `"Mit …"`)
- `link`, `linkLabel`

## Performance-Hinweise

- Bilder in sinnvollen Zielgroessen ablegen (größter Hebel für PageSpeed)
- Video-Poster wird automatisch aus dem ersten Frame erzeugt (sichtbare Karten); optional `media.poster`
- Videos/Audio laden erst bei Abspielen; Poster erst bei sichtbarer Karte
- Sammlung lädt initial 20 Einträge, weitere beim Scrollen
- Sammlungsbilder: `loading="lazy"`; erste Karten mit `fetchpriority="high"`
- Fraunces Regular per `preload`; Italic in `css/fonts-italic.css` async
- `.htaccess`: gzip + Cache-Control für statische Assets
- Wetter-API (Open-Meteo) erst nach `requestIdleCallback`

## Hinweis zu JavaScript

Da Inhalte client-seitig aus JSON geladen werden, benoetigt die Seite aktives
JavaScript, um Sammlung und Veranstaltungen anzuzeigen. Header, Footer, Navigation und
Projekt-Texte funktionieren auch ohne JavaScript.
