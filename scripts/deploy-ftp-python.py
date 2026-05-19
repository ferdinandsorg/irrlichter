#!/usr/bin/env python3
"""Mirror project root to FTP/FTPS (fallback when lftp is unavailable)."""

from __future__ import annotations

import os
import sys
from ftplib import FTP_TLS, error_perm
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {".git", ".github", ".cursor", ".vscode", "scripts", "node_modules"}
SKIP_FILES = {".DS_Store", ".env", ".env.example", "README.md"}
SKIP_GLOBS = (".git",)


def env(name: str, default: str = "") -> str:
    value = os.environ.get(name, default).strip()
    if not value:
        print(f"Error: {name} must be set.", file=sys.stderr)
        sys.exit(1)
    return value


def should_skip(rel: Path, include_admin: bool) -> bool:
    parts = rel.parts
    if parts and parts[0] in SKIP_DIRS:
        return True
    if rel.name in SKIP_FILES:
        return True
    if rel.name.startswith(".git"):
        return True
    if not include_admin and rel.name in {"admin.html"}:
        return True
    if not include_admin and rel.as_posix() == "js/admin.js":
        return True
    return False


def ensure_remote_dir(ftp: FTP_TLS, path: str) -> None:
    if not path or path == "/":
        return
    parts = [p for p in path.split("/") if p]
    current = ""
    for part in parts:
        current = f"{current}/{part}" if current else part
        try:
            ftp.mkd(current)
        except error_perm as exc:
            if not str(exc).startswith("550"):
                raise


def upload_tree(ftp: FTP_TLS, local_root: Path, remote_root: str, include_admin: bool) -> None:
    remote_root = remote_root.rstrip("/")
    for path in sorted(local_root.rglob("*")):
        rel = path.relative_to(local_root)
        if should_skip(rel, include_admin):
            continue
        remote = f"{remote_root}/{rel.as_posix()}".replace("//", "/")
        if path.is_dir():
            try:
                ftp.mkd(remote)
            except error_perm as exc:
                if not str(exc).startswith("550"):
                    raise
            continue
        parent = "/".join(remote.split("/")[:-1])
        if parent:
            ensure_remote_dir(ftp, parent)
        with path.open("rb") as handle:
            print(f"PUT {rel.as_posix()}")
            ftp.storbinary(f"STOR {remote}", handle)


def main() -> None:
    host = env("FTP_HOST")
    user = env("FTP_USER")
    password = env("FTP_PASSWORD")
    remote_dir = os.environ.get("FTP_REMOTE_DIR", "beta").strip()
    include_admin = os.environ.get("INCLUDE_ADMIN", "0") == "1"

    ftp = FTP_TLS()
    ftp.connect(host, 21, timeout=120)
    ftp.login(user, password)
    ftp.prot_p()

    ensure_remote_dir(ftp, remote_dir.strip("/"))
    upload_tree(ftp, ROOT, remote_dir, include_admin)
    ftp.quit()
    print(f"Deploy completed to {remote_dir}")


if __name__ == "__main__":
    main()
