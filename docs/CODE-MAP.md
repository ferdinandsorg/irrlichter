# Code map (line numbers)

Reference for agents. **Re-verify with editor search** after large edits — line numbers drift.

## JavaScript

| File | Lines (approx.) | What |
|------|-----------------|------|
| `js/site-base.js` | 1–12, 84–88 | File header; `irrSiteUrl`, `irrDataUrl`, `IRR_SITE_ROOT` |
| `js/main.js` | 1–50 | Scroll ambient, `data-text-mode` |
| `js/main.js` | 332–411 | Irrlicht fade + Über story lead hover |
| `js/main.js` | 413–459 | Full-page irrlicht (home + über + veranstaltungen) |
| `js/main.js` | 488–552 | `data-copy-text` clipboard buttons |
| `js/main.js` | 554–566 | `DOMContentLoaded` init order |
| `js/events.js` | 1–10 | `irrDataUrl("events.json")` |
| `js/collection.js` | 1–10 | `irrDataUrl("collection.json")` |
| `js/site-status.js` | 1–40 | `irrDataUrl("open.json")` |
| `js/site-weather.js` | 1–120 | Open-Meteo live weather (Malchin) |
| `js/team-member.js` | all | `.team-member__details` animation |
| `js/event-calendar-details.js` | all | `.event-calendar__details` animation (after `events.js` render) |
| `js/ueber-stack.js` | all | `.ueber-pillars-stack` scroll scale |

### Script load order (every page with data)

1. `site-base.js`
2. `main.js` (most pages)
3. Page modules: `events.js` / `event-calendar-details.js` / `collection.js` / `site-status.js` / `logo-card.js` / `ueber-stack.js` / `team-member.js`

## CSS (`css/style.css`)

| Lines (approx.) | Block |
|-----------------|--------|
| 117–148 | Type tokens (`--type-size-*`, rem) |
| 307–312 | `.section a:not(.ui-button)` — link color exclusion |
| 1226–1316 | Irrlicht lights (fixed overlay) |
| 1801–1843 | `.type-body`, `.type-body-large`, `.type-body-small` |
| 1888–1917 | Über page layout + link overrides |
| **1923–2015** | **`.ui-button` component** (marker ~L1919; default, ghost, icons) |
| 2017–2023 | Über contact + Anfahrt button spacing |
| 2049–2082 | Über section h2 + `p em` emphasis |
| 2085–2145 | Story lead + `.ueber-story-irrlicht` |
| 2276–2378 | Pillar stack cards |
| 2382–2474 | Moorbauer CTA (panel fixed colors) |
| 2477–2574 | Funding card |
| **2580–2727** | **Team** (no borders; hover/open ~2715–2723) |
| 2794–2815 | Veranstaltungen page + intro |
| 3431+ | `.event-calendar` |

## HTML entry points

| File | Key sections |
|------|----------------|
| `ueber/index.html` | story lead ~158, pillars stack, moorbauer CTA ~290, team ~328, anfahrt ~616, kontakt, funding |
| `veranstaltungen/index.html` | `.veranstaltungen-intro` then `[data-event-calendar]` |

## Data files

| File | Consumer |
|------|----------|
| `data/events.json` | `events.js` |
| `data/collection.json` | `collection.js` |
| `data/open.json` | `site-status.js` |
