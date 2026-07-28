"""Shared logic for the Vercel serverless functions (stdlib only, no deps).
The leading underscore keeps Vercel from routing this file; it stays importable
by the sibling function files. Mirrors feed_fetch.py so local and Vercel match.
Visitor counter uses Vercel KV / Upstash Redis REST (env KV_REST_API_URL +
KV_REST_API_TOKEN). No IPs, no cookies - only an anonymous browser-made id."""
import datetime, html, json, os, random, re, urllib.parse, urllib.request

_UA = {"User-Agent": "ThreatLens-Research/1.0 (+https://github.com/Monstervm100/vayun)"}
OPENPHISH = "https://openphish.com/feed.txt"
URLHAUS = "https://urlhaus.abuse.ch/downloads/text_recent/"

def _http_get(url, timeout=15):
    req = urllib.request.Request(url, headers=_UA)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", "replace")

def _domain(url):
    s = url.split("://", 1)[-1]
    return s.split("/", 1)[0].split("?", 1)[0].lower()

def _classify(url):
    u = url.lower()
    if "login" in u or "signin" in u or "sign-in" in u or "account" in u: return "Fake Login Page"
    if "verify" in u or "secure" in u or "confirm" in u or "password" in u: return "Credential Theft"
    if "pay" in u or "invoice" in u or "refund" in u or "wallet" in u: return "Financial Scam"
    return "Credential Theft"

def _urls_from_feed():
    for src in (OPENPHISH, URLHAUS):
        try:
            urls = [ln.strip() for ln in _http_get(src).splitlines() if ln.strip().startswith("http")]
            if urls: return urls, ("openphish" if src == OPENPHISH else "urlhaus")
        except Exception: continue
    raise RuntimeError("no phishing feed reachable")

def fetch_samples(count=8):
    urls, source = _urls_from_feed()
    random.shuffle(urls)
    today = datetime.date.today().isoformat()
    samples, seen = [], set()
    for u in urls:
        d = _domain(u)
        if d in seen: continue
        seen.add(d)
        samples.append({"source": source, "collected_at": today, "sender": "unknown@" + d,
            "subject": "Reported phishing URL", "body": "Phishing URL reported by %s: %s" % (source, u),
            "url": u, "domain_age_days": None, "spf_fail": True, "label": _classify(u)})
        if len(samples) >= count: break
    return samples, source

NEWS_FEEDS = [("The Hacker News", "https://feeds.feedburner.com/TheHackersNews"),
              ("BleepingComputer", "https://www.bleepingcomputer.com/feed/")]
_NEWS_KW = re.compile(r"phish|scam|credential|social engineer|fraud|deepfake|smishing|\bQR\b|\bAI\b|impersonat|business email", re.I)

def _rss_field(block, tag):
    m = re.search(r"<%s>(.*?)</%s>" % (tag, tag), block, re.S | re.I)
    if not m: return ""
    val = m.group(1).strip()
    cd = re.match(r"<!\[CDATA\[(.*?)\]\]>$", val, re.S)
    if cd: val = cd.group(1).strip()
    return html.unescape(val)

def fetch_news(count=8):
    items = []
    for source, url in NEWS_FEEDS:
        try:
            xml = _http_get(url, timeout=15)
            for m in re.finditer(r"<item>(.*?)</item>", xml, re.S | re.I):
                b = m.group(1); t = _rss_field(b, "title")
                if t: items.append({"title": t, "link": _rss_field(b, "link"),
                                    "source": source, "published": _rss_field(b, "pubDate")})
        except Exception: continue
    if not items: raise RuntimeError("no news feed reachable")
    rel = [it for it in items if _NEWS_KW.search(it["title"])]
    return (rel or items)[:count]

def _kv(*parts):
    base = os.environ.get("KV_REST_API_URL"); token = os.environ.get("KV_REST_API_TOKEN")
    if not base or not token: raise RuntimeError("KV not configured")
    url = base.rstrip("/") + "/" + "/".join(urllib.parse.quote(str(p), safe="") for p in parts)
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + token})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read().decode()).get("result")

def kv_incr(key): return int(_kv("incr", key))
def kv_scard(key):
    try: return int(_kv("scard", key) or 0)
    except Exception: return 0
def kv_add_visitor(key, member):
    if member: _kv("sadd", key, member)
    return kv_scard(key)

def respond(handler, obj, code=200):
    payload = json.dumps(obj).encode("utf-8")
    handler.send_response(code)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Content-Length", str(len(payload)))
    handler.end_headers()
    handler.wfile.write(payload)
