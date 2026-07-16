/* Research View (DASH-FR-03, ML-FR-03/04, REP-FR-*, DASH-FR-05 education).
   Three sub-tabs: Model Metrics · Knowledge Base · Awareness & Safety. */
TL.views.research = (function () {
  const TABS = [["metrics", "Model Metrics"], ["knowledge", "Knowledge Base"], ["awareness", "Awareness & Safety"]];
  // Remember the last sub-tab across visits.
  let tab = (TL.session.get().researchTab) || "metrics";

  // --- Curated, original knowledge answers (sources cited below the cards) ---
  const TOPICS = [
    ["How phishing attacks are created",
      "Attackers pick a target and a brand to impersonate, then register look-alike or disposable domains (or abuse free hosting). They clone a trusted login page or write a convincing pretext email, wire it to a “phishing kit” that captures whatever the victim types, and arrange delivery through spam infrastructure or hijacked accounts. Ready-made kits are bought, sold and reused, so launching a campaign takes little technical skill."],
    ["How phishing campaigns evolve over time",
      "Campaigns are tuned constantly to survive. Operators rotate domains and URLs to slip past blocklists, refresh lures around current events (tax deadlines, parcel deliveries, payroll changes), and shift channels from email to SMS (smishing) and QR codes (“quishing”). As defenders block one technique, attackers move hosting to cloud and free platforms and adjust wording — an ongoing cat-and-mouse cycle."],
    ["How attackers manipulate human behavior",
      "Phishing is social engineering: it targets predictable mental shortcuts rather than technical flaws. Common levers are authority (posing as IT, a bank or a CEO), urgency and scarcity (“act within 24 hours”), fear (“your account is suspended”), curiosity, reward, and social proof. The aim is to create enough pressure that the victim reacts before thinking."],
    ["Which attack methods dominate?",
      "Credential phishing — fake login pages that harvest usernames and passwords — is the most common form. Business Email Compromise (BEC), where an attacker impersonates an executive or supplier to redirect a payment, causes the largest financial losses despite lower volume. Malicious links and attachments remain widespread, and SMS and QR-code phishing are growing quickly."],
    ["How machine learning models detect threats",
      "Detection models turn a message into numeric features — URL and domain properties, sender authentication (SPF/DKIM), language and urgency cues, attachment behavior — and learn from large labelled sets of phishing and legitimate mail. Algorithms such as logistic regression, random forests, gradient boosting and neural networks then score new messages by how closely they resemble known attacks. ThreatLens uses this same feature-based approach."],
    ["Why automated systems make specific decisions",
      "A raw score isn’t enough for analysts to trust or learn from, so explainability methods — SHAP (SHapley Additive exPlanations), LIME and feature-importance analysis — attribute each decision back to the features that drove it (for example “40% suspicious URL, 30% urgency”). This turns a yes/no verdict into a transparent, teachable explanation — the core of the Email Analysis view."],
    ["How has generative AI changed phishing?",
      "Generative AI removes the old giveaways. Attackers can now produce fluent, personalised, error-free messages at scale and in many languages, so “bad grammar” is no longer a reliable tell. It also enables deepfake voice and video for BEC, rapid generation of fake landing pages, and automated research on targets. Defences are shifting away from spotting grammar toward behavioural and reputation signals — links, sender authentication, and threat-feed intelligence."]
  ];

  const SOURCES = [
    ["APWG — Phishing Activity Trends", "https://apwg.org/trendsreports/"],
    ["Verizon DBIR", "https://www.verizon.com/business/resources/reports/dbir/"],
    ["FBI IC3 — Internet Crime Report", "https://www.ic3.gov/"],
    ["US FTC — Report Fraud / data", "https://reportfraud.ftc.gov/"],
    ["CISA", "https://www.cisa.gov/"],
    ["ENISA Threat Landscape", "https://www.enisa.europa.eu/"],
    ["NIST", "https://www.nist.gov/"],
    ["SHAP (Lundberg & Lee)", "https://github.com/shap/shap"]
  ];

  // Acronym / term glossary (student-friendly one-liners)
  const GLOSSARY = [
    ["CTI", "Cyber Threat Intelligence", "Information about online threats and the attackers behind them."],
    ["IOC", "Indicator of Compromise", "A clue that something is malicious — a bad URL, domain or IP address."],
    ["ML", "Machine Learning", "Computers learning patterns from examples instead of fixed rules."],
    ["XAI", "Explainable AI", "Techniques that show why an AI made a decision."],
    ["SHAP", "SHapley Additive exPlanations", "A method that fairly shares the “credit” for a decision across the clues."],
    ["LIME", "Local Interpretable Model-agnostic Explanations", "Another method for explaining a single prediction."],
    ["SPF", "Sender Policy Framework", "An email check that verifies the sender is allowed to use that domain."],
    ["DKIM", "DomainKeys Identified Mail", "A signature that proves an email wasn’t tampered with in transit."],
    ["MFA", "Multi-Factor Authentication", "A second login step, like a code from your phone."],
    ["BEC", "Business Email Compromise", "A scam impersonating a boss or supplier to trigger a payment."],
    ["CRED", "Credential Theft", "Stealing usernames and passwords (often via a fake login)."],
    ["FIN", "Financial Scam", "Fake invoices, refunds or prizes designed to take your money."],
    ["LOGIN", "Fake Login Page", "A spoofed sign-in page that captures whatever you type."],
    ["MALWARE", "Malware Delivery", "An email that delivers a harmful file or attachment."]
  ];

  const AGE_GROUPS = [
    ["Teens & young adults (18–24)", "Social-media & gaming account theft, romance/sextortion, fake job & “money-mule” offers, crypto/investment hype.", "Deceived more often, usually for smaller amounts."],
    ["Adults (25–44)", "Work credential phishing (BEC targets), online-shopping fraud, job scams, crypto/investment.", "Prime targets at work."],
    ["Middle-aged (45–64)", "Investment fraud, BEC, romance scams.", "Often the largest dollar losses."],
    ["Seniors (65+)", "Tech-support pop-ups, government/impersonation (tax, benefits), romance, “grandchild in trouble” emergencies, lottery/prize.", "Highest loss per victim."]
  ];

  const CHECKLIST = [
    "Slow down when a message pushes urgency, fear or secrecy — that pressure is the attack.",
    "Check the real sender address and hover over links before clicking; type known websites directly.",
    "Never share passwords or one-time codes; turn on multi-factor authentication (MFA).",
    "Verify any payment, gift-card or wire-transfer request through a known phone number — not by replying.",
    "Don’t scan unexpected QR codes or open unexpected attachments.",
    "Keep devices and browsers updated; use a password manager so every site has a unique password.",
    "When unsure, verify through an official channel — and report it (APWG reportphishing@apwg.org, FTC reportfraud.ftc.gov, FBI ic3.gov)."
  ];

  function tabBar() {
    return `<div class="subtabs">${TABS.map(([id, label]) =>
      `<button class="subtab ${tab === id ? "on" : ""}" data-tab="${id}">${label}</button>`).join("")}</div>`;
  }

  function renderMetrics() {
    const st = TL.api.getStats();
    const mc = TL.api.getModelComparison();
    const fi = TL.api.getFeatureImportance();
    const best = mc.reduce((a, b) => (b.accuracy > a.accuracy ? b : a), mc[0]);
    const mcRows = mc.map(m => `
      <tr><td>${m.best ? '<span class="tag-s tag-best">' + TL.util.esc(m.model) + "</span>" : TL.util.esc(m.model)}</td>
      <td class="mono">${(m.accuracy * 100).toFixed(1)}%</td><td class="mono">${m.precision}</td><td class="mono">${m.recall}</td></tr>`).join("");
    const maxImp = Math.max.apply(null, fi.map(f => f.importance));
    const fiBars = fi.map(f => ({ label: f.feature, pct: Math.round((f.importance / maxImp) * 100), value: f.importance.toFixed(3) }));
    return `
      <div class="kpis">
        ${TL.ui.kpi("Dataset", st.samples.toLocaleString(), "labeled samples", "")}
        ${TL.ui.kpi("Features", st.features, "email·url·behavioral", "")}
        ${TL.ui.kpi("Best Accuracy", (best.accuracy * 100).toFixed(1) + "%", best.model, "up")}
        ${TL.ui.kpi("Categories", st.categories, "taxonomy", "")}
      </div>
      <div class="kb-card metric-help">
        <h3>How to read this tab (in plain English)</h3>
        <p>A <strong>model</strong> is a program that learned from thousands of past emails to guess whether a
          new email is phishing. We built four different models, tested each on emails it had never seen before,
          and compared the results. We also show which <strong>clues</strong> (called <em>features</em>) mattered
          most in their decisions.</p>
      </div>
      <div class="grid2e">
        <div class="panel">
          <div class="pt"><h2 class="sec">Model comparison</h2><span class="hint"><abbr title="Cross-validation: the model is tested on data it did not learn from, repeated 10 times">10-fold CV</abbr></span></div>
          <p class="explain"><strong>What am I looking at?</strong> Each row is one detector, graded like a
            student taking the same test. <strong>Accuracy</strong> = share of all emails it labelled correctly.
            <strong>Precision</strong> = when it shouts “phishing”, how often it’s right (high = few false alarms).
            <strong>Recall</strong> = of all the real phishing emails, how many it actually caught (high = few misses).
            The best all-round model (highlighted) becomes our main detector.</p>
          <div class="tablewrap"><table class="data">
            <thead><tr><th>Model</th><th>Accuracy</th><th>Precision</th><th>Recall</th></tr></thead>
            <tbody>${mcRows}</tbody></table></div>
        </div>
        <div class="panel">
          <div class="pt"><h2 class="sec">Global feature importance</h2><span class="hint"><abbr title="SHapley Additive exPlanations">SHAP</abbr></span></div>
          <p class="explain"><strong>What am I looking at?</strong> A <em>feature</em> is one clue the model
            checks — like how old the website’s domain is, or how urgent the wording sounds. This chart ranks
            which clues influenced the decisions most across <em>all</em> emails: a longer bar = a more important
            clue. It’s like a detective saying which pieces of evidence were the most useful.</p>
          ${TL.ui.barlist(fiBars)}
        </div>
      </div>
      <div class="gap"></div>
      <div class="panel">
        <div class="pt"><h2 class="sec">Export research artifacts</h2></div>
        <div class="filterbar">
          <button class="btn" id="exp-csv">⬇ Dataset (.csv)</button>
          <button class="btn" id="exp-md">⬇ Report (.md)</button>
          <button class="btn" id="exp-json">⬇ Taxonomy (.json)</button>
        </div>
      </div>`;
  }

  function renderKnowledge() {
    const cards = TOPICS.map(([q, a]) =>
      `<div class="kb-card"><h3>${TL.util.esc(q)}</h3><p>${a}</p></div>`).join("");
    const srcs = SOURCES.map(([n, u]) =>
      `<li><a href="${u}" target="_blank" rel="noopener">${TL.util.esc(n)} ↗</a></li>`).join("");

    const items = TL.api.getResearchItems();
    const last = TL.db.getMeta().lastResearchScan;
    const scanList = items.length ? items.map(it => `
      <div class="scan-item">
        <a href="${TL.util.esc(it.link)}" target="_blank" rel="noopener">${TL.util.esc(it.title)} ↗</a>
        <div class="meta">${TL.util.esc(it.source)} · ${TL.util.esc(it.published || "")} · scanned ${TL.util.fmtDateTime(it.scannedAt)}</div>
      </div>`).join("") : `<p class="muted">No live intelligence scanned yet.</p>`;

    return `
      <div class="kb-intro"><p class="muted">Original summaries answering the core ThreatLens questions.
        Follow the source links for authoritative, up-to-date figures.</p></div>
      ${cards}
      <div class="kb-card">
        <h3>Sources &amp; attribution</h3>
        <p>The summaries above are written by ThreatLens to avoid copying copyrighted text. For primary
          data and the latest statistics, see:</p>
        <ul class="src-list">${srcs}</ul>
      </div>
      <div class="kb-card">
        <h3>Glossary — the acronyms in this app</h3>
        <p>Short codes like <span class="tag-s tag-cred">CRED</span>, <span class="tag-s tag-bec">BEC</span> and
          <span class="tag-s tag-best">FIN</span> appear in the Campaign and Analysis views. Here is what every
          term means:</p>
        <div class="tablewrap"><table class="glossary">
          <thead><tr><th>Term</th><th>Stands for</th><th>What it means</th></tr></thead>
          <tbody>${GLOSSARY.map(([t, f, m]) =>
            `<tr><td class="term">${TL.util.esc(t)}</td><td class="full">${TL.util.esc(f)}</td><td>${TL.util.esc(m)}</td></tr>`).join("")}</tbody>
        </table></div>
      </div>
      <div class="panel">
        <div class="pt"><h2 class="sec">Live intelligence scan</h2><span class="hint">headlines link to source</span></div>
        <p class="muted">Connect to the internet and append the latest phishing/scam headlines from reputable
          security-news feeds (The Hacker News, BleepingComputer), each stamped with the scan time. Only
          titles are stored; every item links back to its original source to respect copyright.</p>
        <div class="filterbar">
          <button class="btn btn-accent" id="scan-research">🌐 Scan the internet for latest intelligence</button>
          <span class="muted" style="align-self:center">Last scan: ${TL.util.fmtDateTime(last)}</span>
        </div>
        <div id="scan-results">${scanList}</div>
      </div>`;
  }

  function renderAwareness() {
    const rows = AGE_GROUPS.map(([g, s, n]) =>
      `<tr><td><strong>${TL.util.esc(g)}</strong></td><td>${TL.util.esc(s)}</td><td class="muted">${TL.util.esc(n)}</td></tr>`).join("");
    const checks = CHECKLIST.map(c => `<li>${c}</li>`).join("");
    return `
      <div class="kb-intro"><p class="muted">Anyone can be targeted, but the scams that work best differ by age.
        These patterns are drawn from public fraud-reporting data (FTC, FBI IC3); exact figures vary by year and
        country — follow the source links in the Knowledge Base for the latest.</p></div>
      <div class="panel">
        <div class="pt"><h2 class="sec">Who is targeted, and how</h2><span class="hint">by age group</span></div>
        <div class="tablewrap"><table class="data">
          <thead><tr><th>Age group</th><th>Scams that commonly affect them</th><th>Note</th></tr></thead>
          <tbody>${rows}</tbody></table></div>
      </div>
      <div class="gap"></div>
      <div class="panel">
        <div class="pt"><h2 class="sec">Be careful — protect yourself</h2><span class="hint">quick checklist</span></div>
        <ul class="checklist">${checks}</ul>
      </div>`;
  }

  function render() {
    const body = tab === "metrics" ? renderMetrics()
      : tab === "knowledge" ? renderKnowledge() : renderAwareness();
    return `
      <div class="view-head"><h1>Research &amp; Reproducibility</h1><span class="crumb">/ research</span></div>
      ${tabBar()}
      ${body}`;
  }

  function mount() {
    document.querySelectorAll("[data-tab]").forEach(b =>
      b.addEventListener("click", () => {
        tab = b.dataset.tab;
        TL.session.set({ researchTab: tab });
        if (tab === "knowledge") TL.session.mark("readKnowledge");
        TL.app.route();
      }));
    if (tab === "knowledge") TL.session.mark("readKnowledge");

    const csv = document.getElementById("exp-csv");
    if (csv) {
      csv.addEventListener("click", () => { TL.reporting.exportDatasetCsv(); TL.ui.toast("Dataset exported."); });
      document.getElementById("exp-md").addEventListener("click", () => { TL.reporting.exportReport(); TL.ui.toast("Report exported."); });
      document.getElementById("exp-json").addEventListener("click", () => { TL.reporting.exportTaxonomyJson(); TL.ui.toast("Taxonomy exported."); });
    }

    const scan = document.getElementById("scan-research");
    if (scan) scan.addEventListener("click", async () => {
      const label = scan.textContent;
      scan.disabled = true; scan.textContent = "🌐 Scanning…";
      try {
        const r = await TL.api.scanResearch();
        TL.app.route();
        TL.ui.toast("Scanned: +" + r.added + " new headline(s).");
      } catch (e) {
        TL.ui.toast("Couldn’t reach the internet — run via server.py. (" + e.message + ")");
      } finally {
        scan.disabled = false; scan.textContent = label;
      }
    });
  }

  return { render, mount };
})();
