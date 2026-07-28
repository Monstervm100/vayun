"""GET /api/hit?vid=... - record one anonymous page open (Vercel KV counter)."""
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from _lib import kv_incr, kv_add_visitor, respond

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        q = parse_qs(urlparse(self.path).query)
        vid = (q.get("vid") or [""])[0][:64]
        try:
            total = kv_incr("threatlens:total")
            unique = kv_add_visitor("threatlens:visitors", vid)
            respond(self, {"ok": True, "total": total, "unique": unique}, 200)
        except Exception as e:
            respond(self, {"ok": False, "error": str(e)}, 503)
