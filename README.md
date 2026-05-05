# Irrlichter MVP

Leichtgewichtige, statische Website fuer das Moor-Kunst- und Umweltprojekt **Irrlichter**.

## Ziele

- MVP mit sehr kleinem Footprint
- Statische Ausgabe fuer einfachen FTP-Upload
- Minimal JavaScript (nur Filter auf der Startseite)
- Flat-File Contentpflege ueber JSON im Repo

## Stack

- Astro (`output: "static"`)
- Eigenes, minimales CSS (keine UI-Library Runtime)
- Lokale Assets in `public/assets/`

## Projektstruktur

- `src/pages/` - Seiten (`/`, `/info`, `/events`, plus `/de` und `/en`)
- `src/layouts/` - Basislayout und Navigation
- `src/components/` - Sammlung, Filter, Eventliste
- `src/data/collection.json` - Archiv/Logbuch-Items
- `src/data/events.json` - Eventdaten
- `public/assets/` - Medienassets

## Lokale Entwicklung

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Die statische Ausgabe liegt danach in `dist/`.

## Shell-Deploy per FTP

Es gibt ein kleines Deploy-Skript unter `scripts/deploy-ftp.sh`.

Voraussetzung:

- `lftp` installiert (macOS: `brew install lftp`)

Umgebungsvariablen setzen:

```bash
export FTP_HOST="ftp.dein-host.tld"
export FTP_USER="dein-user"
export FTP_PASSWORD="dein-passwort"
export FTP_REMOTE_DIR="/public_html"
```

Deploy ausfuehren:

```bash
npm run build
npm run deploy:ftp
```

Was das Skript macht:

1. Prueft, ob `lftp` verfuegbar ist
2. Prueft, ob `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD` gesetzt sind
3. Uploadet den **Inhalt** von `dist/` in den Zielordner auf dem Server
4. Loescht entfernte alte Dateien per `mirror -R --delete`, damit Server und `dist/` synchron bleiben

## FTP-Deployment

1. Lokal bauen: `npm run build`
2. FTP-Client oeffnen (z. B. FileZilla/Cyberduck)
3. Zielordner auf dem Server oeffnen (haeufig `public_html/` oder `www/`)
4. **Inhalt** von `dist/` hochladen (nicht den Ordner selbst verschachteln)
5. Vorhandene Dateien auf dem Server ersetzen
6. Seite im Browser pruefen (`/`, `/info`, `/events`, `/en`)

## Contentpflege

### Sammlung

Datei: `src/data/collection.json`

Pflichtfelder pro Eintrag:

- `id`
- `title_de`, `title_en`
- `date`
- `type` (`image`, `video`, `audio`, `text`)
- `tags`
- `summary_de`, `summary_en`
- `media.src`, `media.alt_de`, `media.alt_en`

Optionale Felder:

- `location`
- `coordinates`
- `status`

### Events

Datei: `src/data/events.json`

Empfohlene Felder:

- `id`, `date`
- `title_de`, `title_en`
- `location_de`, `location_en`
- `description_de`, `description_en`
- optional `link`

## Performance-Hinweise

- Bilder in sinnvollen Zielgroessen ablegen
- Moderne Formate bevorzugen (WebP/AVIF), wenn verfuegbar
- Audio/Video mit `preload="metadata"`
- Nur notwendige Skripte beibehalten
