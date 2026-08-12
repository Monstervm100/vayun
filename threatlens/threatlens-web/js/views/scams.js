/* Live Scams View — where the data comes from, a dated pull history, and a
   browsable list of pulled phishing scams (each openable in Email Analysis). */
TL.views = TL.views || {};
TL.views.scams = (function () {
  function render() {
    const meta = TL.db.getMeta();
    const scams = TL.api.getSamples().filter(s => s.label && s.label !== "Legitimate");

    // Aggregate pull history by date (e.g., "09 Jul — 4 scams").
    const byDate = {};
    (meta.feedHistory || []).forEach(h => {
      const d = byDate[h.date] || (byDate[h.date] = { count: 0, sources: {} });
      d.count += h.added; d.sources[h.source] = true;
    });
    const histRows = Object.keys(byDate).sort().reverse().map(d =>
      `<tr><td>${TL.util.esc(d)}</td><td>${byDate[d].count}</td><td class="mono">${TL.util.esc(Object.keys(byDate[d].sources).join(", "))}</td></tr>`
    ).join("") || `<tr><td colspan="3" class="muted">No pulls yet — click “Pull latest phishing scams”.</td></tr>`;

    const rows = scams.slice().reverse().slice(0, 100).map(s => {
      const dom = (s.sender || "").split("@")[1] || "—";
      return `<tr>
        <td>${TL.util.esc(s.collected_at)}</td>
        <td class="mono">${TL.util.esc(s.source)}</td>
        <td class="mono">${TL.util.esc(TL.util.defang(dom))}</td>
        <td class="mono">${s.url ? TL.util.esc(TL.util.defang(s.url)).slice(0, 46) : "—"}</td>
        <td>${TL.util.esc(s.label)}</td>
        <td><button class="btn btn-sm" data-analyze="${s.id}">Analyze →</button></td>
      </tr>`;
    }).join("") || `<tr><td colspan="6" class="muted">No scams in the dataset yet.</td></tr>`;

    return `
      <div class="view-head"><h1>Live Phishing Scams</h1><span class="crumb">/ scams</span></div>

      <div class="panel src-panel">
        <div class="pt"><h2 class="sec">Where this data comes from</h2></div>
        <p class="muted">Live phishing samples are pulled from the
          <strong>OpenPhish</strong> community feed (<span class="mono">openphish.com</span>), with
          <strong>URLhaus</strong> by abuse.ch (<span class="mono">urlhaus.abuse.ch</span>) as a fallback —
          both free and requiring no API key. Pulls run through the local proxy
          (<span class="mono">/api/feed</span>) and are refreshed automatically each month by a GitHub Action.
          Offline, a built-in simulator is used instead.</p>
        <p class="muted">Current source: <strong>${TL.util.esc(meta.lastFeedSource || "seed dataset")}</strong> ·
          last updated <strong>${TL.util.fmtDate(meta.lastFeedPull)}</strong>.</p>
        <button class="btn btn-accent" id="scams-pull">⟳ Pull latest phishing scams</button>
      </div>

      <div class="gap"></div>
      <div class="grid2">
        <div class="panel">
          <div class="pt"><h2 class="sec">Pull history</h2><span class="hint">scams added per day</span></div>
          <div class="tablewrap"><table class="data">
            <thead><tr><th>Date</th><th>Scams pulled</th><th>Source</th></tr></thead>
            <tbody>${histRows}</tbody></table></div>
        </div>
        <div class="panel">
          <div class="pt"><h2 class="sec">Totals</h2></div>
          <div class="kpis" style="grid-template-columns:1fr 1fr;margin:0">
            ${TL.ui.kpi("Scams stored", scams.length, "phishing samples", "")}
            ${TL.ui.kpi("Pull events", (meta.feedHistory || []).length, "recorded", "")}
          </div>
        </div>
      </div>

      <div class="gap"></div>
      <div class="panel">
        <div class="pt"><h2 class="sec">Scam samples (${scams.length})</h2><span class="hint">newest first · click Analyze to explain one</span></div>
        <div class="tablewrap"><table class="data">
          <thead><tr><th>Collected</th><th>Source</th><th>Sender domain</th><th>URL</th><th>Category</th><th></th></tr></thead>
          <tbody>${rows}</tbody></table></div>
      </div>`;
  }

  function mount() {
    const pull = document.getElementById("scams-pull");
    if (pull) pull.addEventListener("click", async () => {
      const label = pull.textContent;
      pull.disabled = true; pull.textContent = "⟳ Pulling…";
      try {
        const r = await TL.api.pullFeed();
        TL.app.updateFeedStatus();
        TL.app.route();  // re-render this view with the new scams + history
        TL.ui.toast("Feed (" + r.source + "): +" + r.added + " new scam(s).");
      } catch (e) {
        TL.ui.toast("Feed error: " + e.message);
      } finally {
        pull.disabled = false; pull.textContent = label;
      }
    });

    // "Analyze →" opens the sample in the Email Analysis view.
    document.querySelectorAll("[data-analyze]").forEach(b =>
      b.addEventListener("click", () => {
        TL.state.pendingAnalyzeId = +b.dataset.analyze;
        location.hash = "#analysis";
      }));
  }

  return { render, mount };
})();
