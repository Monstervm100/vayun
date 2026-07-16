/* Cybersecurity Education helper.
   Turns an analysis result into plain-language answers to the four questions at
   the heart of ThreatLens: Why malicious? Which indicators? What techniques?
   How to recognize similar attacks? (SRD Themes 4 & 6, DASH-FR-05). */
TL.education = (function () {
  return {
    explain(res) {
      const p = res.prediction, f = res.features;

      // 1. Why was it malicious (or safe)?
      let why;
      if (p.is_phishing) {
        const top = res.explanation.slice(0, 2).map(x => x.factor.toLowerCase()).join(" and ");
        why = `Classified as ${p.label} with ${Math.round(p.confidence * 100)}% confidence. ` +
          `The verdict is driven mainly by ${top || "multiple risk factors"}. ` +
          `Each contributing factor and its weight is shown in the explanation panel (SHAP-style — ` +
          `SHapley Additive exPlanations, which attributes the decision across features).`;
      } else {
        why = `Classified as Not phishing (${Math.round(p.confidence * 100)}% confidence). ` +
          `It lacks the suspicious-URL, urgency, credential-request and payment-fraud signals typical of phishing.`;
      }

      // 2. Which indicators triggered detection?
      const ind = [];
      if (f.feed_listed) ind.push("Listed on a threat-intelligence feed (OpenPhish / URLhaus) — reported as active phishing.");
      if (f.suspicious_pattern) ind.push("Suspicious URL pattern — look-alike domain, risky TLD, or a login/verify path.");
      if (f.spf_fail) ind.push("SPF (Sender Policy Framework) check failed — the sender is not authorized to send for that domain.");
      if (f.domain_age_days != null && f.domain_age_days < 30) ind.push(`Newly registered domain (~${f.domain_age_days} days old) — common for throwaway phishing sites.`);
      if (f.cred_request) ind.push("Asks for credentials — password, sign-in, or 'verify your account'.");
      if (f.payment_request) ind.push("Requests a payment, wire transfer, or gift cards.");
      if (f.urgency_score > 0) ind.push("Time-pressure / urgency language ('within 24 hours', 'act now').");
      if (f.bec_cue) ind.push("Executive impersonation or secrecy cues ('CEO', 'discreet', 'reply asap').");
      if (!ind.length) ind.push("No strong malicious indicators triggered.");

      // 3. What attacker techniques were used?
      const tech = [];
      const present = Object.keys(res.manipulation.present).filter(k => res.manipulation.present[k]);
      if (present.length) tech.push("Psychological manipulation: " + present.join(", ") + ".");
      if (p.is_phishing && p.category) tech.push("Attack type (taxonomy): " + p.category + ".");
      if (f.payment_request || f.bec_cue) tech.push("Business Email Compromise — impersonating a trusted party to trigger a payment.");
      if (f.suspicious_pattern) tech.push("Malicious link / fake page to harvest data.");
      if (!tech.length) tech.push("No recognizable attacker techniques.");

      // 4. How can humans recognize similar attacks?
      const tips = [];
      if (f.suspicious_pattern || (res.iocs.urls && res.iocs.urls.length)) tips.push("Hover over links before clicking — check the real domain, not the display text.");
      if (f.cred_request) tips.push("Legitimate providers never ask you to confirm a password by email — go to the site directly.");
      if (f.urgency_score > 0 || f.fear_tactic) tips.push("Treat urgency and threats ('account suspended', '24 hours') as a red flag to slow down.");
      if (f.payment_request || f.bec_cue) tips.push("Verify any payment or wire-transfer request via a known phone number — never by replying.");
      if (f.spf_fail || f.authority_impersonation) tips.push("Check the sender's real address and domain; mismatches or odd domains are suspicious.");
      if (!tips.length) tips.push("Stay cautious — verify unexpected requests through a separate, trusted channel.");

      return { why, indicators: ind, techniques: tech, recognize: tips.slice(0, 4) };
    }
  };
})();
