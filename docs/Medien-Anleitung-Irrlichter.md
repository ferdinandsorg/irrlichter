# Medien für die Irrlichter-Website vorbereiten

Kurzanleitung: Dateien vorbereiten, hochladen und in der Sammlung verknüpfen.

**Übersicht JSON vs. HTML:** [Contentpflege-Kurz.md](Contentpflege-Kurz.md)

---

## So funktioniert es in zwei Schritten

1. **Datei vorbereiten** (Größe, Format — siehe unten)
2. **Auf den Server legen** und **in `data/collection.json` eintragen**

Die Website lädt Medien aus dem Ordner `assets/` auf dem Server. Texte, Pfade und Metadaten (inkl. Alt-Text) stehen in **`data/collection.json`** — bearbeitbar über **Filestash** im Browser (FTP-Zugang).

**Wichtig:** In der JSON trägst du den **Pfad** zur Datei ein (z. B. `assets/images/mein-bild.jpg`). Die Mediendatei selbst legst du im passenden `assets/`-Ordner auf dem Server ab — ebenfalls über Filestash.

---

## Ordner auf dem Server

| Ordner | Inhalt |
|--------|--------|
| `assets/images/` | Fotos für die Sammlung |
| `assets/video/` | Videos für die Sammlung |
| `assets/audio/` | Tonaufnahmen für die Sammlung |
| `assets/images/team/` | Team-Fotos (Seite „Über“) |
| `data/` | `collection.json` (Sammlung), `events.json` (Veranstaltungen) |

---

## Bilder (Sammlung)

**Wo sichtbar:** Karte in der Sammlung (ca. **438 px** breit), per Klick in **Vollbild** (Lightbox, bis ca. Bildschirmgröße).

### Empfohlene Einstellungen

| | Empfehlung |
|---|------------|
| **Format** | **JPG** (Fotos) oder **PNG** (Grafiken mit Transparenz) |
| **Breite** | **1.600–2.000 px** (reicht für Vollbild auf allen Geräten) |
| **Höhe** | beliebig (Hoch- und Querformat ok) |
| **Dateigröße** | **unter 500 KB** ideal, **max. 2 MB** |
| **Qualität beim Export** | ca. **80 %** (JPG) |

### Dateiname

- Kleinbuchstaben, keine Leerzeichen
- Gut: `260513_grounding_notiz.jpg`
- Schlecht: `IMG_4829 Kopie.MOV`, `Foto 1.jpg`

---

## Videos (Sammlung)

**Wo sichtbar:** Vorschaubild in der Karte, Wiedergabe per Klick in der **Vollbild-Lightbox**.

### Empfohlene Einstellungen

| | Empfehlung |
|---|------------|
| **Format** | **MP4** (H.264) — **nur dieses Format online verwenden** |
| **Auflösung** | **720p** (1280×720) reicht meist; max. **1080p** |
| **Länge** | Kurzclips: **unter 1 Minute** ideal |
| **Dateigröße** | **unter 8 MB** ideal, **max. 15 MB** pro Video |
| **Ton** | mit Ton ist ok |

### Nicht hochladen

- **`.mov` / `.MOV`** — nur als Arbeitskopie behalten, online **nicht** nutzen
- Unkomprimierte Rohdaten oder 4K-Exporte
- Dieselbe Datei als `.mov` **und** `.mp4` — nur **eine** MP4-Version online

### Optional: Vorschaubild (Poster)

Feld `media.poster` in `collection.json`, z. B. `assets/images/mein-video-poster.jpg`

- JPG, ca. **800 px** breit, unter **200 KB**
- Wenn leer, nimmt die Website automatisch das erste Bild aus dem Video

---

## Audio (Sammlung)

**Wo sichtbar:** Audioplayer in der Sammlungs-Karte (Play, Fortschrittsbalken).

### Empfohlene Einstellungen

| | Empfehlung |
|---|------------|
| **Format** | **MP3** oder **M4A** |
| **Qualität** | **128–192 kbps** |
| **Länge** | wie nötig; für kurze Feldaufnahmen oft **30 Sek. – 3 Min.** |
| **Dateigröße** | **unter 3 MB** ideal, **max. 5 MB** |

**Nicht empfohlen:** unkomprimiertes **WAV** (wird sehr groß).

---

## Team-Fotos (Seite „Über“)

Kleine **quadratische** Porträts (ca. **72×72 px** Anzeige).

| | Empfehlung |
|---|------------|
| **Format** | JPG |
| **Größe** | **400×400 px** (quadratisch) |
| **Dateigröße** | **unter 100 KB** |
| **Ordner** | `assets/images/team/` |
| **Dateiname** | z. B. `vorname-nachname.jpg` |

Diese Fotos werden **nicht** über die Sammlung eingetragen, sondern direkt auf der Über-Seite verknüpft (technische Pflege durch die Projektleitung).

---

## Dateien komprimieren (empfohlene Tools)

### Bilder

| Tool | Plattform | Hinweis |
|------|-----------|---------|
| [Squoosh](https://squoosh.app) | Browser | Breite **1920 px**, Qualität ca. **80 %**, als JPG speichern |
| [TinyPNG](https://tinypng.com) | Browser | Datei reinziehen, herunterladen |
| **ImageOptim** | Mac | kostenlos, Drag & Drop |
| **IrfanView** / **XnConvert** | Windows | kostenlos, „Speichern unter“ mit Qualität |

### Videos

| Tool | Plattform | Hinweis |
|------|-----------|---------|
| [HandBrake](https://handbrake.fr) | Mac & Windows | **Empfehlung** — Preset „Fast 720p30“ oder „Web“, Format **MP4** |
| **iMovie** / **Clipchamp** | Mac / Windows | Export „Mittel“, max. 720p |
| Online-Kompressoren | Browser | nur für unkritische Clips (Datenschutz beachten) |

**HandBrake kurz:** Format MP4, Auflösung max. **1280×720**, H.264 — keine `.mov` auf den Server legen.

### Audio

| Tool | Plattform | Hinweis |
|------|-----------|---------|
| **Audacity** | Mac & Windows | Export als **MP3**, **128–192 kbps** |
| [AudioMass](https://audiomass.co) | Browser | schneiden & exportieren |

**Minimal-Setup:** Squoosh (Bilder) + HandBrake (Video) + Audacity (Audio) — alles kostenlos.

---

## Checkliste vor dem Upload

- [ ] Richtiges Format? (JPG/PNG, **MP4**, MP3/M4A)
- [ ] Datei klein genug? (Bild < 2 MB, Video < 15 MB, Audio < 5 MB)
- [ ] Kein `.mov` auf den Server
- [ ] Sinnvoller Dateiname (klein, ohne Leerzeichen)
- [ ] Mediendatei in den richtigen `assets/`-Ordner gelegt (Filestash)
- [ ] Eintrag in `data/collection.json` angelegt oder aktualisiert (`media.src`, `media.alt`, …)

---

## Sammlung pflegen mit Filestash

Filestash ist ein Dateimanager im Browser — damit greifst du per FTP auf den Webserver zu, lädst Medien hoch und bearbeitest die JSON-Dateien direkt.

**Video-Tutorial:** [Daten in Filestash bearbeiten (Loom)](https://www.loom.com/share/133301f8ac8a42be9148f9de699afb72)

### Zugang

1. Filestash-URL öffnen (Zugangsdaten von der Projektleitung)
2. Mit **FTP-Benutzername** und **Passwort** anmelden
3. Zum Website-Ordner navigieren (z. B. `beta/` auf dem Testserver)

### Neue Mediendatei hochladen

1. In Filestash zu `assets/images/`, `assets/video/` oder `assets/audio/` wechseln
2. **Upload** — komprimierte Datei auswählen
3. Dateiname prüfen (klein, ohne Leerzeichen)

### Neuen Sammlungs-Eintrag in `collection.json`

1. In Filestash `data/collection.json` öffnen
2. **Bearbeiten** (Editor im Browser)
3. Neuen Eintrag im Array ergänzen — Orientierung am bestehenden Format:

```json
{
  "id": "eindeutige-id",
  "title": "Titel des Beitrags",
  "date": "2026-05-13",
  "type": "image",
  "tags": ["tag1", "tag2"],
  "summary": "Kurzbeschreibung für die Karte.",
  "media": {
    "src": "assets/images/260513_grounding_notiz.jpg",
    "alt": "Kurze Beschreibung des Bildes für Barrierefreiheit"
  },
  "location": "optional",
  "coordinates": "optional"
}
```

4. **Typen:** `image`, `video`, `audio` oder `text`
5. **Tags:** Kleinbuchstaben, mehrere möglich
6. Bei **Video** optional `"poster": "assets/images/poster.jpg"` unter `media` ergänzen
7. Bei **Text** kann `media.src` leer bleiben (`""`)
8. Speichern — Änderung ist nach kurzer Zeit auf der Website sichtbar

### Veranstaltungen

Termine liegen in **`data/events.json`** — gleiches Vorgehen über Filestash.

### Wichtig

- Vor größeren Änderungen: `collection.json` **herunterladen** (Backup)
- JSON-Syntax beachten: Kommas zwischen Einträgen, Anführungszeichen `"` — ein Fehler kann die ganze Datei unlesbar machen
- Bei Unsicherheit: Projektleitung fragen, bevor du speicherst

---

## Kurz: Was die Website technisch unterstützt

| Typ | Formate | Anzeige |
|-----|---------|---------|
| Bild | JPG, PNG | Karte + Vollbild-Lightbox |
| Video | **MP4** (auch MOV möglich, aber nicht empfohlen) | Vorschau + Vollbild-Lightbox |
| Audio | MP3, M4A, WAV | Player in der Karte |

---

## Faustregel

> **Lieber etwas kleiner und schnell ladend als maximal scharf und groß.**  
> Für die Sammlung reichen **2.000 px Breite** bei Bildern und **720p-MP4** bei Videos völlig aus.

Bei Unsicherheit: Datei schicken — wir prüfen Größe und Format vor dem Upload.

---

*Stand: Projekt Irrlichter — Sammlung max. Kartenbreite 438 px, Lightbox bis ca. 1.200 px Breite.*
