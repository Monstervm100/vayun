/* Global namespace + configuration.
   Every file attaches to window.TL. Load order is defined in index.html. */
window.TL = window.TL || {};

TL.config = {
  // Threat Taxonomy Engine (TT-FR-01/02)
  TAXONOMY: {
    "Credential Theft": "Steals usernames/passwords via fake prompts or pages.",
    "Business Email Compromise": "Impersonates executives/vendors to trigger action.",
    "Malware Delivery": "Delivers malicious attachments or payloads.",
    "Fake Login Page": "Directs victims to a spoofed sign-in page.",
    "Financial Scam": "Fraudulent payment, invoice, or reward lures.",
    "AI Generated Phishing": "Content generated with generative AI tooling."
  },
  // Machine Learning Engine (ML-FR-04)
  MODELS: ["Logistic Regression", "Random Forest", "XGBoost", "Neural Network"],
  // Human Manipulation Analyzer (HM-FR-01)
  MANIPULATION: ["fear", "urgency", "authority", "curiosity", "reward"],
  // Upload validation (DASH-FR-02 / NFR-07)
  UPLOAD: { allowedExt: ["eml", "txt"], maxBytes: 20 * 1024 * 1024 }, // 20 MB
  // Threat feed refresh cadence (monthly)
  FEED_INTERVAL_DAYS: 30,
  STORAGE_KEY: "threatlens_db_v1"
};

/* Small shared helpers */
TL.util = {
  esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  },
  hash(str) { // deterministic string hash → stable sample IDs / dedupe keys
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return h.toString(36);
  },
  clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); },
  fmtDate(ts) { return ts ? new Date(ts).toISOString().slice(0, 10) : "—"; },
  fmtDateTime(ts) { return ts ? new Date(ts).toLocaleString() : "—"; },
  daysBetween(a, b) { return Math.round((b - a) / 86400000); },
  defang(u) { return String(u || "").replace(/^http/i, "hxxp").replace(/\./g, "[.]"); }
};
