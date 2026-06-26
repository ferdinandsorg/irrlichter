#!/usr/bin/env bash
# Quick HTTP smoke test after deploy. Usage:
#   bash scripts/smoke-test-live.sh                    # production root
#   bash scripts/smoke-test-live.sh https://irrlichter.net/beta
set -euo pipefail

BASE="${1:-https://irrlichter.net}"
BASE="${BASE%/}"

check() {
  local url="$1"
  local expect="$2"
  local got
  got="$(curl -sL -o /dev/null -w "%{http_code}" "$url" || true)"
  if [[ "$got" == "$expect" ]]; then
    echo "OK  $expect  $url"
  else
    echo "FAIL expected $expect got $got  $url"
    return 1
  fi
}

fail=0
check "$BASE/" 200 || fail=1
check "$BASE/veranstaltungen" 200 || fail=1
check "$BASE/ueber" 200 || fail=1
check "$BASE/impressum" 200 || fail=1
check "$BASE/datenschutz" 200 || fail=1
check "$BASE/data/collection.json" 200 || fail=1
check "$BASE/data/events.json" 200 || fail=1

optional_check() {
  local url="$1"
  local got
  got="$(curl -sL -o /dev/null -w "%{http_code}" "$url" || true)"
  if [[ "$got" == "200" ]]; then
    echo "OK  200  $url"
  else
    echo "WARN $got  $url (optional — nach Deploy mit files/)"
  fi
}

optional_check "$BASE/files/favicon.png"
optional_check "$BASE/files/irrlicht.webp"

# Legacy redirect (relative .htaccess)
loc="$(curl -sI "$BASE/mitmachen" | tr -d '\r' | awk -F': ' 'tolower($1)=="location"{print $2; exit}')"
if [[ "$loc" == *"veranstaltungen"* ]]; then
  echo "OK  redirect  $BASE/mitmachen → $loc"
else
  echo "FAIL redirect mitmachen (got: ${loc:-none})"
  fail=1
fi

exit "$fail"
