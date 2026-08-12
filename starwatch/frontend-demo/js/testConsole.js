// testConsole.js
// Runs browser-executable versions of the test cases from
// STARWATCH_Test_Plan.md, each tagged with its SRS requirement ID.
//
// Most test cases run a real JS analog of the Python module described in the
// Design Document (same thresholds, same formulas) — these are marked
// "analog" where the browser can't perfectly replicate a backend/file-system
// concern (e.g. reading a real .joblib file, or ML metrics from a real
// Isolation Forest). Two cases are pure backend/file-system concerns and
// can't be meaningfully run in a browser at all — those are marked
// "Backend required" and link to which pytest file covers them for real.

const TEST_CASES = [
  // ---------------- POSITIVE ----------------
  {
    id: 'TC-P01', req: 'FR1.1', kind: 'positive', backendOnly: false, analog: true,
    title: 'Simulator generates scheduled normal events',
    expected: 'Generated normal window has time_anomaly_flag = 0 (within comm window)',
    run: async () => {
      const win = generateNormalWindow('EOS-1');
      const pass = win.time_anomaly_flag === 0;
      return { pass, actual: `time_anomaly_flag = ${win.time_anomaly_flag}` };
    }
  },
  {
    id: 'TC-P02', req: 'FR1.3', kind: 'positive', backendOnly: true,
    title: 'Batch mode writes correct volume to CSV + DB',
    expected: '5,000 rows in satellite_events.csv match row count in SQLite',
    note: 'File-system + DB concern — verify with backend/tests/test_simulator.py against the real simulator.py'
  },
  {
    id: 'TC-P03', req: 'FR2.1', kind: 'positive', backendOnly: false,
    title: 'Rule-based pre-filter flags known violation',
    expected: 'AUTH_THRESHOLD_EXCEEDED flag set when auth_failures_count = 8 (threshold = 5)',
    run: async () => {
      const flags = applyRules({ auth_failures_count: 8, command_frequency: 4, unknown_source: false });
      const pass = flags.includes('AUTH_THRESHOLD_EXCEEDED');
      return { pass, actual: `flags = [${flags.join(', ')}]` };
    }
  },
  {
    id: 'TC-P04', req: 'FR2.2', kind: 'positive', backendOnly: false, analog: true,
    title: 'Anomaly detector flags injected frequency-spike scenario',
    expected: 'COMMAND_FREQUENCY_EXCEEDED fires and an alert is raised (risk ≥ 30). The Test Plan\'s real check — Isolation Forest anomaly score ≥ 0.7 in [0,1] — needs the Python backend (backend/train_model.py).',
    run: async () => {
      const win = injectScenario('EOS-1', 'frequency_spike');
      const flags = applyRules(win);
      const risk = computeRisk(flags);
      const pass = flags.includes('COMMAND_FREQUENCY_EXCEEDED') && risk.risk_score >= 30;
      return { pass, actual: `flags = [${flags.join(', ')}], risk_score = ${risk.risk_score}, severity = ${risk.severity}` };
    }
  },
  {
    id: 'TC-P05', req: 'FR3.1 / FR3.2', kind: 'positive', backendOnly: false,
    title: 'Risk engine computes correct score and factor breakdown',
    expected: 'risk_score = 90, severity = CRITICAL, 3 contributing factors',
    run: async () => {
      const risk = computeRisk(['AUTH_THRESHOLD_EXCEEDED', 'UNKNOWN_SOURCE', 'COMMAND_FREQUENCY_EXCEEDED']);
      const pass = risk.risk_score === 90 && risk.severity === 'CRITICAL' && risk.contributing_factors.length === 3;
      return { pass, actual: `risk_score=${risk.risk_score}, severity=${risk.severity}, factors=${risk.contributing_factors.length}` };
    }
  },
  {
    id: 'TC-P06', req: 'FR3.3', kind: 'positive', backendOnly: false,
    title: 'Severity threshold mapping is correct mid-range',
    expected: 'severity = HIGH for score 65',
    run: async () => {
      const sev = severityBand(65);
      return { pass: sev === 'HIGH', actual: `severity = ${sev}` };
    }
  },
  {
    id: 'TC-P07', req: 'FR4.2', kind: 'positive', backendOnly: false,
    title: 'AI explanation returns complete structured output',
    expected: 'Non-empty summary, likely_cause, and 3–5 recommended_actions',
    run: async () => {
      const risk = computeRisk(['AUTH_THRESHOLD_EXCEEDED', 'UNKNOWN_SOURCE', 'COMMAND_FREQUENCY_EXCEEDED']);
      const exp = buildExplanation(risk, {}, { forceFailure: false });
      const pass = !!exp.summary && !!exp.likely_cause && exp.recommended_actions.length >= 3 && exp.recommended_actions.length <= 5;
      return { pass, actual: `actions=${exp.recommended_actions.length}, source=${exp.source}` };
    }
  },
  {
    id: 'TC-P08', req: 'FR5.1', kind: 'positive', backendOnly: false,
    title: 'Status endpoint returns correct schema',
    expected: 'HTTP 200 with satellite_id, status, risk_score, active_threats',
    run: async () => {
      resetDB();
      await apiSimulateScenario('EOS-1', 'unauthorized_command');
      const res = await apiGetStatus('EOS-1');
      const b = res.body;
      const pass = res.code === 200 && b.satellite_id === 'EOS-1' && b.risk_score > 0 && b.active_threats >= 1;
      return { pass, actual: `code=${res.code}, risk_score=${b.risk_score}, active_threats=${b.active_threats}` };
    }
  },
  {
    id: 'TC-P09', req: 'FR5.4 / FR5.5', kind: 'positive', backendOnly: false,
    title: 'Scenario injection is reflected on the live feed',
    expected: 'WS-style live listener receives the alert payload after POST /simulate/scenario',
    run: async () => {
      resetDB();
      let received = null;
      const unsub = subscribeLive((payload) => { received = payload; });
      await apiSimulateScenario('EOS-1', 'unauthorized_command');
      unsub();
      const pass = received !== null && received.type === 'alert';
      return { pass, actual: received ? `live push: type=${received.type}, severity=${received.data.severity}` : 'no push received' };
    }
  },
  {
    id: 'TC-P10', req: 'FR6.2 / FR6.3', kind: 'positive', backendOnly: false, analog: true,
    title: 'Dashboard renders alert and AI panel data contract',
    expected: 'Explanation fetched for the same risk_event_id the timeline would render is valid (open index.html to see the actual rendered UI)',
    run: async () => {
      resetDB();
      const sim = await apiSimulateScenario('EOS-1', 'unauthorized_command');
      const exp = await apiGetExplanation(sim.body.risk_event_id);
      const pass = exp.code === 200 && !!exp.body.summary;
      return { pass, actual: `explanation code=${exp.code}, source=${exp.body.source}` };
    }
  },

  // ---------------- NEGATIVE ----------------
  {
    id: 'TC-N01', req: 'FR5.1', kind: 'negative', backendOnly: false,
    title: 'Status request for nonexistent satellite',
    expected: 'HTTP 404, no partial/default data returned',
    run: async () => {
      try {
        await apiGetStatus('DOES-NOT-EXIST');
        return { pass: false, actual: 'No error thrown — expected 404' };
      } catch (err) {
        return { pass: err.code === 404, actual: `code=${err.code}, message="${err.message}"` };
      }
    }
  },
  {
    id: 'TC-N02', req: 'FR4.3', kind: 'negative', backendOnly: false,
    title: 'LLM API unavailable during explanation request',
    expected: 'Fallback templated explanation returned with source = FALLBACK_TEMPLATE',
    run: async () => {
      const risk = computeRisk(['AUTH_THRESHOLD_EXCEEDED']);
      const exp = buildExplanation(risk, {}, { forceFailure: true });
      return { pass: exp.source === 'FALLBACK_TEMPLATE', actual: `source = ${exp.source}` };
    }
  },
  {
    id: 'TC-N03', req: 'FR2.2', kind: 'negative', backendOnly: false,
    title: 'Detector receives malformed feature input',
    expected: 'Validation error thrown for missing command_frequency — not silently defaulted',
    run: async () => {
      try {
        applyRules({ auth_failures_count: 8, unknown_source: false }); // missing command_frequency
        return { pass: false, actual: 'No error thrown — expected validation error' };
      } catch (err) {
        return { pass: err.code === 'VALIDATION_ERROR', actual: `caught: ${err.message}` };
      }
    }
  },
  {
    id: 'TC-N04', req: 'FR5.4', kind: 'negative', backendOnly: false,
    title: 'Scenario injection with invalid scenario name',
    expected: 'HTTP 400, no event created',
    run: async () => {
      resetDB();
      const before = DB.events.length;
      try {
        await apiSimulateScenario('EOS-1', 'warp_drive_failure');
        return { pass: false, actual: 'No error thrown — expected 400' };
      } catch (err) {
        const noEventCreated = DB.events.length === before;
        return { pass: err.code === 400 && noEventCreated, actual: `code=${err.code}, events unchanged=${noEventCreated}` };
      }
    }
  },
  {
    id: 'TC-N05', req: 'FR3.3', kind: 'negative', backendOnly: false,
    title: 'Risk score at exact severity boundary',
    expected: '29→LOW, 30→MEDIUM, 59→MEDIUM, 60→HIGH, 79→HIGH, 80→CRITICAL',
    run: async () => {
      const cases = { 29: 'LOW', 30: 'MEDIUM', 59: 'MEDIUM', 60: 'HIGH', 79: 'HIGH', 80: 'CRITICAL' };
      const results = Object.entries(cases).map(([score, exp]) => {
        const actual = severityBand(Number(score));
        return { score, exp, actual, ok: actual === exp };
      });
      const pass = results.every(r => r.ok);
      return { pass, actual: results.map(r => `${r.score}→${r.actual}`).join(', ') };
    }
  },
  {
    id: 'TC-N06', req: 'FR6.4', kind: 'negative', backendOnly: false,
    title: 'Dashboard behavior when backend is unreachable',
    expected: 'apiGetStatus rejects with code 0 (network error) so the dashboard can trigger its fallback — open index.html and toggle "Simulate backend down" to see it live',
    run: async () => {
      STATE.backendDown = true;
      try {
        await apiGetStatus('EOS-1');
        return { pass: false, actual: 'No error thrown — expected network error' };
      } catch (err) {
        return { pass: err.code === 0, actual: `code=${err.code}, message="${err.message}"` };
      } finally {
        STATE.backendDown = false;
      }
    }
  },
  {
    id: 'TC-N07', req: 'FR5.5', kind: 'negative', backendOnly: false, analog: true,
    title: 'WebSocket connection drops mid-session (simplified analog)',
    expected: 'Unsubscribed listener receives nothing; resubscribed listener resumes receiving pushes cleanly',
    run: async () => {
      let count = 0;
      const unsub = subscribeLive(() => { count++; });
      unsub(); // simulate disconnect
      await apiSimulateScenario('EOS-2', 'pattern_shift');
      const countAfterDisconnect = count;
      subscribeLive(() => { count++; }); // simulate reconnect
      await apiSimulateScenario('EOS-2', 'frequency_spike');
      const pass = countAfterDisconnect === 0 && count === 1;
      return { pass, actual: `events while disconnected=${countAfterDisconnect}, events after reconnect=${count}` };
    }
  },
  {
    id: 'TC-N08', req: 'FR2.3', kind: 'negative', backendOnly: true,
    title: 'Inference attempted with missing model file',
    expected: 'Clear "model unavailable" error, API does not crash, no default score returned',
    note: 'Requires a real .joblib model file on disk — verify with backend/tests/test_detector.py'
  },
  {
    id: 'TC-N09', req: 'FR1.2', kind: 'negative', backendOnly: false, analog: true,
    title: 'Scenario injection with no ground stations configured (simplified analog)',
    expected: 'Graceful config error thrown, not an unhandled exception',
    run: async () => {
      try {
        injectScenario(null, 'unauthorized_command'); // no satellite/ground-station context
        return { pass: false, actual: 'No error thrown — expected config error' };
      } catch (err) {
        return { pass: err.code === 'CONFIG_ERROR', actual: `caught: ${err.message}` };
      }
    }
  },
  {
    id: 'TC-N10', req: 'FR5.3', kind: 'negative', backendOnly: false,
    title: 'Explanation requested for event with no associated alert',
    expected: 'HTTP 404 — no fabricated explanation for a non-alerted event',
    run: async () => {
      try {
        await apiGetExplanation('nonexistent-risk-event-id');
        return { pass: false, actual: 'No error thrown — expected 404' };
      } catch (err) {
        return { pass: err.code === 404, actual: `code=${err.code}, message="${err.message}"` };
      }
    }
  }
];

function $(id) { return document.getElementById(id); }

function renderTestCard(tc) {
  const card = document.createElement('div');
  card.className = 'tc-card';
  card.id = `card-${tc.id}`;
  const badgeClass = tc.backendOnly ? 'backend' : 'pending';
  const badgeText = tc.backendOnly ? 'Backend required' : 'Not run';
  card.innerHTML = `
    <div class="tc-top">
      <div>
        <div class="tc-id">${tc.id}</div>
        <div class="tc-title">${tc.title}</div>
        <div class="tc-req">${tc.req}</div>
      </div>
      <div class="tc-badge ${badgeClass}" id="badge-${tc.id}">${badgeText}</div>
    </div>
    <div class="tc-detail"><span class="lbl">Expected:</span>${tc.expected}</div>
    ${tc.note ? `<div class="tc-note">${tc.note}</div>` : ''}
    ${tc.analog ? `<div class="tc-note">Simplified browser analog of the real backend module — good for demoing the logic, not a substitute for the Python test.</div>` : ''}
    <div class="tc-actual" id="actual-${tc.id}"></div>
    ${!tc.backendOnly ? `<div class="tc-run"><button id="run-${tc.id}">Run test</button></div>` : ''}
  `;
  return card;
}

async function runTest(tc) {
  const badge = $(`badge-${tc.id}`);
  const actual = $(`actual-${tc.id}`);
  badge.textContent = 'Running…';
  badge.className = 'tc-badge pending';
  try {
    const result = await tc.run();
    badge.textContent = result.pass ? 'PASS' : 'FAIL';
    badge.className = `tc-badge ${result.pass ? 'pass' : 'fail'}`;
    actual.textContent = `Actual: ${result.actual}`;
    actual.className = 'tc-actual show';
    return result.pass;
  } catch (err) {
    badge.textContent = 'FAIL';
    badge.className = 'tc-badge fail';
    actual.textContent = `Unexpected error: ${err.message}`;
    actual.className = 'tc-actual show';
    return false;
  }
}

function updateSummary() {
  const runnable = TEST_CASES.filter(t => !t.backendOnly);
  const passed = runnable.filter(t => $(`badge-${t.id}`).textContent === 'PASS').length;
  const failed = runnable.filter(t => $(`badge-${t.id}`).textContent === 'FAIL').length;
  $('summaryText').innerHTML = `<span class="summary-stat"><b>${runnable.length}</b> runnable</span><span class="summary-stat"><b>${passed}</b> passed</span><span class="summary-stat"><b>${failed}</b> failed</span><span class="summary-stat"><b>${TEST_CASES.length - runnable.length}</b> backend-only</span>`;
}

window.addEventListener('DOMContentLoaded', () => {
  const posList = $('positiveList');
  const negList = $('negativeList');
  TEST_CASES.forEach(tc => {
    const card = renderTestCard(tc);
    (tc.kind === 'positive' ? posList : negList).appendChild(card);
    if (!tc.backendOnly) {
      $(`run-${tc.id}`).onclick = async () => { await runTest(tc); updateSummary(); };
    }
  });
  updateSummary();

  $('btnRunAll').onclick = async () => {
    resetDB();
    for (const tc of TEST_CASES) {
      if (!tc.backendOnly) await runTest(tc);
    }
    resetDB();
    updateSummary();
  };
});
