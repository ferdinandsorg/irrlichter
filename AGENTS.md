# Irrlichter — Agent Guide

Static Moor art/environment site: vanilla HTML/CSS/JS, no build step, FTP deploy.

## Read first

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | Local dev, FTP deploy, URL structure |
| [docs/PROJECT-CONTEXT.md](docs/PROJECT-CONTEXT.md) | Product/UI decisions (Über, buttons, typo, team) |
| [docs/CODE-MAP.md](docs/CODE-MAP.md) | **Line numbers** for CSS/JS blocks (re-grep after big edits) |
| [.cursor/rules/](.cursor/rules/) | Short conventions (auto-loaded by Cursor) |

## Stack

- **Pages:** `index.html`, `veranstaltungen/`, `ueber/`, `impressum/`, `datenschutz/`, optional `admin/`
- **Data:** `data/*.json` via `irrDataUrl("…")` from `js/site-base.js` (needs HTTP server)
- **Styles:** `css/style.css` — tokens in `:root`, `html { font-size: 18px }`
- **Script order:** `site-base.js` → then `main.js` → page scripts (`events.js`, etc.)

## Critical: JSON paths

```javascript
fetch(irrDataUrl("events.json")); // → /beta/data/events.json on staging
```

Never use page-relative `data/…` or root-only `/data/…` without `irrSiteUrl` / `irrDataUrl`.

See `js/site-base.js` (lines ~1–95) and [docs/CODE-MAP.md](docs/CODE-MAP.md).

## UI quick reference

| Topic | CSS lines (approx.) |
|-------|---------------------|
| `.ui-button` | `style.css` 1923–2015 |
| Über page shell | 1888–1917 |
| Moorbauer CTA | 2394–2478 |
| Team list | 2580–2723 |
| Veranstaltungen intro | 2815–2818 |

Buttons use `--ui-button-fg`, not `--ambient-fg`, on white backgrounds. Details: [docs/PROJECT-CONTEXT.md](docs/PROJECT-CONTEXT.md).

## Deploy & git

- Push `main` → GitHub Actions FTP to `http://irrlichter.net/beta/`
- Upload `.htaccess`, page folders, `css/`, `js/`, `data/`, `assets/`
- **Do not commit/push** unless the user asks

## When editing

- Minimal diffs; match existing patterns
- Typography: `--type-size-*` (rem), not ad-hoc px for text scale
- Test: `python3 scripts/dev-server.py` → `/veranstaltungen`, `/ueber`
