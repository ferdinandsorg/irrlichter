#!/usr/bin/env python3
"""
Lokaler Dev-Server — Kurz-URLs wie auf dem Live-Server (Ordner + Legacy-Redirects).

  python3 scripts/dev-server.py
  python3 scripts/dev-server.py 8080

Funktioniert wie python3 -m http.server, plus:
  /mitmachen  → mitmachen/index.html
  /mitmachen.html → Redirect nach /mitmachen
"""
from __future__ import annotations

import os
import sys
import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PAGES = ("mitmachen", "das-projekt", "impressum", "datenschutz", "admin")

LEGACY = {
    "events": "/mitmachen",
    "info": "/das-projekt",
    "anfahrt": "/das-projekt#kontakt-anfahrt",
}

HTML_REDIRECTS = {
    "index.html": "/",
    "mitmachen.html": "/mitmachen",
    "das-projekt.html": "/das-projekt",
    "impressum.html": "/impressum",
    "datenschutz.html": "/datenschutz",
    "admin.html": "/admin",
}


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

    def log_message(self, format, *args):
        sys.stderr.write("[dev] %s - %s\n" % (self.address_string(), format % args))


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    server = ThreadingHTTPServer(("", port), IrrlichterHandler)
    print("Irrlichter dev server: http://127.0.0.1:%d/" % port)
    print("Kurz-URLs: /mitmachen, /das-projekt, … (Ordnerstruktur)")
    print("Ctrl+C zum Beenden.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nBeendet.")
        server.server_close()


if __name__ == "__main__":
    main()
