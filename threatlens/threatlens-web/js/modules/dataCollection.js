/* Data Collection Module (DC-FR-01/02/03/04/07).
   Ingests raw samples, quarantines malformed input, de-duplicates, normalizes. */
TL.dataCollection = (function () {
  const SCHEMA = ["id", "source", "collected_at", "sender", "subject", "body", "url", "label"];

  /** A sample is malformed if it carries none of sender/subject/body (DC-FR-07). */
  function isMalformed(raw) {
    if (!raw || typeof raw !== "object") return true;
    const hasText = ["sender", "subject", "body"].some(
      k => typeof raw[k] === "string" && raw[k].trim().length > 0);
    return !hasText;
  }

  /** Normalize into the fixed schema (DC-FR-04) + compute dedupe key (DC-FR-03). */
  function normalize(raw) {
    const s = {
      source: raw.source || "manual",
      collected_at: raw.collected_at || new Date().toISOString().slice(0, 10),
      sender: (raw.sender || "").trim(),
      subject: (raw.subject || "").trim(),
      body: (raw.body || "").trim(),
      url: (raw.url || "").trim(),
      label: raw.label || null,
      domain_age_days: raw.domain_age_days != null ? raw.domain_age_days : null,
      spf_fail: !!raw.spf_fail
    };
    s._key = TL.util.hash(s.sender + "|" + s.subject + "|" + s.body);
    return s;
  }

  return {
    schema: SCHEMA,
    isMalformed,
    normalize,

    /** collect(rawList) -> {added, duplicates, quarantined} (DC-FR-01/03/04/07). */
    collect(rawList) {
      let added = 0, duplicates = 0, quarantined = 0;
      (rawList || []).forEach(raw => {
        if (isMalformed(raw)) { quarantined++; return; }
        const s = normalize(raw);
        if (TL.db.addSample(s)) added++; else duplicates++;
      });
      return { added, duplicates, quarantined };
    },

    /** getStats() -> KPI figures for the dashboard. */
    getStats() {
      const samples = TL.db.getSamples();
      const phishing = samples.filter(s => s.label && s.label !== "Legitimate");
      const cats = new Set(phishing.map(s => s.label));
      return {
        samples: samples.length,
        phishing: phishing.length,
        legitimate: samples.length - phishing.length,
        categories: cats.size,
        campaigns: TL.db.getCampaigns().length,
        features: 15
      };
    }
  };
})();
