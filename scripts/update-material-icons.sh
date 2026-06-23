#!/usr/bin/env bash
# Download Material Symbols Sharp (variable WOFF2) into font/MaterialSymbolsSharp.woff2.
# Icons use rlig ligatures — do not subset with --glyphs/--liga only (breaks rendering).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/font/MaterialSymbolsSharp.woff2"

curl -sL -o "$OUT" "https://unpkg.com/material-symbols@latest/material-symbols-sharp.woff2"
ls -lh "$OUT"
