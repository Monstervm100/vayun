"""Shared phishing-feed fetch logic.

Used by both server.py (the live /api/feed proxy) and scripts/fetch_feed.py
(the monthly GitHub Action). Fetches genuine phishing URLs from the OpenPhish
community feed and normalizes them into ThreatLens sample objects.

Stdlib only — no third-party dependencies, no API key required.
"""
import datetime
import html
import random
import re
import urllib.request

# OpenPhish community feed — a plain-text list of live phishing URLs.
OPENPHISH = "https://openphish.com/feed.txt"
# URLhaus (abuse.ch) recent URLs — used as a fallback source.
URLHAUS = "https://urlhaus.abuse.ch/downloads/text_recent/"

_UA = {"User-Agent": "ThreatLens-Research/1.0 (+https://github.com/threatlens)"}


def _http_get(url, timeout=15):
    req = urllib.request.Request(url, headers=_UA)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", "replace")


def _domain(url):
    s = url.split("://", 1)[-1]
    return s.split("/", 1)[0].split("?", 1)[0].lower()


def _classify(url):
    """Lightweight URL-based taxonomy guess (mirrors taxonomy.js)."""
    u = url.lower()
    if "login" in u or "signin" in u or "sign-in" in u or "account" in u:
        return "Fake Login Page"
    if "verify" in u or "secure" in u or "confirm" in u or "password" in u:
        return "Credential Theft"
    if "pay" in u or "invoice" in u or "refund" in u or "wallet" in u:
        return "Financial Scam"
    return "Credential Theft"


def _urls_from_feed():
    """Return a list of phishing URLs, trying OpenPhish then URLhaus."""
    for src in (OPENPHISH, URLHAUS):
        try:
            text = _http_get(src)
            urls = [ln.strip() for ln in text.splitlines()
                    if ln.strip().startswith("http")]
            if urls:
                return urls, ("openphish" if src == OPENPHISH else "urlhaus")
        except Exception:
            continue
    raise RuntimeError("no phishing feed reachable")


# Reputable public security-news feeds, scanned for the Research knowledge base.
# Only headlines + links are shown (they link back to the source), so no
# copyrighted article text is copied.
NEWS_FEEDS = [
    ("The Hacker News", "https://feeds.feedburner.com/TheHackersNews"),
    ("BleepingComputer", "https://www.bleepingcomputer.com/feed/"),
]
_NEWS_KW = re.compile(r"phish|scam|credential|social engineer|fraud|deepfake|smishing|\bQR\b|\bAI\b|impersonat|business email", re.I)


def _rss_field(block, tag):
    m = re.search(r"<%s>(.*?)</%s>" % (tag, tag), block, re.S | re.I)
    if not m:
        return ""
    val = m.group(1).strip()
    cd = re.match(r"<!\[CDATA\[(.*?)\]\]>$", val, re.S)
    if cd:
        val = cd.group(1).strip()
    return html.unescape(val)


def _parse_rss(xml, source):
    items = []
    for m in re.finditer(r"<item>(.*?)</item>", xml, re.S | re.I):
        block = m.group(1)
        title = _rss_field(block, "title")
        link = _rss_field(block, "link")
        pub = _rss_field(block, "pubDate")
        if title:
            items.append({"title": title, "link": link, "source": source, "published": pub})
    return items


def fetch_news(count=8):
    """Scan security-news feeds and return recent phishing-relevant headlines."""
    all_items = []
    for source, url in NEWS_FEEDS:
        try:
            all_items += _parse_rss(_http_get(url, timeout=15), source)
        except Exception:
            continue
    if not all_items:
        raise RuntimeError("no news feed reachable")
    relevant = [it for it in all_items if _NEWS_KW.search(it["title"])]
    return (relevant or all_items)[:count]


def fetch_samples(count=8):
    """Fetch `count` live phishing URLs and return normalized sample dicts."""
    urls, source = _urls_from_feed()
    random.shuffle(urls)
    today = datetime.date.today().isoformat()
    samples = []
    seen = set()
    for u in urls:
        d = _domain(u)
        if d in seen:
            continue
        seen.add(d)
        samples.append({
            "source": source,
            "collected_at": today,
            "sender": "unknown@" + d,
            "subject": "Reported phishing URL",
            "body": "Phishing URL reported by %s: %s" % (source, u),
            "url": u,
            "domain_age_days": None,
            "spf_fail": True,
            "label": _classify(u),
        })
        if len(samples) >= count:
            break
    return samples, source
