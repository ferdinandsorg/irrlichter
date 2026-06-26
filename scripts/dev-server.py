#!/usr/bin/env python3
"""
Lokaler Dev-Server — Kurz-URLs wie auf dem Live-Server (Ordner + Legacy-Redirects).

  python3 scripts/dev-server.py
  python3 scripts/dev-server.py 8080

Hoert auf allen Interfaces (0.0.0.0) — im gleichen WLAN auch vom Handy/Tablet erreichbar.
Funktioniert wie python3 -m http.server, plus:
  /veranstaltungen  → veranstaltungen/index.html
  /mitmachen        → Redirect nach /veranstaltungen
"""
from __future__ import annotations

import os
import shutil
import socket
import sys
import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PAGES = ("veranstaltungen", "ueber", "impressum", "datenschutz")

LEGACY = {
    "events": "/veranstaltungen",
    "info": "/ueber",
    "anfahrt": "/ueber#anfahrt",
    "mitmachen": "/veranstaltungen",
    "das-projekt": "/ueber",
}

HTML_REDIRECTS = {
    "index.html": "/",
    "mitmachen.html": "/veranstaltungen",
    "das-projekt.html": "/ueber",
    "impressum.html": "/impressum",
    "datenschutz.html": "/datenschutz",
}


class ReuseThreadingHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = True


class IrrlichterHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = urllib.parse.unquote(parsed.path)
        query = parsed.query
        qs = ("?" + query) if query else ""

        base = os.path.basename(path.rstrip("/"))
        if base in HTML_REDIRECTS:
            self._redirect(HTML_REDIRECTS[base] + qs)
            return

        slug = path.strip("/")
        if slug in LEGACY:
            self._redirect(LEGACY[slug] + qs)
            return

        if slug in PAGES and not path.endswith("/"):
            index_path = os.path.join(ROOT, slug, "index.html")
            if os.path.isfile(index_path):
                self.path = "/" + slug + "/" + qs
                return SimpleHTTPRequestHandler.do_GET(self)

        return SimpleHTTPRequestHandler.do_GET(self)

    def _redirect(self, location: str) -> None:
        self.send_response(301)
        self.send_header("Location", location)
        self.end_headers()

    def copyfile(self, source, outputfile):
        try:
            shutil.copyfileobj(source, outputfile)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def log_message(self, format, *args):
        sys.stderr.write("[dev] %s - %s\n" % (self.address_string(), format % args))


def _lan_ipv4_addresses() -> list[str]:
    """Nicht-loopback IPv4-Adressen fuer URLs im lokalen Netzwerk."""
    found: list[str] = []
    seen: set[str] = set()

    def add(ip: str) -> None:
        if not ip or ip.startswith("127.") or ip in seen:
            return
        seen.add(ip)
        found.append(ip)

    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("8.8.8.8", 80))
            add(sock.getsockname()[0])
    except OSError:
        pass

    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            add(info[4][0])
    except OSError:
        pass

    return found


def _print_startup_urls(port: int) -> None:
    local = "http://127.0.0.1:%d/" % port
    print("Irrlichter dev server")
    print("  Lokal:    %s" % local)
    lan_ips = _lan_ipv4_addresses()
    if lan_ips:
        print("  Netzwerk: (gleiches WLAN — Handy/Tablet)")
        for ip in lan_ips:
            print("            http://%s:%d/" % (ip, port))
    else:
        print(
            "  Netzwerk: keine LAN-IP ermittelt "
            "(gleiches WLAN? macOS: ipconfig getifaddr en0)"
        )
    print("Kurz-URLs: /veranstaltungen, /ueber, … (Ordnerstruktur)")
    print("Legacy: /mitmachen → /veranstaltungen, /das-projekt → /ueber")


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    try:
        server = ReuseThreadingHTTPServer(("", port), IrrlichterHandler)
    except OSError as exc:
        if exc.errno == 48:
            sys.exit(
                "Port %d ist belegt — alter Prozess noch aktiv?\n"
                "  lsof -i :%d   dann kill <PID>\n"
                "  oder: python3 scripts/dev-server.py <anderer-port>"
                % (port, port)
            )
        raise
    _print_startup_urls(port)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        server.server_close()


if __name__ == "__main__":
    main()
