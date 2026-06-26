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
├── veranstaltungen/index.html
├── ueber/index.html
├── impressum/index.html
├── datenschutz/index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js         Aktive Nav-Markierung
│   ├── collection.js   Laedt collection.json, rendert Karten, Filter
│   └── events.js       Laedt events.json, rendert Liste
├── data/
│   ├── collection.json Archiv-/Logbuch-Eintraege
│   └── events.json     Eventdaten
├── assets/             Inhaltsmedien (Sammlung: images/, audio/, video/)
│   ├── images/
│   ├── audio/
│   └── video/
├── files/              Website-Dateien (Icons, Favicon, Logos, UI-Bilder)
│   ├── icons.svg
│   └── icons/_parts/   Quell-SVGs für build-icon-sprite.sh
└── scripts/
    └── deploy-ftp.sh   Optionales FTP-Deploy-Skript
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

Zusaetzlich leitet `.htaccess` alte Pfade um (`/mitmachen` → `/veranstaltungen`, `/das-projekt` → `/ueber`, …).
Beim FTP-Deploy **`.htaccess` mit hochladen** (versteckte Dateien einblenden).

Voraussetzungen Live-Server:

- Document Root = Ordner mit `index.html`, `veranstaltungen/`, `ueber/`, `.htaccess`
- Optional: `mod_rewrite` + `AllowOverride` fuer Legacy-Redirects
- Unterordner-Deploy (z. B. `/beta/`): `RewriteBase /beta/` in `.htaccess`

VS Code-Nutzer koennen alternativ die Erweiterung **Live Server** verwenden.

## FTP-Deployment

Zwei Umgebungen auf demselben Server:

| Umgebung | Zielverzeichnis | URL | Skript / CI |
|----------|-----------------|-----|-------------|
| Production | `.` (Document Root) | `https://irrlichter.net/` | Push `main` oder `scripts/deploy-ftp-production.sh` |
| Staging | `beta/` | `https://irrlichter.net/beta/` | GitHub Actions → workflow `beta` oder `scripts/deploy-ftp-beta.sh` |

Workflow: Auf **beta** testen (manueller Workflow), dann auf `main` mergen/pushen → Production.

Da kein Build-Schritt noetig ist, wird der Projekt-Inhalt direkt hochgeladen.

### Variante A: Per FTP-Client (FileZilla, Cyberduck, Transmit)

1. FTP-Client oeffnen und mit dem Server verbinden
2. Zielordner waehlen (haeufig `public_html/` oder `www/`)
3. Folgendes hochladen:
   - `index.html`, `veranstaltungen/`, `ueber/`, `impressum/`, `datenschutz/`, `.htaccess`
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
   `.git/`, `scripts/`, `README.md`, `node_modules/` ausgeschlossen sind

### Production Go-Live (einmalig)

1. GitHub → **Actions** → **Deploy to Hetzner FTP** → **Run workflow** → Target: **production**
2. Oder lokal: `.env` mit `FTP_REMOTE_DIR=.` → `bash scripts/deploy-ftp-production.sh`
3. Prüfen: `bash scripts/smoke-test-live.sh` (Root) und `bash scripts/smoke-test-live.sh https://irrlichter.net/beta`

`FTP_REMOTE_DIR` für Production: `.` (Hetzner-FTP liegt oft schon im Document Root).

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

- `media.poster` (z. B. fuer Videos)
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
- `dateLabel` (Anzeige bei mehrtaegigen Terminen, z. B. `"3.–5. Juli"`)
- `hours` (z. B. `"täglich 12–20 Uhr"` oder `"Den ganzen Tag"`)
- `with` (z. B. `"Mit …"`)
- `link`, `linkLabel`

## Performance-Hinweise

- Bilder in sinnvollen Zielgroessen ablegen
- Moderne Formate bevorzugen (WebP/AVIF), wenn verfuegbar
- Audio/Video mit `preload="metadata"` (so im Renderer eingestellt)
- Nur notwendige Skripte beibehalten

## Hinweis zu JavaScript

Da Inhalte client-seitig aus JSON geladen werden, benoetigt die Seite aktives
JavaScript, um Sammlung und Mitmach-Termine anzuzeigen. Header, Footer, Navigation und
Projekt-Texte funktionieren auch ohne JavaScript.
