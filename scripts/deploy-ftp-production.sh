#!/usr/bin/env bash
set -euo pipefail

# Deploy the static site to document root (https://irrlichter.net/).
# Loads FTP_* from .env in the project root when present.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi

export FTP_REMOTE_DIR="${FTP_REMOTE_DIR:-.}"

exec bash "$SCRIPT_DIR/deploy-ftp.sh"
