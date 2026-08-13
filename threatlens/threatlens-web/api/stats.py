"""GET /api/stats - read the anonymous visitor totals (Vercel KV counter)."""
from http.server import BaseHTTPRequestHandler
from _lib import _kv, kv_scard, respond

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            total = int(_kv("get", "threatlens:total") or 0)
            unique = kv_scard("threatlens:visitors")
            respond(self, {"ok": True, "total": total, "unique": unique}, 200)
        except Exception as e:
            respond(self, {"ok": False, "error": str(e)}, 503)
