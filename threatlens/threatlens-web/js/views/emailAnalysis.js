/* Email Analysis View (DASH-FR-02, XAI-FR-01/03). */
TL.views.analysis = (function () {
  function render() {
    const samples = TL.api.getSamples();
    const opts = samples.map((s, i) =>
      `<option value="${i}">#${s.id} — ${TL.util.esc(s.subject).slice(0, 60)}</option>`).join("");
    return `
      <div class="view-head"><h1>Email Analysis</h1><span class="crumb">/ analyze</span></div>
      <div class="panel">
        <label class="fld" for="sample-select">Select a sample from the dataset</label>
        <select id="sample-select">${opts}</select>
        <div id="email-preview" class="email-preview"></div>
        <label class="fld" for="sample-text">…or paste raw email text</label>
        <textarea id="sample-text" placeholder="From: ...\nSubject: ...\n\nbody text"></textarea>
        <label class="fld" for="sample-file">…or upload a file (.eml / .txt, max 20&nbsp;MB)</label>
        <input type="file" id="sample-file" />
        <div class="form-row" style="margin-top:12px">
          <span class="muted">Files are processed locally — nothing is uploaded to a server.</span>
          <button class="btn btn-accent" id="btn-analyze">Analyze ▸</button>
        </div>
      </div>
      <div class="gap"></div>
      <div id="analysis-result"></div>`;
  }

  function renderPreview(idx) {
    const el = document.getElementById("email-preview");
    const s = TL.api.getSamples()[+idx];
    if (!s) { el.innerHTML = ""; return; }
    el.innerHTML = `
      <div class="ep-head">
        <span class="ep-title">Email content</span>
        <span class="ep-id">#${s.id}${s.label ? " · " + TL.util.esc(s.label) : ""}</span>
      </div>
      <div class="ep-meta"><span class="k">From</span><span class="val">${TL.util.esc(s.sender || "—")}</span></div>
      <div class="ep-meta"><span class="k">Subject</span><span class="val">${TL.util.esc(s.subject || "—")}</span></div>
      ${s.url ? `<div class="ep-meta"><span class="k">URL</span><span class="val">${TL.util.esc(TL.util.defang(s.url))}</span></div>` : ""}
      <div class="ep-body">${TL.util.esc(s.body || "(no body)")}</div>`;
  }

  function mount() {
    const select = document.getElementById("sample-select");
    // Show the selected email's content; refresh on change.
    select.addEventListener("change", () => {
      renderPreview(select.value);
      document.getElementById("sample-text").value = "";   // selection wins over stale paste
    });
    renderPreview(select.value);   // initial

    const fileInput = document.getElementById("sample-file");
    fileInput.addEventListener("change", () => {
      const f = fileInput.files[0];
      if (!f) return;
      const v = TL.api.validateUpload(f);   // NFR-07 / DASH-FR-02
      if (!v.ok) { TL.ui.toast(v.error); fileInput.value = ""; return; }
      const reader = new FileReader();
      reader.onload = () => { document.getElementById("sample-text").value = reader.result; TL.ui.toast("File loaded into text box."); };
      reader.readAsText(f);
    });

    // If arriving from the Scams view via "Analyze →", preselect + auto-run.
    if (TL.state && TL.state.pendingAnalyzeId != null) {
      const id = TL.state.pendingAnalyzeId;
      TL.state.pendingAnalyzeId = null;
      const idx = TL.api.getSamples().findIndex(s => s.id === id);
      if (idx >= 0) {
        select.value = String(idx);
        renderPreview(select.value);
        setTimeout(() => document.getElementById("btn-analyze").click(), 0);
      }
    }

    document.getElementById("btn-analyze").addEventListener("click", () => {
      const text = document.getElementById("sample-text").value.trim();
      let sample;
      if (text) {
        sample = parseRaw(text);
      } else {
        const idx = document.getElementById("sample-select").value;
        if (idx === "" || idx == null) { TL.ui.toast("Select a sample or paste email text first."); return; }
        sample = TL.api.getSamples()[+idx];
      }
      if (!sample || (!sample.subject && !sample.body && !sample.sender)) {
        TL.ui.toast("No analyzable content provided."); return;   // TC-N-10
      }
      TL.session.mark("analyzedEmail");
      renderResult(TL.api.analyze(sample));
    });
  }

  function parseRaw(text) {
    const from = (text.match(/^From:\s*(.+)$/im) || [])[1] || "";
    const subj = (text.match(/^Subject:\s*(.+)$/im) || [])[1] || "";
    const body = text.replace(/^From:.*$/im, "").replace(/^Subject:.*$/im, "").trim();
    return { sender: from.trim(), subject: subj.trim(), body: body || text };
  }

  function renderResult(res) {
    const el = document.getElementById("analysis-result");
    if (res.error) { el.innerHTML = `<div class="panel"><span class="fail">${TL.util.esc(res.error)}</span></div>`; return; }
    const p = res.prediction;
    const pct = Math.round(p.confidence * 100);
    const cls = p.is_phishing ? "bad" : "good";
    const gaugeColor = p.is_phishing ? "var(--crit)" : "var(--safe)";

    const bars = res.explanation.map(f => ({ label: f.factor, pct: f.weight, value: f.weight + "%", title: f.help }));
    const chips = TL.config.MANIPULATION.map(t =>
      `<span class="chip ${res.manipulation.present[t] ? "" : "off"}">${t}</span>`).join("");

    const iocRows = [];
    if (res.iocs.sender) iocRows.push(["SENDER", res.iocs.sender]);
    res.iocs.domains.forEach(d => iocRows.push(["DOMAIN", TL.util.defang(d)]));
    res.iocs.urls.forEach(u => iocRows.push(["URL", TL.util.defang(u)]));
    res.iocs.ips.forEach(ip => iocRows.push(["IP", ip]));
    iocRows.push(["SPF", res.iocs.spf]);
    if (res.iocs.brand) iocRows.push(["BRAND", res.iocs.brand]);
    const keyHtml = t => t === "SPF"
      ? '<abbr title="Sender Policy Framework">SPF</abbr>'
      : TL.util.esc(t);
    const iocHtml = iocRows.map(([t, v]) =>
      `<div class="row"><span class="t">${keyHtml(t)}</span><span class="v ${String(v).toLowerCase() === "fail" ? "fail" : ""}">${TL.util.esc(v)}</span></div>`).join("");

    const edu = TL.education.explain(res);
    const li = s => `<li>${TL.util.esc(s)}</li>`;
    const eduHtml = `
      <div class="gap"></div>
      <div class="panel edu">
        <div class="pt"><h2 class="sec">Understanding this verdict</h2><span class="hint">plain-language explainer</span></div>
        <div class="eduq"><div class="eq">Why was it ${p.is_phishing ? "malicious" : "considered safe"}?</div><p class="ea">${TL.util.esc(edu.why)}</p></div>
        <div class="eduq"><div class="eq">Which indicators triggered detection?</div><ul class="ea">${edu.indicators.map(li).join("")}</ul></div>
        <div class="eduq"><div class="eq">What attacker techniques were used?</div><ul class="ea">${edu.techniques.map(li).join("")}</ul></div>
        <div class="eduq"><div class="eq">How can humans recognize similar attacks?</div><ul class="ea">${edu.recognize.map(li).join("")}</ul></div>
      </div>`;

    const link = res.campaign
      ? `<div class="muted" style="margin-top:10px">Linked to <strong>${TL.util.esc(res.campaign.id)}</strong> — shares ${TL.util.esc(res.campaign.shared_ioc)} with ${res.campaign.sample_count} samples.</div>`
      : "";

    el.innerHTML = `
      <div class="verdict ${cls}">
        <div class="gauge" style="background:conic-gradient(${gaugeColor} 0 ${pct}%, var(--surface-3) ${pct}% 100%)"><span>${pct}%</span></div>
        <div><div class="vl">Prediction</div><div class="vv">${TL.util.esc(p.label)}</div>
        <div class="vs">confidence ${pct}% · model: ${TL.util.esc(p.model)} · ${TL.util.esc(p.model_agreement)}</div></div>
      </div>
      <div class="gap"></div>
      <div class="grid2">
        <div class="panel">
          <div class="pt"><h2 class="sec">Why? — explanation (<abbr title="SHapley Additive exPlanations">SHAP</abbr>-style)</h2><span class="hint">contribution</span></div>
          ${bars.length ? TL.ui.barlist(bars) : '<span class="muted">No phishing factors — benign signals.</span>'}
          <div class="gap"></div>
          <h2 class="sec">Manipulation techniques</h2>
          <div class="chips">${chips}</div>
        </div>
        <div class="panel">
          <div class="pt"><h2 class="sec">Indicators (IOCs)</h2><span class="hint">extracted</span></div>
          <div class="ioc">${iocHtml}</div>
          ${link}
        </div>
      </div>
      ${eduHtml}`;
  }

  return { render, mount };
})();
