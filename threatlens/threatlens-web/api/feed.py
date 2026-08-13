"""GET /api/feed - live phishing URLs from OpenPhish/URLhaus (serverless)."""
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from _lib import fetch_samples, respond

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        q = parse_qs(urlparse(self.path).query)
        try: count = max(1, min(50, int((q.get("count") or ["8"])[0])))
        except ValueError: count = 8
        try:
            samples, source = fetch_samples(count)
            respond(self, {"ok": True, "source": source, "count": len(samples), "samples": samples}, 200)
        except Exception as e:
            respond(self, {"ok": False, "error": str(e)}, 502)
