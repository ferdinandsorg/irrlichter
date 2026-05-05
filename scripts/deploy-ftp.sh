#!/usr/bin/env bash
set -euo pipefail

# Lightweight FTP deploy script for static dist uploads.
# Requires: lftp
#
# Environment variables:
# FTP_HOST      required (example: ftp.example.org)
# FTP_USER      required
# FTP_PASSWORD  required
# FTP_REMOTE_DIR optional (default: /public_html)
# BUILD_DIR      optional (default: dist)

FTP_REMOTE_DIR="${FTP_REMOTE_DIR:-/public_html}"
BUILD_DIR="${BUILD_DIR:-dist}"

if ! command -v lftp >/dev/null 2>&1; then
  echo "Error: lftp is required but not installed."
  echo "Install on macOS: brew install lftp"
  exit 1
fi

if [[ -z "${FTP_HOST:-}" || -z "${FTP_USER:-}" || -z "${FTP_PASSWORD:-}" ]]; then
  echo "Error: FTP_HOST, FTP_USER, and FTP_PASSWORD must be set."
  exit 1
fi

if [[ ! -d "$BUILD_DIR" ]]; then
  echo "Build directory '$BUILD_DIR' not found."
  echo "Run: npm run build"
  exit 1
fi

echo "Deploying '$BUILD_DIR/' to '$FTP_HOST:$FTP_REMOTE_DIR'..."

lftp -u "$FTP_USER","$FTP_PASSWORD" "$FTP_HOST" <<EOF
set ssl:verify-certificate no
set ftp:list-options -a
mirror -R --delete --verbose "$BUILD_DIR"/ "$FTP_REMOTE_DIR"/
bye
EOF

echo "Deploy completed."
