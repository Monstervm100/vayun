/* API facade — the "back end" service layer the UI and tests call.
   Orchestrates the analysis modules; the views never touch modules directly. */
TL.api = (function () {
  return {
    /** Full analysis of one sample (DASH-FR-02 pipeline). */
    analyze(sample) {
      const features = TL.featureExtraction.extract(sample);
      const pred = TL.mlEngine.predict(features);
      if (pred.error) return { error: pred.error, features };
      const category = pred.is_phishing ? TL.taxonomy.classify(sample) : null;
      const explanation = TL.explainability.explain(features);
      const iocs = TL.threatIntel.extractIocs(sample);
      const manipulation = TL.humanManipulation.analyze(sample);
      const campaign = TL.threatIntel.campaignFor(sample, TL.db.getCampaigns());
      return {
        features,
        prediction: {
          is_phishing: pred.is_phishing,
          label: pred.is_phishing ? ("Phishing — " + category) : "Not phishing",
          category,
          confidence: pred.confidence,
          model: pred.model,
          model_agreement: pred.model_agreement
        },
        explanation: explanation.factors || [],
        iocs, manipulation, campaign
      };
    },

    /* Data access used by views */
    getSamples() { return TL.db.getSamples(); },
    getStats() { return TL.dataCollection.getStats(); },
    getCampaigns() { return TL.db.getCampaigns(); },
    getDistribution() { return TL.taxonomy.getDistribution(TL.db.getSamples()); },
    getModelComparison() { return TL.mlEngine.getModelComparison(); },
    getFeatureImportance() { return TL.explainability.globalFeatureImportance(); },

    /** Attack-volume trend, bucketed by collection date. */
    getTrend() {
      const buckets = {};
      TL.db.getSamples().forEach(s => {
        const k = (s.collected_at || "").slice(0, 7) + "-" + Math.ceil((parseInt((s.collected_at || "01").slice(8), 10) || 1) / 7);
        buckets[k] = (buckets[k] || 0) + 1;
      });
      const keys = Object.keys(buckets).sort();
      return keys.map(k => buckets[k]);
    },

    /** Upload validation (DASH-FR-02 / NFR-07) — type + size. */
    validateUpload(file) {
      if (!file) return { ok: false, error: "No file selected." };
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      if (!TL.config.UPLOAD.allowedExt.includes(ext))
        return { ok: false, error: "Unsupported file type ." + ext + ". Allowed: .eml, .txt" };
      if (file.size > TL.config.UPLOAD.maxBytes)
        return { ok: false, error: "File too large (max " + (TL.config.UPLOAD.maxBytes / 1048576) + " MB)." };
      return { ok: true };
    },

    recomputeCampaigns() {
      TL.db.setCampaigns(TL.threatIntel.correlateCampaigns(TL.db.getSamples()));
    },

    /** Scan the internet (via the /api/research proxy) for the latest phishing
        intelligence headlines and append them, de-duplicated, with a timestamp. */
    async scanResearch(count) {
      const res = await fetch("/api/research?count=" + (count || 10), { cache: "no-store" });
      if (!res.ok) throw new Error("scan failed (" + res.status + ")");
      const data = await res.json();
      if (!data.ok || !data.items) throw new Error(data.error || "no results");
      const now = Date.now();
      const existing = (TL.db.getMeta().researchItems || []).slice();
      const seen = new Set(existing.map(i => i.link || i.title));
      let added = 0;
      data.items.forEach(it => {
        const key = it.link || it.title;
        if (!seen.has(key)) { seen.add(key); existing.unshift(Object.assign({ scannedAt: now }, it)); added++; }
      });
      TL.db.setMeta({ researchItems: existing.slice(0, 60), lastResearchScan: now });
      return { added, total: existing.length, scannedAt: now };
    },
    getResearchItems() { return TL.db.getMeta().researchItems || []; },
    pullFeed(n) { return TL.phishingFeed.pullLatest(n); },
    trainModel() { return TL.mlEngine.train(); },
    hasModel() { return TL.mlEngine.hasModel(); }
  };
})();
