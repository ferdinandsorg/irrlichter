#!/usr/bin/env python3
"""List, clean wrong beta paths on FTP, then deploy to beta/."""

from __future__ import annotations

import os
import sys
from ftplib import FTP_TLS, error_perm
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {".git", ".github", ".cursor", ".vscode", "scripts", "node_modules"}
SKIP_FILES = {".DS_Store", ".env", ".env.example", "README.md"}


def env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        print(f"Error: {name} must be set.", file=sys.stderr)
        sys.exit(1)
    return value


def connect() -> FTP_TLS:
    ftp = FTP_TLS()
    ftp.connect(env("FTP_HOST"), 21, timeout=120)
    ftp.login(env("FTP_USER"), env("FTP_PASSWORD"))
    ftp.prot_p()
    return ftp


def should_skip(rel: Path) -> bool:
    if rel.parts and rel.parts[0] in SKIP_DIRS:
        return True
    if rel.name in SKIP_FILES:
        return True
    if rel.name.startswith(".git"):
        return True
    return False


def ensure_remote_dir(ftp: FTP_TLS, path: str) -> None:
    if not path or path in (".", "/"):
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


def upload_tree(ftp: FTP_TLS, local_root: Path, remote_root: str) -> None:
    remote_root = remote_root.strip("/")
    for path in sorted(local_root.rglob("*")):
        rel = path.relative_to(local_root)
        if should_skip(rel):
            continue
        remote = f"{remote_root}/{rel.as_posix()}".replace("//", "/") if remote_root else rel.as_posix()
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


def delete_tree(ftp: FTP_TLS, path: str) -> None:
    try:
        ftp.cwd(path)
    except error_perm as exc:
        print(f"SKIP {path}: {exc}")
        return

    entries: list[str] = []
    try:
        ftp.retrlines("LIST", entries.append)
    except error_perm:
        pass

    for line in entries:
        parts = line.split(maxsplit=8)
        if len(parts) < 9:
            continue
        name = parts[-1]
        if name in (".", ".."):
            continue
        is_dir = line.startswith("d")
        if is_dir:
            delete_tree(ftp, name)
        else:
            try:
                ftp.delete(name)
                print(f"DEL {path}/{name}")
            except error_perm as exc:
                print(f"DEL failed {path}/{name}: {exc}")

    ftp.cwd("..")
    base = path.split("/")[-1]
    try:
        ftp.rmd(base)
        print(f"RMD {path}")
    except error_perm as exc:
        print(f"RMD failed {path}: {exc}")


def main() -> None:
    ftp = connect()
    print(f"PWD: {ftp.pwd()!r}")
    top = ftp.nlst()
    print(f"Top-level: {top}")

    for wrong in ("public_html",):
        if wrong in top:
            print(f"--- Removing nested {wrong}/ ---")
            delete_tree(ftp, wrong)

    ftp.cwd("/")
    print(f"PWD after cleanup: {ftp.pwd()!r}")

    remote_dir = os.environ.get("FTP_REMOTE_DIR", "beta").strip().strip("/")
    ensure_remote_dir(ftp, remote_dir)
    upload_tree(ftp, ROOT, remote_dir)
    ftp.quit()
    print(f"Done. Site files are in: {remote_dir}/")


if __name__ == "__main__":
    main()
