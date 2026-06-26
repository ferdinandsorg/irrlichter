#!/usr/bin/env bash
# Baut files/icons.svg aus Google Material Symbols Sharp SVGs (24px).
# FILL 1 (fill1) = Standard wie .material-symbols-sharp in style.css.
# FILL 0 (default) nur wo explizit outline — siehe .irr-icon--outline in CSS.
# Danach: js/site-icons.js SPRITE-String ggf. aus icons.svg übernehmen.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PARTS="$ROOT/files/icons/_parts"
OUT="$ROOT/files/icons.svg"
ICONS="expand_more arrow_forward south north north_east content_copy search menu text_increase play_arrow pause close mail"
OUTLINE_ICONS="expand_more arrow_forward south north north_east content_copy search menu text_increase close mail"

mkdir -p "$PARTS"
for icon in $ICONS; do
  curl -sL \
    "https://fonts.gstatic.com/s/i/short-term/release/materialsymbolssharp/${icon}/fill1/24px.svg" \
    -o "$PARTS/${icon}.svg"
done
for icon in $OUTLINE_ICONS; do
  curl -sL \
    "https://fonts.gstatic.com/s/i/short-term/release/materialsymbolssharp/${icon}/default/24px.svg" \
    -o "$PARTS/${icon}__outline.svg"
done

python3 - "$PARTS" "$OUT" <<'PY'
import re, sys, os
parts_dir, out_path = sys.argv[1], sys.argv[2]
symbols = []
for name in sorted(os.listdir(parts_dir)):
    if not name.endswith(".svg"):
        continue
    icon_id = name[:-4].replace("__outline", "_outline")
    text = open(os.path.join(parts_dir, name)).read()
    m = re.search(r'viewBox="([^"]+)"', text)
    m2 = re.search(r'<path d="([^"]+)"', text)
    if m and m2:
        symbols.append((icon_id, m.group(1), m2.group(1)))
lines = ['<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">']
for icon_id, vb, d in symbols:
    lines.append(
        f'  <symbol id="{icon_id}" viewBox="{vb}">'
        f'<path fill="currentColor" d="{d}"/></symbol>'
    )
lines.append("</svg>")
open(out_path, "w").write("\n".join(lines) + "\n")
print(f"Wrote {out_path} ({len(symbols)} icons)")
PY

python3 - "$OUT" "$ROOT/js/site-icons.js" <<'SYNC'
import re, sys
icons_path, js_path = sys.argv[1], sys.argv[2]
icons = open(icons_path).read()
parts = re.findall(r'<symbol[^>]*>.*?</symbol>', re.sub(r'\s+', ' ', icons))
lines = ['  var SPRITE =']
lines.append('    \'<svg xmlns="http://www.w3.org/2000/svg" hidden aria-hidden="true" focusable="false" id="irr-icon-sprite">\' +')
for p in parts:
    lines.append("    '" + p.replace("'", "\\'") + "' +")
lines.append('    "</svg>";')
sprite_block = "\n".join(lines)
js = open(js_path).read()
js_new = re.sub(r'  var SPRITE =[\s\S]*?";', sprite_block, js, count=1)
open(js_path, 'w').write(js_new)
print(f"Synced {js_path}")
SYNC
