/* Test Runner View — runs the executable +ve / -ve test cases live in-browser. */
TL.views.tests = (function () {
  let results = [];   // [{tc, pass, detail}]
  let filter = "all";

  function render() {
    return `
      <div class="view-head"><h1>Test Runner</h1><span class="crumb">/ tests</span></div>
      <div class="kb-card">
        <h3>What is this, and why does it matter?</h3>
        <p>The Test Runner automatically checks that ThreatLens actually works. It runs 20 built-in checks
          against the live code and shows <strong>✓ PASS</strong> or <strong>✗ FAIL</strong> for each — this
          is how we prove the app meets its written requirements (the SRD).</p>
        <p><strong>Positive tests (POS)</strong> confirm the app does the right thing on normal input — e.g. it
          correctly flags a phishing email, extracts the URL, and trains the models.
          <strong>Negative tests (NEG)</strong> confirm it handles bad or tricky input safely — e.g. it rejects a
          huge file, doesn’t crash on a broken email, and does <em>not</em> wrongly flag a legitimate email.</p>
        <p>Each row shows the <strong>SRD requirement ID</strong> it verifies. All green = the system meets its
          spec. If a row is red, its detail text says what went wrong. Tests run automatically when you open this
          tab; click <strong>Run all tests</strong> to re-run them anytime (e.g. after pulling new scams).</p>
      </div>
      <div class="filterbar">
        <button class="btn btn-accent" id="run-tests">▶ Run all tests</button>
        <button class="btn" data-filter="all">All</button>
        <button class="btn" data-filter="positive">Positive</button>
        <button class="btn" data-filter="negative">Negative</button>
      </div>
      <div id="test-summary"></div>
      <div id="test-list"></div>`;
  }

  function mount() {
    document.getElementById("run-tests").addEventListener("click", runAll);
    document.querySelectorAll("[data-filter]").forEach(b =>
      b.addEventListener("click", () => { filter = b.dataset.filter; draw(); }));
    runAll();  // auto-run on open
  }

  function runAll() {
    results = TL.testCases.map(tc => {
      let r;
      try { r = tc.run(); } catch (e) { r = { pass: false, detail: "Exception: " + e.message }; }
      return { tc, pass: r.pass, detail: r.detail };
    });
    draw();
    const passed = results.filter(r => r.pass).length;
    TL.ui.toast(passed + " / " + results.length + " tests passed");
  }

  function draw() {
    if (!results.length) return;
    const passed = results.filter(r => r.pass).length;
    const failed = results.length - passed;
    document.getElementById("test-summary").innerHTML = `
      <div class="test-summary">
        <div class="stat"><div class="n">${results.length}</div><div class="l">Total</div></div>
        <div class="stat pass"><div class="n">${passed}</div><div class="l">Passed</div></div>
        <div class="stat fail"><div class="n">${failed}</div><div class="l">Failed</div></div>
      </div>`;

    const shown = results.filter(r => filter === "all" || r.tc.type === filter);
    document.getElementById("test-list").innerHTML = shown.map(r => `
      <div class="tcase">
        <div>
          <div class="id">${r.tc.id}</div>
          <span class="badge ${r.tc.type === "positive" ? "pos" : "neg"}">${r.tc.type === "positive" ? "POS" : "NEG"}</span>
        </div>
        <div>
          <div class="ti">${TL.util.esc(r.tc.title)}</div>
          <div class="rq">${TL.util.esc(r.tc.reqs)}</div>
          <div class="dt">${TL.util.esc(r.detail)}</div>
        </div>
        <div class="badge ${r.pass ? "pass" : "fail"}">${r.pass ? "✓ PASS" : "✗ FAIL"}</div>
      </div>`).join("");
  }

  return { render, mount };
})();
