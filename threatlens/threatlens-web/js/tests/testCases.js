/* Executable test cases — the 10 positive + 10 negative cases from the
   ThreatLens Test Case Document, each traceable to SRD requirement IDs.
   Every case returns {pass, detail}. Cases are non-mutating (TC-N-07 toggles
   the model flag but restores it), so the runner is idempotent. */
TL.testCases = (function () {
  const FE = TL.featureExtraction, TT = TL.taxonomy, TI = TL.threatIntel,
        HM = TL.humanManipulation, ML = TL.mlEngine, XAI = TL.explainability,
        DC = TL.dataCollection, API = TL.api, REP = TL.reporting;

  // --- fixtures ---
  const phish = { sender: "it-support@secure-mail-verify.co",
    subject: "Your account will be suspended within 24 hours",
    body: "Verify your password now. Sign in to confirm your account.",
    url: "http://sec-login.co/verify?id=1", domain_age_days: 3, spf_fail: true };
  const phish2 = { sender: "it-support@secure-mail-verify.co", subject: "Account locked",
    body: "Confirm your credentials immediately.", url: "http://sec-login.co/verify?id=2",
    domain_age_days: 3, spf_fail: true };
  const ham = { sender: "jklein@enron.com", subject: "Meeting notes",
    body: "Please find the notes from today's meeting. Thanks.", url: "", domain_age_days: 4200, spf_fail: false };
  const neutral = { sender: "colleague@company.com", subject: "Reminder: deadline tomorrow",
    body: "Reminder: the project deadline is tomorrow, please review.", url: "", domain_age_days: 3000, spf_fail: false };
  const noLinks = { sender: "friend@example.com", subject: "Lunch?", body: "Want to grab lunch tomorrow?", url: "" };

  const P = (pass, detail) => ({ pass: !!pass, detail });

  return [
    // ============ POSITIVE ============
    { id: "TC-P-01", type: "positive", reqs: "DC-FR-01/03/04", title: "Collect, de-duplicate & normalize",
      run() {
        const k1 = DC.normalize(phish)._key, k2 = DC.normalize(Object.assign({}, phish))._key;
        const malformed = DC.isMalformed("###garbage###") || DC.isMalformed({});
        const norm = DC.normalize(phish);
        const schema = norm.sender && norm.subject && norm.collected_at;
        return P(k1 === k2 && malformed && schema,
          "Identical samples share dedupe key; malformed input flagged; normalized to schema.");
      } },
    { id: "TC-P-02", type: "positive", reqs: "TT-FR-01/03", title: "Classify into taxonomy category",
      run() { const c = TT.classify(phish); return P(c === "Credential Theft" && TL.config.TAXONOMY[c], "Classified as " + c + " (valid taxonomy category)."); } },
    { id: "TC-P-03", type: "positive", reqs: "FE-FR-01", title: "Extract email features",
      run() { const f = FE.extract(phish); return P(f.sender_domain === "secure-mail-verify.co" && f.keyword_score > 0, "sender_domain + keyword_score extracted."); } },
    { id: "TC-P-04", type: "positive", reqs: "FE-FR-02/03", title: "Extract URL & behavioral features",
      run() { const f = FE.extract(phish); return P(f.has_url && f.suspicious_pattern && f.url_length > 0 && f.urgency_score > 0 && f.fear_tactic, "Suspicious URL + urgency + fear detected."); } },
    { id: "TC-P-05", type: "positive", reqs: "TI-FR-01/05", title: "Extract Indicators of Compromise",
      run() { const i = TI.extractIocs(phish); return P(i.domains.indexOf("secure-mail-verify.co") >= 0 && i.urls.length >= 1 && i.spf === "fail", "Domains, URL and SPF fail extracted."); } },
    { id: "TC-P-06", type: "positive", reqs: "TI-FR-04", title: "Correlate emails into a campaign",
      run() { const c = TI.correlateCampaigns([phish, phish2]); return P(c.length === 1 && c[0].sample_count === 2, "2 samples with shared domain grouped into 1 campaign."); } },
    { id: "TC-P-07", type: "positive", reqs: "HM-FR-01/03", title: "Detect manipulation techniques",
      run() { const m = HM.analyze(phish); return P(m.present.fear && m.present.urgency && m.present.authority && m.evidence.urgency, "fear + urgency + authority flagged with evidence."); } },
    { id: "TC-P-08", type: "positive", reqs: "ML-FR-01/03/04", title: "Train, evaluate & compare models",
      run() { ML.train(); const mc = ML.getModelComparison(); const best = mc.find(m => m.best); return P(mc.length === 4 && mc.every(m => m.accuracy > 0) && best.model === "XGBoost", "4 models compared; metrics reported; best = XGBoost."); } },
    { id: "TC-P-09", type: "positive", reqs: "XAI-FR-01/02/03", title: "Weighted, human-readable explanation",
      run() { ML.train(); const ex = XAI.explain(FE.extract(phish)); const sum = (ex.factors || []).reduce((a, b) => a + b.weight, 0); return P(ex.factors && ex.factors.length > 0 && Math.abs(sum - 100) <= 1, "Factors returned; weights sum to " + sum + "%."); } },
    { id: "TC-P-10", type: "positive", reqs: "DASH-FR-02/REP-FR-01", title: "End-to-end analysis + export",
      run() { ML.train(); const r = API.analyze(phish); const csv = REP.buildDatasetCsv(); return P(r.prediction.is_phishing && r.explanation.length > 0 && r.iocs.domains.length > 0 && csv.indexOf("id,source") === 0, "Verdict + explanation + IOCs produced; dataset exports as CSV."); } },

    // ============ NEGATIVE ============
    { id: "TC-N-01", type: "negative", reqs: "DC-FR-07", title: "Malformed sample is quarantined",
      run() { return P(DC.isMalformed("###") === true && DC.isMalformed(phish) === false, "Garbage flagged as malformed; valid sample passes."); } },
    { id: "TC-N-02", type: "negative", reqs: "DC-FR-03", title: "Duplicate creates no second record",
      run() { return P(DC.normalize(phish)._key === DC.normalize(Object.assign({}, phish))._key, "Re-ingested sample maps to the same dedupe key (rejected)."); } },
    { id: "TC-N-03", type: "negative", reqs: "FE-FR-05", title: "Missing fields handled gracefully",
      run() { let f; try { f = FE.extract({ subject: "hi" }); } catch (e) { return P(false, "threw: " + e.message); } return P(f && f.sender_domain === null && f.has_url === false, "Missing sender/body recorded as null/false, no exception."); } },
    { id: "TC-N-04", type: "negative", reqs: "ML-FR-02/TT-FR-03", title: "Legitimate email not misclassified",
      run() { ML.train(); const a = ML.predict(FE.extract(ham)); const b = ML.predict(FE.extract(neutral)); return P(a.is_phishing === false && b.is_phishing === false, "Ham + urgent-sounding-but-benign both predicted Not phishing."); } },
    { id: "TC-N-05", type: "negative", reqs: "TI-FR-01", title: "Email with no links → empty URL/IP set",
      run() { const i = TI.extractIocs(noLinks); return P(i.urls.length === 0 && i.ips.length === 0, "No URLs/IPs found; returned empty sets without error."); } },
    { id: "TC-N-06", type: "negative", reqs: "HM-FR-01", title: "Neutral email → no manipulation flags",
      run() { const m = HM.analyze(neutral); const any = Object.values(m.present).some(Boolean); return P(!any, "Zero manipulation techniques flagged (no false positives)."); } },
    { id: "TC-N-07", type: "negative", reqs: "XAI-FR-01/ML-FR-06", title: "No trained model → handled error",
      run() { ML._setTrained(false); const p = ML.predict(FE.extract(phish)); const ex = XAI.explain(FE.extract(phish)); ML.train(); return P(p.error && ex.error && ML.hasModel(), "Predict & explain return handled errors, no crash; model retrained."); } },
    { id: "TC-N-08", type: "negative", reqs: "DASH-FR-02/NFR-07", title: "Unsupported file type rejected",
      run() { const bad = API.validateUpload({ name: "malware.exe", size: 1000 }); const ok = API.validateUpload({ name: "sample.eml", size: 1000 }); return P(!bad.ok && /type/i.test(bad.error) && ok.ok, "'.exe' rejected with a clear message; '.eml' accepted."); } },
    { id: "TC-N-09", type: "negative", reqs: "NFR-07", title: "Oversized upload rejected",
      run() { const big = API.validateUpload({ name: "sample.eml", size: 50 * 1024 * 1024 }); return P(!big.ok && /large/i.test(big.error), "50 MB file rejected (limit 20 MB)."); } },
    { id: "TC-N-10", type: "negative", reqs: "DASH-FR-02/04", title: "Empty input is refused",
      run() { return P(DC.isMalformed({ sender: "", subject: "", body: "" }) === true, "Empty input detected as non-analyzable; analysis not attempted."); } }
  ];
})();
