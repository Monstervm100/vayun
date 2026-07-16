/* Feature Extraction Pipeline (FE-FR-01..06).
   Converts a raw sample into a documented feature vector across three groups:
   email, URL, behavioral. Missing fields are recorded, never thrown (FE-FR-05). */
TL.featureExtraction = (function () {
  const URL_RE = /\bhttps?:\/\/[^\s"'<>]+/gi;
  const URGENCY = /\b(urgent|immediately|within 24 hours|24 hours|act now|asap|expires?|suspend(ed|ing)?|limited time|time sensitive|right away)\b/i;
  const FEAR = /(suspend|lock(ed)?|unauthoriz|penalt|terminat|breach|fail|deactivat|locked out)/i;
  const AUTHORITY = /(it[-\s]?support|administrator|microsoft|bank|security team|ceo|help ?desk|account team|official)/i;
  const CURIOSITY = /\b(you have won|congratulations|click to (see|view)|exclusive|shared (a )?document)\b/i;
  const REWARD = /\b(reward|prize|gift|bonus|refund|won|claim)\b/i;
  const CRED = /\b(password|verify your|verify it|sign ?in|log ?in|credential|confirm your account|verify (your )?credential)\b/i;
  const FIN = /\b(invoice|payment|wire transfer|bank|refund|transaction|billing)\b/i;
  // Business Email Compromise / payment-fraud cues (behavioral, no URL needed)
  const FRAUD = /(wire transfer|bank transfer|gift ?cards?|process (a|the) payment|payroll|update.*bank(ing)? details|overdue invoice|invoice attached|payment (is )?(overdue|pending|failed))/i;
  const BEC_CUES = /(discreet|are you available|reply asap|keep this confidential|strictly confidential|between us|urgent request)/i;
  const EXEC = /\b(ceo|cfo|coo|president|director|executive)\b/i;

  function hostOf(url) {
    try { return new URL(url).host.toLowerCase(); }
    catch (e) { return String(url || "").replace(/^https?:\/\//i, "").split(/[\/?#]/)[0].toLowerCase(); }
  }
  // Free-hosting / dynamic platforms frequently abused for phishing pages.
  const FREE_HOST = /(pages\.dev|replit\.app|edgeone\.dev|workers\.dev|web\.app|glitch\.me|weebly\.com|blogspot\.|000webhost|firebaseapp\.com|netlify\.app|vercel\.app|r2\.dev|github\.io|surge\.sh)/i;

  function suspiciousUrl(url) {
    if (!url) return false;
    const host = hostOf(url);
    if (/\b\d{1,3}(\.\d{1,3}){3}\b/.test(host)) return true;              // raw IP
    if ((host.match(/-/g) || []).length >= 2) return true;                // many hyphens
    if (/(verify|login|secure|account|claim|pay|confirm|update|signin|sign-in|wallet)/i.test(url)) return true;
    if (/\.(co|info|xyz|top|zip|cyou|icu|rest|sbs|click|link|live|shop|bn)(\/|:|$)/i.test(host)) return true; // risky TLDs
    if (FREE_HOST.test(host)) return true;                                // abused free hosts
    if (host.split(".").length >= 4) return true;                         // deep subdomain nesting
    if (/[a-z0-9]{16,}/i.test(host)) return true;                         // long random token
    if ((host.match(/\d/g) || []).length >= 6) return true;              // digit-heavy host
    return false;
  }
  function scoreMatches(text, res) {
    let n = 0; res.forEach(re => { if (re.test(text)) n++; });
    return TL.util.clamp(n / res.length, 0, 1);
  }

  return {
    /** extract(sample) -> feature vector (FE-FR-04) */
    extract(sample) {
      sample = sample || {};
      const sender = sample.sender || "";
      const subject = sample.subject || "";
      const body = sample.body || "";
      const text = (subject + " " + body).trim();
      const urlField = sample.url || "";
      const urlsInBody = (body.match(URL_RE) || []);
      const url = urlField || urlsInBody[0] || "";
      const senderDomain = sender.includes("@") ? sender.split("@")[1].toLowerCase() : null;

      return {
        // email features (FE-FR-01)
        sender_domain: senderDomain,                       // null if missing (FE-FR-05)
        keyword_score: scoreMatches(text, [CRED, FIN]),
        language_pattern: text.length ? TL.util.clamp(text.length / 400, 0, 1) : 0,
        grammar_score: text ? 0.5 : null,
        cred_request: CRED.test(text),
        // URL features (FE-FR-02)
        has_url: !!url,
        url: url || null,
        url_length: url ? url.length : 0,
        suspicious_pattern: suspiciousUrl(url),
        domain_age_days: (sample.domain_age_days != null) ? sample.domain_age_days
                         : (suspiciousUrl(url) ? 3 : null),
        spf_fail: !!sample.spf_fail,
        // Threat-intelligence reputation: was this reported by a phishing feed?
        feed_listed: /openphish|urlhaus|feed|simulated/i.test(sample.source || ""),
        // behavioral features (FE-FR-03)
        urgency_score: text ? (URGENCY.test(text) ? 0.9 : 0) : 0,
        authority_impersonation: AUTHORITY.test(sender + " " + text),
        fear_tactic: FEAR.test(text),
        curiosity: CURIOSITY.test(text),
        reward: REWARD.test(text),
        // BEC / payment-fraud behavioral signals (FE-FR-03)
        payment_request: FRAUD.test(text),
        bec_cue: BEC_CUES.test(text) || EXEC.test(sender)
      };
    },
    /** feature_docs() -> documented groups (FE-FR-06) */
    featureDocs() {
      return {
        email: ["sender_domain", "keyword_score", "language_pattern", "grammar_score", "cred_request"],
        url: ["has_url", "url_length", "suspicious_pattern", "domain_age_days", "spf_fail"],
        behavioral: ["urgency_score", "authority_impersonation", "fear_tactic", "curiosity", "reward"]
      };
    }
  };
})();
