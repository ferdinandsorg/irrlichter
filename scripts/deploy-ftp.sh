#!/usr/bin/env bash
set -euo pipefail

# Lightweight FTP deploy script for the static Irrlichter site.
# Uploads the project root directly (no build step needed).
# Requires: lftp
#
# Extensionless URLs: .htaccess (Apache mod_rewrite) is uploaded with the site.
# For nginx or other stacks, configure an equivalent rewrite (see .htaccess comments).
#
# Environment variables:
# FTP_HOST       required (example: ftp.example.org)
# FTP_USER       required
# FTP_PASSWORD   required
# FTP_REMOTE_DIR optional (default: /public_html)
# SOURCE_DIR     optional (default: project root, the parent of this script)
# INCLUDE_ADMIN  optional (default: 1; set to 0 to skip admin.html / js/admin.js)

FTP_REMOTE_DIR="${FTP_REMOTE_DIR:-/public_html}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="${SOURCE_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
INCLUDE_ADMIN="${INCLUDE_ADMIN:-1}"

if ! command -v lftp >/dev/null 2>&1; then
  echo "Error: lftp is required but not installed."
  echo "Install on macOS: brew install lftp"
  exit 1
fi

if [[ -z "${FTP_HOST:-}" || -z "${FTP_USER:-}" || -z "${FTP_PASSWORD:-}" ]]; then
  echo "Error: FTP_HOST, FTP_USER, and FTP_PASSWORD must be set."
  exit 1
fi

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Source directory '$SOURCE_DIR' not found."
  exit 1
fi

# Excludes for `mirror -R`. Anything project-internal that should not land on
# the live server goes here.
EXCLUDES=(
  --exclude-glob ".git/"
  --exclude-glob ".git*"
  --exclude-glob ".github/"
  --exclude-glob ".DS_Store"
  --exclude-glob "scripts/"
  --exclude-glob "README.md"
  --exclude-glob "node_modules/"
  --exclude-glob ".cursor/"
  --exclude-glob ".vscode/"
)

if [[ "$INCLUDE_ADMIN" != "1" ]]; then
  EXCLUDES+=(--exclude-glob "admin.html")
  EXCLUDES+=(--exclude-glob "js/admin.js")
  echo "Note: admin.html and js/admin.js are excluded from this deploy."
fi

echo "Deploying '$SOURCE_DIR/' to '$FTP_HOST:$FTP_REMOTE_DIR'..."

lftp -u "$FTP_USER","$FTP_PASSWORD" "$FTP_HOST" <<EOF
set ssl:verify-certificate no
set ftp:ssl-force true
set ftp:ssl-protect-data true
set ftp:list-options -a
mirror -R --delete --verbose ${EXCLUDES[@]} "$SOURCE_DIR"/ "$FTP_REMOTE_DIR"/
bye
EOF

echo "Deploy completed."
