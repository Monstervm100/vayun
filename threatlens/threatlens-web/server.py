"""ThreatLens local server.

Serves the static app AND a /api/feed proxy endpoint that fetches genuine live
phishing URLs (OpenPhish / URLhaus) server-side — so the browser can pull real
threat data without hitting CORS restrictions.

Run:  python server.py       (then open http://localhost:8000)
Stdlib only.
"""
import json
import os
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

import feed_fetch

# Serve files from this script's directory regardless of the caller's cwd.
os.chdir(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get("PORT", "8000"))

# --- Privacy-respecting visit counter -------------------------------------
# Stores ONLY an aggregate count plus anonymous random visitor IDs that the
# browser generates itself. No IP addresses, no cookies, no personal data.
STATS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "stats.json")
_stats_lock = threading.Lock()
_MAX_VISITORS = 50000


def _load_stats():
    try:
        with open(STATS_PATH, "r", encoding="utf-8") as f:
            d = json.load(f)
    except Exception:
        d = {}
    d.setdefault("total", 0)
    d.setdefault("visitors", [])
    return d


def _save_stats(d):
    tmp = STATS_PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(d, f)
    os.replace(tmp, STATS_PATH)


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Never cache during development so edits are picked up on reload.
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/feed":
            return self._feed(parse_qs(parsed.query))
        if parsed.path == "/api/research":
            return self._research(parse_qs(parsed.query))
        if parsed.path == "/api/hit":
            return self._hit(parse_qs(parsed.query))
        if parsed.path == "/api/stats":
            return self._stats()
        return super().do_GET()

    def _hit(self, query):
        """Record one page open. `vid` is an anonymous ID made by the browser."""
        vid = (query.get("vid") or [""])[0][:64]
        with _stats_lock:
            d = _load_stats()
            d["total"] += 1
            if vid and vid not in d["visitors"] and len(d["visitors"]) < _MAX_VISITORS:
                d["visitors"].append(vid)
            _save_stats(d)
            payload = {"ok": True, "total": d["total"], "unique": len(d["visitors"])}
        self._send_json(payload, 200)

    def _stats(self):
        with _stats_lock:
            d = _load_stats()
        self._send_json({"ok": True, "total": d["total"], "unique": len(d["visitors"])}, 200)

    def _count(self, query, default=8, hi=50):
        try:
            return max(1, min(hi, int((query.get("count") or [str(default)])[0])))
        except ValueError:
            return default

    def _send_json(self, payload, code):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _feed(self, query):
        try:
            samples, source = feed_fetch.fetch_samples(self._count(query))
            self._send_json({"ok": True, "source": source, "count": len(samples), "samples": samples}, 200)
        except Exception as e:  # transient feed/network failure → client falls back
            self._send_json({"ok": False, "error": str(e)}, 502)

    def _research(self, query):
        try:
            items = feed_fetch.fetch_news(self._count(query, default=8, hi=20))
            self._send_json({"ok": True, "count": len(items), "items": items}, 200)
        except Exception as e:
            self._send_json({"ok": False, "error": str(e)}, 502)

    def log_message(self, *args):
        pass  # quiet


if __name__ == "__main__":
    print("ThreatLens running on http://localhost:%d  (live feed at /api/feed)" % PORT)
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
