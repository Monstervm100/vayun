/* Threat Taxonomy Engine (TT-FR-01/03/05).
   Structured classification + keyword-based category assignment. */
TL.taxonomy = (function () {
  return {
    getTaxonomy() { return Object.assign({}, TL.config.TAXONOMY); },      // TT-FR-05

    /** classify(sample) -> category label (TT-FR-03). Assumes phishing input. */
    classify(sample) {
      const t = ((sample.subject || "") + " " + (sample.body || "")).toLowerCase();
      const url = (sample.url || "").toLowerCase();
      if (/wire transfer|are you available|process a payment|discreet/.test(t)) return "Business Email Compromise";
      if (/\.zip|attachment|download the|\.exe|document has been shared/.test(t + url)) return "Malware Delivery";
      if (/password|verify|credential|confirm your account/.test(t)) return "Credential Theft";
      if (/invoice|payment|refund|prize|reward|won|claim/.test(t)) return "Financial Scam";
      if (/sign ?in|login|log ?in|unusual sign/.test(t + url)) return "Fake Login Page";
      return "Credential Theft";
    },

    /** get_distribution() -> {category: percent} across current phishing samples. */
    getDistribution(samples) {
      const counts = {};
      samples.filter(s => s.label && s.label !== "Legitimate").forEach(s => {
        counts[s.label] = (counts[s.label] || 0) + 1;
      });
      const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
      const out = {};
      Object.keys(counts).sort((a, b) => counts[b] - counts[a]).forEach(k => {
        out[k] = Math.round((counts[k] / total) * 100);
      });
      return out;
    }
  };
})();
