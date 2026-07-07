# Contentpflege — Kurzübersicht

Welche Inhalte ihr selbst pflegen könnt und wo sie liegen.

---

## Übersicht

| Inhalt | Selbst pflegen? | Wo bearbeiten |
|--------|-----------------|---------------|
| Sammlung (Bilder, Audio, Video) | Ja | `data/collection.json` + Dateien in `assets/` |
| Veranstaltungen / Termine | Ja | `data/events.json` |
| Öffnungszeiten | Ja | `data/open.json` |
| Team (Alter, Texte, Fotos) | Aktuell **HTML** | `ueber/index.html` + `assets/images/team/` |
| Video-Poster | Automatisch (erster Frame) | optional `media.poster` in `collection.json` |

---

## Wie ihr Dateien ändert

1. **Filestash** im Browser öffnen (FTP-Zugang zum Server).
2. Die passende Datei bearbeiten oder hochladen.
3. Seite im Browser neu laden (ggf. Hard-Reload).

Ausführliche Anleitung zu Medienformaten und Sammlung: [Medien-Anleitung-Irrlichter.md](Medien-Anleitung-Irrlichter.md).

---

## Wichtig: Production-Deploy

Beim automatischen Deploy (Push auf `main`) werden **`data/`** und **`assets/`** auf dem Live-Server **nicht** überschrieben.

- Änderungen an JSON oder Medien **immer direkt auf dem Server** (Filestash) vornehmen — oder lokal testen und die Dateien manuell hochladen.
- Code-Änderungen (HTML, CSS, JS) kommen per Git-Deploy.

---

## Veranstaltungen (`data/events.json`)

- Ein-Tages-Termine: Feld `date` (`YYYY-MM-DD`).
- Mehrtägige Termine: zusätzlich `endDate` (letzter Tag). Der Termin bleibt in „Anstehend“, bis der letzte Tag vorbei ist.
- Optional: `dateLabel` für die Anzeige (z. B. `"3.–5. Juli"`).

---

## Team (`ueber/index.html`)

Texte, Alter und Links stehen direkt im HTML der Über-Seite.

Team-Fotos liegen unter `assets/images/team/` (z. B. `Charlett_Wenig.jpg`, `TAAT.jpg`). Fehlt eine Datei, zeigt die Seite Initialen als Platzhalter — nach dem Upload erscheint das Foto automatisch.

Eine JSON-Datei für das Team gibt es derzeit **nicht**; eine spätere Auslagerung wäre ein größerer Umbau.
