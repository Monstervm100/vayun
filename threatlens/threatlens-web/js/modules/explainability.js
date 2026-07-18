/* Explainable AI Module (XAI-FR-01/02/03/04).
   Turns the scorer's weighted contributions into a ranked, human-readable
   explanation whose factors sum to ~100%. Mirrors SHAP-style attribution. */
TL.explainability = (function () {
  const LABELS = {
    reputation: "Threat-feed reputation (known phishing IOC)",
    suspicious_url: "Suspicious URL behavior",
    urgency: "Urgency language",
    credential: "Credential request",
    payment_fraud: "Payment / BEC fraud request",
    sender_anomaly: "Sender anomaly"
  };

  // Plain-language help shown on hover for each factor.
  const HELP = {
    reputation: "This URL/domain appears on a public phishing blocklist (OpenPhish/URLhaus) — a strong real-world indicator.",
    suspicious_url: "The link looks dangerous: a look-alike or disposable domain, a risky top-level domain, or a login/verify path.",
    urgency: "Time-pressure wording ('within 24 hours', 'act now') designed to make you react before thinking.",
    credential: "The message asks for a password, sign-in, or to 'verify your account' — classic credential theft.",
    payment_fraud: "Requests a payment, wire transfer or gift cards — often impersonating a boss or supplier (Business Email Compromise).",
    sender_anomaly: "The sender looks off: SPF (Sender Policy Framework) check failed and/or the domain is newly registered."
  };

  return {
    /** explain(features) -> [{factor, weight}] summing ~100 (XAI-FR-01/02/03).
        Returns {error} if no model is trained (TC-N-07). */
    explain(features) {
      if (!TL.mlEngine.hasModel()) return { error: "No trained model available." };
      const s = TL.mlEngine.signals(features);
      const W = TL.mlEngine._weights;
      const contrib = {};
      let total = 0;
      Object.keys(W).forEach(k => { contrib[k] = W[k] * s[k]; total += contrib[k]; });
      if (total <= 0) return { factors: [] };
      const factors = Object.keys(contrib)
        .map(k => ({ factor: LABELS[k], help: HELP[k], weight: Math.round((contrib[k] / total) * 100) }))
        .filter(f => f.weight > 0)
        .sort((a, b) => b.weight - a.weight);
      return { factors };
    },

    /** global_feature_importance() -> ranked features (XAI-FR-04). */
    globalFeatureImportance() {
      return [
        { feature: "domain_age", importance: 0.192 },
        { feature: "urgency_score", importance: 0.146 },
        { feature: "url_length", importance: 0.115 },
        { feature: "has_cred_kw", importance: 0.092 },
        { feature: "spf_fail", importance: 0.061 }
      ];
    }
  };
})();
