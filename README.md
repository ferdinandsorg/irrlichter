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
- Lokale Assets in `assets/`
- Optionaler Browser-Editor (`admin/`) fuer das Bearbeiten der JSON-Dateien

## Projektstruktur

```
/
├── index.html          Startseite (Hero + Sammlung mit Filter)
├── veranstaltungen/index.html
├── ueber/index.html
├── impressum/index.html
├── datenschutz/index.html
├── admin/index.html    Browser-Editor (optional, nicht im Standard-Deploy)
├── css/
│   └── style.css
├── js/
│   ├── main.js         Aktive Nav-Markierung
│   ├── collection.js   Laedt collection.json, rendert Karten, Filter
│   ├── events.js       Laedt events.json, rendert Liste
│   └── admin.js        Editor-Logik (Laden, Bearbeiten, Export)
├── data/
│   ├── collection.json Archiv-/Logbuch-Eintraege
│   └── events.json     Eventdaten
├── assets/
│   ├── images/
│   ├── audio/
│   └── video/
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

Da kein Build-Schritt noetig ist, wird der Projekt-Inhalt direkt hochgeladen.

### Variante A: Per FTP-Client (FileZilla, Cyberduck, Transmit)

1. FTP-Client oeffnen und mit dem Server verbinden
2. Zielordner waehlen (haeufig `public_html/` oder `www/`)
3. Folgendes hochladen:
   - `index.html`, `veranstaltungen/`, `ueber/`, `impressum/`, `datenschutz/`, `.htaccess`
   - optional `admin/` (siehe Hinweis unten)
   - `css/`, `js/`, `data/`, `assets/`
4. Nicht hochladen: `.git/`, `scripts/`, `README.md`, `.cursor/`, `.vscode/`
5. Seite im Browser pruefen: `/`, `/ueber`, `/veranstaltungen` (ohne `.html`; siehe `.htaccess`)

### Variante B: Mit `scripts/deploy-ftp.sh`

Voraussetzung: `lftp` (macOS: `brew install lftp`)

Umgebungsvariablen setzen:

```bash
export FTP_HOST="ftp.dein-host.tld"
export FTP_USER="dein-user"
export FTP_PASSWORD="dein-passwort"
export FTP_REMOTE_DIR="/public_html"
```

Deploy ausfuehren:

```bash
bash scripts/deploy-ftp.sh
```

Falls `admin/` und `js/admin.js` nicht auf den Server sollen:

```bash
INCLUDE_ADMIN=0 bash scripts/deploy-ftp.sh
```

Was das Skript macht:

1. Prueft, ob `lftp` verfuegbar ist
2. Prueft, ob `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD` gesetzt sind
3. Spiegelt den Projekt-Root in das Zielverzeichnis (`mirror -R --delete`), wobei
   `.git/`, `scripts/`, `README.md`, `node_modules/` und Editor-Ordner
   ausgeschlossen sind

## Contentpflege

Es gibt zwei Wege, Inhalte zu pflegen.

### Variante 1: JSON direkt bearbeiten

`data/collection.json` und `data/events.json` lassen sich mit jedem Texteditor
oeffnen, bearbeiten und anschliessend per FTP wieder in den `data/`-Ordner auf
dem Server hochladen.

### Variante 2: Browser-Editor `admin/`

`admin/` ist ein einfacher Editor, der vollstaendig im Browser laeuft.

Ablauf:

1. `/admin` oeffnen (lokal ueber den dev-Server oder live auf dem Server)
2. Datensatz waehlen: **Sammlung** oder **Veranstaltungen**
3. Daten laden:
   - „Vom Server laden" - liest die aktuelle `collection.json` bzw.
     `events.json` ueber `fetch`
   - „Datei hochladen" - liest eine lokale JSON-Datei (z. B. fuer Offline-Nutzung
     via `file://`)
4. Eintraege ueber das Formular hinzufuegen, bearbeiten oder loeschen
5. Auf **JSON herunterladen** klicken - es wird `collection.json` bzw.
   `events.json` als Download erzeugt
6. Die heruntergeladene Datei per FTP nach `data/` auf dem Server hochladen,
   um die Live-Seite zu aktualisieren

> Hinweis: Der Editor schreibt nichts direkt auf den Server. Er hilft nur beim
> komfortablen Erzeugen einer neuen `.json`-Datei. Wenn `/admin` oeffentlich
> liegen soll, empfiehlt sich ein Schutz per `.htaccess` (Basic Auth). Alternativ
> mit `INCLUDE_ADMIN=0` vom Deploy ausschliessen und nur lokal verwenden.

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
- `status` (`published` oder `draft`)

### Veranstaltungen (`data/events.json`)

Pflichtfelder pro Eintrag:

- `id`
- `date`
- `title`
- `location`
- `description`

Optional:

- `link`

## Performance-Hinweise

- Bilder in sinnvollen Zielgroessen ablegen
- Moderne Formate bevorzugen (WebP/AVIF), wenn verfuegbar
- Audio/Video mit `preload="metadata"` (so im Renderer eingestellt)
- Nur notwendige Skripte beibehalten

## Hinweis zu JavaScript

Da Inhalte client-seitig aus JSON geladen werden, benoetigt die Seite aktives
JavaScript, um Sammlung und Mitmach-Termine anzuzeigen. Header, Footer, Navigation und
Projekt-Texte funktionieren auch ohne JavaScript.
