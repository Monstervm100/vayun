"""GET /api/research - latest phishing/scam security headlines (serverless)."""
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from _lib import fetch_news, respond

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        q = parse_qs(urlparse(self.path).query)
        try: count = max(1, min(20, int((q.get("count") or ["8"])[0])))
        except ValueError: count = 8
        try:
            items = fetch_news(count)
            respond(self, {"ok": True, "count": len(items), "items": items}, 200)
        except Exception as e:
            respond(self, {"ok": False, "error": str(e)}, 502)
