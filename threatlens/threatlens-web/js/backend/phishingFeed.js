/* Phishing Feed — the monthly "pull latest scams" back-end job (DC-FR-01/06).

   Three-tier data sourcing, in priority order:
     1. LIVE  — GET /api/feed (server.py proxy fetches OpenPhish/URLhaus live).
     2. SNAPSHOT — TL.feedSnapshot from js/data/feed_latest.js (committed monthly
        by the GitHub Action) for the static, no-server demo.
     3. SIMULATED — locally generated realistic samples (offline / file:// use).

   pullLatest() is async because tier 1 performs a network fetch. */
TL.phishingFeed = (function () {
  const DOMAINS = ["account-secure-verify.co", "mail-update-center.info", "billing-refund-portal.com",
    "signin-alert-support.net", "delivery-track-notice.co", "secure-pay-confirm.xyz"];
  const SUBJECTS = [
    ["Your account will be locked in 24 hours", "Verify your password now to keep your account active.", "Credential Theft"],
    ["Payment failed - update your billing", "Update your billing details immediately to avoid a penalty.", "Financial Scam"],
    ["Unusual sign-in detected", "Confirm your login credentials to secure your account.", "Fake Login Page"],
    ["You have a pending refund", "Claim your refund now before it expires. Limited time.", "Financial Scam"],
    ["Package delivery on hold", "Confirm your details to release your delivery. Act now.", "Credential Theft"],
    ["Shared file: statement.zip", "A document has been shared with you. Download the attachment.", "Malware Delivery"]
  ];

  function generate(count) {
    const today = new Date().toISOString().slice(0, 10);
    const out = [];
    for (let i = 0; i < count; i++) {
      const d = DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
      const s = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
      const tag = Math.random().toString(36).slice(2, 6);
      out.push({
        source: "simulated", collected_at: today, sender: "alerts@" + d,
        subject: s[0], body: s[1] + " Ref: " + tag,
        url: "http://" + d + "/verify?id=" + tag,
        domain_age_days: 2 + Math.floor(Math.random() * 10), spf_fail: true, label: s[2]
      });
    }
    return out;
  }

  async function fetchLive(count) {
    const res = await fetch("/api/feed?count=" + count, { cache: "no-store" });
    if (!res.ok) throw new Error("proxy " + res.status);
    const data = await res.json();
    if (!data.ok || !data.samples || !data.samples.length) throw new Error(data.error || "empty feed");
    return { samples: data.samples, source: (data.source || "live") + " (live)" };
  }

  function fromSnapshot(count) {
    const snap = window.TL.feedSnapshot;
    if (snap && snap.samples && snap.samples.length) {
      return { samples: snap.samples.slice(0, count), source: "snapshot " + (snap.generated_at || "") };
    }
    return null;
  }

  return {
    /** pullLatest(count) — ingest fresh phishing samples; returns
        {added, duplicates, quarantined, source}. */
    async pullLatest(count) {
      count = count || (5 + Math.floor(Math.random() * 4));
      let batch, source;
      try {
        const live = await fetchLive(count);
        batch = live.samples; source = live.source;
      } catch (e) {
        const snap = fromSnapshot(count);
        if (snap) { batch = snap.samples; source = snap.source; }
        else { batch = generate(count); source = "simulated"; }
      }
      // Ensure every sample has a taxonomy label before storing.
      batch.forEach(s => { if (!s.label) s.label = TL.taxonomy.classify(s); });
      const result = TL.dataCollection.collect(batch);
      // Record a dated pull event so the Scams view can show a history timeline.
      const meta = TL.db.getMeta();
      const history = (meta.feedHistory || []).slice();
      history.push({ date: new Date().toISOString().slice(0, 10), added: result.added, source });
      TL.db.setMeta({ lastFeedPull: Date.now(), lastFeedSource: source, feedHistory: history.slice(-90) });
      TL.api.recomputeCampaigns();
      result.source = source;
      return result;
    },

    isDue() {
      const last = TL.db.getMeta().lastFeedPull;
      if (!last) return true;
      return TL.util.daysBetween(last, Date.now()) >= TL.config.FEED_INTERVAL_DAYS;
    },
    nextDue() {
      const last = TL.db.getMeta().lastFeedPull;
      return last ? last + TL.config.FEED_INTERVAL_DAYS * 86400000 : null;
    }
  };
})();
