# Project context (handoff)

Durable product/tech decisions. **Line numbers:** [CODE-MAP.md](CODE-MAP.md).

## Site structure & URLs

| Public URL | File | Notes |
|------------|------|--------|
| `/` | `index.html` | Home, collection, irrlicht |
| `/veranstaltungen` | `veranstaltungen/index.html` | Intro + `events.js` |
| `/ueber` | `ueber/index.html` | Story, team, Anfahrt, Kontakt, funding |
| `/impressum`, `/datenschutz` | respective folders | Legal |
| `/admin` | `admin/index.html` | JSON editor (optional on FTP) |

**Redirects** (`.htaccess`): `mitmachen` → `veranstaltungen`, `das-projekt` → `ueber`.

**Staging:** `http://irrlichter.net/beta/` — root is `/beta`.

## Data loading

- Files: `data/events.json`, `data/collection.json`, `data/open.json`
- API: `irrDataUrl("events.json")` in `js/site-base.js` (L84–88)
- Consumers resolve URL **at fetch time** (`events.js` L4–10, `collection.js` L4–10, `site-status.js` L4–10)
- **Wrong:** `/beta/veranstaltungen/data/events.json` → **Right:** `/beta/data/events.json`

## Typography (`css/style.css`)

| Token / class | ~Lines | Notes |
|---------------|--------|--------|
| `--type-size-meta` | 130 | 14px body-small |
| `.type-body-small` | 1830 | Subheads, team labels |
| Über `h2` | 2045 | No border; bottom margin halved |
| `p em` emphasis | 2069, 2070 | Semibold italic (Über + Veranstaltungen intro) |

## UI button (`.ui-button`, ~L1923–2015)

| Modifier | Use |
|----------|-----|
| (default) | White 44px bar, `--ui-button-fg` |
| `--ghost` | No pad/bg |
| `--icon-leading` / `--icon-trailing` | Material icon visible |

**Rule:** On white UI, never `--ambient-fg` for button text (scroll turns it white).

### Über instances

| Location | Variant | Extra |
|----------|---------|--------|
| Kontakt | Default + `mail` | `mailto:info@irrlichter.net` |
| Moorbauer panel | Ghost + `north_east` | Link wraps card, `target="_blank"` |
| Funding | Default + `north_east` | `https://www.avbstiftung.de/` |
| Anfahrt | Default + `content_copy` | `data-copy-text` → `main.js` L488+ |

## Über page sections

| Section | HTML / CSS | Notes |
|---------|------------|--------|
| Story lead | `ueber-story-irrlicht`, main.js ~374 | Hover irrlicht |
| Moorbauer CTA | CSS ~2390, `moorbauer-cta.jpg`, ratio 1600/1066 | Panel text `#040403` fixed |
| Team | CSS ~2580, `team-member.js` | Title „Das Team“; labels `type-body-small`; no borders; hover+open ~L2715–2723 |
| Anfahrt | `#anfahrt` | Route text + copy address button |
| Kontakt / Funding | end of `ueber/index.html` | See buttons above |

**Opening hours** (with `<em>`) only on **Veranstaltungen** (`.veranstaltungen-intro`), not Anfahrt.

## Scroll / ambient

- `main.js`: `--scroll-shift`, `data-text-mode` on `<html>`
- Body text: `--ambient-fg` / muted
- Exceptions: white panels, buttons, Moorbauer panel — fixed palette colors

## Assets

| Path | Note |
|------|------|
| `assets/images/moorbauer-cta.jpg` | Live CTA image |
| `files/AvB_Logo.svg` | Funding logo in HTML |
| `assets/images/team/` | Photos referenced; may be `.gitkeep` only |

## Workflow

- German UI copy in HTML
- No commit unless asked; small focused diffs
