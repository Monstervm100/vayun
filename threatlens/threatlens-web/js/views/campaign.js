/* Campaign View (DASH-FR-01) — trends, techniques, timeline. */
TL.views = TL.views || {};
TL.views.campaigns = (function () {
  function render() {
    const st = TL.api.getStats();
    const dist = TL.api.getDistribution();
    const top = Object.keys(dist)[0] || "—";
    const campaigns = TL.api.getCampaigns();
    const trend = TL.api.getTrend();

    const bars = Object.keys(dist).map(k => ({ label: k, pct: dist[k], value: dist[k] + "%" }));

    const rows = campaigns.length ? campaigns.map(c => `
      <tr><td class="mono">${TL.util.esc(c.id)}</td><td>${TL.util.esc(c.first_seen)}</td>
      <td>${c.sample_count}</td><td>${tag(c.type)}</td><td class="mono">${TL.util.esc(c.shared_ioc)}</td></tr>`).join("")
      : `<tr><td colspan="5" class="muted">No multi-sample campaigns yet. Pull the feed to grow the dataset.</td></tr>`;

    return `
      <div class="view-head"><h1>Campaign Overview</h1><span class="crumb">/ campaigns</span></div>
      ${progressCard()}
      <div class="kpis">
        ${TL.ui.kpi("Samples", st.samples.toLocaleString(), st.phishing + " phishing", "up")}
        ${TL.ui.kpi("Campaigns", st.campaigns, "correlated", "")}
        ${TL.ui.kpi("Top Technique", top, (dist[top] || 0) + "% of set", "")}
        ${TL.ui.kpi("Legitimate", st.legitimate, "ham samples", "")}
      </div>
      <div class="grid2">
        <div class="panel">
          <div class="pt"><h2 class="sec">Attack trend — volume over time</h2><span class="hint">by week</span></div>
          ${TL.ui.sparkline(trend)}
        </div>
        <div class="panel">
          <div class="pt"><h2 class="sec">Common techniques</h2><span class="hint">taxonomy</span></div>
          ${TL.ui.barlist(bars)}
        </div>
      </div>
      <div class="gap"></div>
      <div class="panel">
        <div class="pt"><h2 class="sec">Campaign timeline</h2><span class="hint">correlated by shared IOC (TI-FR-04)</span></div>
        <div class="tablewrap"><table class="data">
          <thead><tr><th>Campaign</th><th>First seen</th><th>Samples</th><th>Type</th><th><abbr title="Indicator of Compromise — a shared clue like a domain or IP">Shared IOC</abbr></th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
        <div class="legend"><strong>Type codes:</strong> CRED = Credential Theft · BEC = Business Email Compromise ·
          FIN = Financial Scam · LOGIN = Fake Login Page · MALWARE = Malware Delivery. Full glossary in Research → Knowledge Base.</div>
      </div>`;
  }
  /** "Your progress" card — saved in this browser, so it survives a return visit. */
  function progressCard() {
    const s = TL.session;
    const pct = s.percent();
    const last = s.get().previousVisit;   // the visit before this one
    const visits = s.get().visits || 1;
    const items = s.MILESTONES.map(([k, label]) =>
      `<li class="${s.done(k) ? "ok" : ""}">${s.done(k) ? "✓" : "○"} ${TL.util.esc(label)}</li>`).join("");
    const done = pct === 100;
    return `
      <div class="panel progress-card">
        <div class="pt">
          <h2 class="sec">Your progress ${done ? "— all done! 🎉" : ""}</h2>
          <span class="hint">${visits > 1 ? "visit #" + visits + " · saved in this browser" : "saved in this browser"}</span>
        </div>
        <div class="prog-bar"><span style="width:${pct}%"></span></div>
        <div class="prog-pct">${pct}% complete${last ? " · last visit " + TL.util.fmtDateTime(last) : ""}</div>
        <ul class="prog-list">${items}</ul>
      </div>
      <div class="gap"></div>`;
  }

  function tag(type) {
    const map = { "Credential Theft": "tag-cred", "Business Email Compromise": "tag-bec" };
    const short = { "Credential Theft": "CRED", "Business Email Compromise": "BEC", "Financial Scam": "FIN",
      "Fake Login Page": "LOGIN", "Malware Delivery": "MALWARE" };
    return `<span class="tag-s ${map[type] || "tag-best"}" title="${TL.util.esc(type)}">${short[type] || TL.util.esc(type)}</span>`;
  }
  return { render, mount() {} };
})();
