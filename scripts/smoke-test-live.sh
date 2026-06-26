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

code="$(curl -sL -o /dev/null -w "%{http_code}" "$BASE/diese-seite-gibt-es-nicht" || true)"
if [[ "$code" == "404" ]]; then
  echo "OK  404  $BASE/diese-seite-gibt-es-nicht"
else
  echo "FAIL expected 404 got $code  $BASE/diese-seite-gibt-es-nicht"
  fail=1
fi

optional_check "$BASE/favicon.ico"
optional_check "$BASE/files/favicon.png"
optional_check "$BASE/files/irrlicht.webp"

exit "$fail"
