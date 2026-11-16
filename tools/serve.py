"""Serve the deck on http://localhost:8000 with caching off, so a reload always shows the latest edit.
usage: python tools/serve.py [port]"""
import sys, pathlib, http.server

ROOT = pathlib.Path(__file__).resolve().parent.parent / 'deck'
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=str(ROOT), **k)
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store'); super().end_headers()
    def log_message(self, *a): pass

print('Deck on http://localhost:%d' % PORT, flush=True)
http.server.ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()
