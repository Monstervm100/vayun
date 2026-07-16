/* Visit counter (privacy-respecting).

   The browser generates its own random, anonymous ID and stores it locally.
   We send only that ID so the server can tell "same person returning" from
   "new person". No IP addresses, no cookies, no personal data, no third-party
   tracker. Requires server.py; on static hosting the counter simply hides. */
TL.analytics = (function () {
  const VID_KEY = "threatlens_vid";

  function visitorId() {
    let id = null;
    try { id = localStorage.getItem(VID_KEY); } catch (e) { /* ignore */ }
    if (!id) {
      id = "v-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      try { localStorage.setItem(VID_KEY, id); } catch (e) { /* ignore */ }
    }
    return id;
  }

  return {
    visitorId,
    /** Record this page open. Returns {total, unique} or null if unavailable. */
    async recordVisit() {
      try {
        const res = await fetch("/api/hit?vid=" + encodeURIComponent(visitorId()), { cache: "no-store" });
        if (!res.ok) throw new Error("counter unavailable");
        const d = await res.json();
        if (!d.ok) throw new Error("counter error");
        return { total: d.total, unique: d.unique };
      } catch (e) {
        return null;   // static hosting (e.g. GitHub Pages) — no counter
      }
    }
  };
})();
