/* Threat Intelligence Engine (TI-FR-01/04/05/06).
   IOC extraction + campaign correlation by shared domain. */
TL.threatIntel = (function () {
  const URL_RE = /\bhttps?:\/\/[^\s"'<>]+/gi;
  const IP_RE = /\b\d{1,3}(\.\d{1,3}){3}\b/g;

  function hostOf(url) {
    try { return new URL(url).host.toLowerCase(); }
    catch (e) { return String(url || "").replace(/^https?:\/\//i, "").split(/[\/?#]/)[0].toLowerCase(); }
  }

  return {
    /** extractIocs(sample) -> {domains,urls,ips,sender,spf,brand} (TI-FR-01/05).
        Returns empty arrays when nothing is found — no error. */
    extractIocs(sample) {
      const body = sample.body || "";
      const urls = new Set();
      if (sample.url) urls.add(sample.url);
      (body.match(URL_RE) || []).forEach(u => urls.add(u));
      const domains = new Set();
      urls.forEach(u => domains.add(hostOf(u)));
      const senderDomain = (sample.sender || "").includes("@") ? sample.sender.split("@")[1].toLowerCase() : null;
      if (senderDomain) domains.add(senderDomain);
      const ips = new Set((body.match(IP_RE) || []));

      let brand = null;
      const m = (body + " " + (sample.subject || "")).match(/microsoft|amazon|paypal|google|apple|bank/i);
      if (m) brand = "impersonates: " + m[0];

      return {
        sender: sample.sender || null,
        domains: [...domains],
        urls: [...urls],
        ips: [...ips],
        spf: sample.spf_fail ? "fail" : "pass",
        brand: brand
      };
    },

    /** correlateCampaigns(samples) -> campaigns grouped by shared domain (TI-FR-04). */
    correlateCampaigns(samples) {
      const groups = {};
      samples.forEach(s => {
        const d = (s.sender || "").includes("@") ? s.sender.split("@")[1].toLowerCase() : null;
        if (!d) return;
        (groups[d] = groups[d] || []).push(s);
      });
      let n = 40;
      return Object.keys(groups)
        .filter(d => groups[d].length >= 2)                     // a campaign = 2+ shared samples
        .map(d => {
          const g = groups[d];
          const dates = g.map(s => s.collected_at).sort();
          const types = {};
          g.forEach(s => { types[s.label] = (types[s.label] || 0) + 1; });
          const type = Object.keys(types).sort((a, b) => types[b] - types[a])[0] || "—";
          return {
            id: "CMP-" + String(++n).padStart(4, "0"),
            first_seen: dates[0],
            sample_count: g.length,
            type: type,
            shared_ioc: TL.util.defang(d)
          };
        })
        .sort((a, b) => b.sample_count - a.sample_count);
    },

    /** Which campaign (domain) does this sample belong to? (TI-FR-06) */
    campaignFor(sample, campaigns) {
      const d = (sample.sender || "").includes("@") ? TL.util.defang(sample.sender.split("@")[1].toLowerCase()) : null;
      return campaigns.find(c => c.shared_ioc === d) || null;
    }
  };
})();
