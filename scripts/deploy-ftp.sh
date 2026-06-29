#!/usr/bin/env bash
set -euo pipefail

# Lightweight FTP deploy script for the static Irrlichter site.
# Uploads the project root directly (no build step needed).
# Requires: lftp
#
# Extensionless URLs: .htaccess, robots.txt, sitemap.xml are uploaded with the site.
# For nginx or other stacks, configure an equivalent rewrite (see .htaccess comments).
#
# Environment variables:
# FTP_HOST       required (example: ftp.example.org)
# FTP_USER       required
# FTP_PASSWORD   required
# FTP_REMOTE_DIR optional (default: . — Hetzner-FTP liegt oft schon in public_html)
# FTP_SKIP_CONTENT optional (1/true: assets/ und data/ nicht spiegeln — Production
#                     hat echte Inhalte auf dem Server; Repo enthält Mock-Daten)
# SOURCE_DIR     optional (default: project root, the parent of this script)

FTP_REMOTE_DIR="${FTP_REMOTE_DIR:-.}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="${SOURCE_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"

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
  --exclude-glob "files/icons/_parts/"
  --exclude-glob "font/MaterialSymbolsSharp.woff2"
)

case "${FTP_SKIP_CONTENT:-}" in
  1|true|yes|on)
    EXCLUDES+=(
      --exclude-glob "assets/"
      --exclude-glob "data/"
    )
    echo "Content dirs excluded from mirror: assets/, data/ (FTP_SKIP_CONTENT)."
    ;;
esac

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
