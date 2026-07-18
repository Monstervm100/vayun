// dashboard.js — implements FR6.1, FR6.2, FR6.3, FR6.4
// This is the frontend equivalent of the useDataSource hook described in the
// Design Document §3.6: every render path checks for backendDown and falls
// back to demo behavior rather than showing a blank/broken screen.

let currentSatellite = 'EOS-1';

const EMPTY_DRAWER = '<div class="drawer-empty">No alert selected yet.<br><br>Click a red or orange alert in the timeline (step 3) and the AI\'s incident report will appear here.</div>';

function $(id) { return document.getElementById(id); }

function log(msg) {
  const el = $('logPanel');
  const line = document.createElement('div');
  const t = new Date().toLocaleTimeString();
  line.textContent = `[${t}] ${msg}`;
  el.prepend(line);
}

function setBanner(msg, type) {
  const b = $('banner');
  if (!msg) { b.className = 'banner'; b.textContent = ''; return; }
  b.className = `banner show ${type}`;
  b.textContent = msg;
}

function renderRail() {
  const rail = $('satelliteRail');
  rail.innerHTML = '';
  Object.keys(DB.satellites).forEach(id => {
    const sat = DB.satellites[id];
    const div = document.createElement('div');
    div.className = 'sat-item' + (id === currentSatellite ? ' active' : '');
    div.innerHTML = `<div class="name">${id}</div><div class="sub ${sat.status === 'NOMINAL' ? 'ok' : ''}">${sat.status === 'NOMINAL' ? 'Nominal' : 'Risk elevated'}</div>`;
    div.onclick = () => { currentSatellite = id; refreshAll(); persist(); };
    rail.appendChild(div);
  });
}

function renderGauge(score, severity) {
  const colorMap = { LOW: 'var(--green)', MEDIUM: 'var(--amber)', HIGH: 'var(--amber)', CRITICAL: 'var(--red)' };
  const color = colorMap[severity] || 'var(--green)';
  const circumference = 2 * Math.PI * 44;
  const offset = circumference * (1 - score / 100);
  $('gaugeArc').setAttribute('stroke', color);
  $('gaugeArc').setAttribute('stroke-dasharray', circumference.toFixed(1));
  $('gaugeArc').setAttribute('stroke-dashoffset', offset.toFixed(1));
  $('gaugeNum').textContent = score;
  $('gaugeNum').style.color = color;
}

function renderRiskMeta(status, latestRisk) {
  const sevPill = $('sevPill');
  const bgMap = { LOW: ['var(--green-bg)', 'var(--green)'], MEDIUM: ['var(--amber-bg)', 'var(--amber)'], HIGH: ['var(--amber-bg)', 'var(--amber)'], CRITICAL: ['var(--red-bg)', 'var(--red)'] };
  const sev = latestRisk ? latestRisk.severity : 'LOW';
  const [bg, fg] = bgMap[sev];
  sevPill.style.background = bg; sevPill.style.color = fg;
  sevPill.textContent = sev;
  $('riskTitle').textContent = latestRisk ? (latestRisk.description || 'Suspicious activity detected') : 'No active threats';
  $('riskDesc').textContent = latestRisk
    ? `Warning signs found: ${latestRisk.contributing_factors.map(f => f.factor).join(', ') || 'none'} · active alerts: ${status.active_threats}`
    : `${currentSatellite} is behaving normally — every message so far looks legitimate.`;
}

async function loadStatus() {
  try {
    const res = await apiGetStatus(currentSatellite);
    const risks = DB.riskEvents.filter(r => r.satellite_id === currentSatellite);
    const latest = risks[risks.length - 1];
    renderGauge(res.body.risk_score, latest ? latest.severity : 'LOW');
    renderRiskMeta(res.body, latest);
    setBanner(null);
    $('uplinkPill').textContent = 'Connected to satellites (simulated)';
    $('uplinkPill').className = 'pill';
  } catch (err) {
    if (err.code === 0) {
      // FR6.4 — fallback to bundled demo data, never a blank screen
      renderGauge(DEMO_DATA.risk_score, DEMO_DATA.severity);
      renderRiskMeta({ active_threats: DEMO_DATA.active_threats }, DEMO_DATA.latestRisk);
      setBanner('The server is unreachable — showing saved demo data so the screen never goes blank. (This is the "What if the server crashes?" safety feature.)', 'warn');
      $('uplinkPill').textContent = 'Server down — using saved data';
      $('uplinkPill').className = 'pill gray';
      log('GET /satellites/status → network error → fell back to demo dataset');
    } else if (err.code === 404) {
      setBanner(err.message, 'err');
      log(`GET /satellites/${currentSatellite}/status → 404: ${err.message}`);
    }
  }
}

async function renderTimeline() {
  const list = $('timelineList');
  list.innerHTML = '';
  let items;
  try {
    const evRes = await apiGetEvents({ satellite_id: currentSatellite, limit: 20 });
    const risks = DB.riskEvents.filter(r => r.satellite_id === currentSatellite);
    items = [
      ...evRes.body.map(e => ({ kind: 'event', timestamp: e.timestamp, ...e })),
      ...risks.map(r => ({ kind: 'risk', timestamp: r.timestamp, ...r }))
    ].sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
  } catch (err) {
    if (err.code === 0) {
      items = DEMO_DATA.timeline;
    } else { return; }
  }

  if (items.length === 0) {
    list.innerHTML = '<div class="empty-state">Nothing has happened to this satellite yet. Press one of the "Simulate an attack" buttons above to create some activity.</div>';
    return;
  }

  items.forEach((item, idx) => {
    const div = document.createElement('div');
    let cls = 'ok', title, sub;
    if (item.kind === 'risk') {
      cls = item.severity === 'CRITICAL' ? 'crit' : (item.severity === 'HIGH' || item.severity === 'MEDIUM' ? 'warn' : 'ok');
      title = item.description || 'Security alert generated';
      sub = `Danger score ${item.risk_score}/100 · ${item.severity} · click to read the AI's report →`;
    } else {
      title = item.event_type.replace(/_/g, ' ').toLowerCase();
      sub = `${item.source} · auth ${item.authentication.toLowerCase()}`;
    }
    div.className = `tl-item ${cls}` + (item.kind === 'risk' ? ' clickable' : '');
    div.innerHTML = `
      <div class="tl-time mono">${item.timestamp}</div>
      <div class="tl-dot-col"><div class="tl-dot"></div>${idx < items.length - 1 ? '<div class="tl-line"></div>' : ''}</div>
      <div class="tl-text"><div class="t1">${title}</div><div class="t2">${sub}</div></div>
    `;
    if (item.kind === 'risk') {
      div.onclick = () => openDrawer(item.risk_event_id);
    }
    list.appendChild(div);
  });
}

async function openDrawer(riskEventId) {
  const drawer = $('drawerContent');
  drawer.innerHTML = '<div class="drawer-empty">Loading AI analysis…</div>';
  try {
    const res = await apiGetExplanation(riskEventId);
    const exp = res.body;
    const riskEvent = DB.riskEvents.find(r => r.risk_event_id === riskEventId);
    const factorsHtml = (riskEvent ? riskEvent.contributing_factors : [])
      .map(f => `<div class="factor-row"><span class="fname">${f.factor}</span><span class="fval">+${f.points}</span></div>`).join('');
    const actionsHtml = exp.recommended_actions
      .map((a, i) => `<li><span>${String(i + 1).padStart(2, '0')}</span>${a}</li>`).join('');
    drawer.innerHTML = `
      <div class="block">
        <div class="k"><span>Summary</span><span class="source-badge ${exp.source}">${exp.source === 'LLM' ? 'AI' : 'Fallback'}</span></div>
        <div class="v">${exp.summary}</div>
      </div>
      <div class="block">
        <div class="k">Likely cause</div>
        <div class="v">${exp.likely_cause}</div>
      </div>
      ${factorsHtml ? `<div class="block"><div class="k">Contributing factors</div>${factorsHtml}</div>` : ''}
      <div class="block">
        <div class="k">Recommended actions</div>
        <ul class="actions">${actionsHtml}</ul>
      </div>
    `;
    log(`GET /alerts/${riskEventId.slice(0,8)}…/explanation → 200 (source: ${exp.source})`);
  } catch (err) {
    drawer.innerHTML = `<div class="drawer-empty">${err.code === 404 ? 'No explanation found for this event (404).' : 'Backend unreachable.'}</div>`;
    log(`GET /alerts/${riskEventId}/explanation → ${err.code}: ${err.message}`);
  }
}

async function refreshAll() {
  renderRail();
  await loadStatus();
  await renderTimeline();
}

async function runScenario(scenario) {
  try {
    const res = await apiSimulateScenario(currentSatellite, scenario);
    log(`POST /simulate/scenario {"scenario":"${scenario}"} → ${res.code} risk_score=${res.body.risk_score} severity=${res.body.severity}`);
    await refreshAll();
  } catch (err) {
    log(`POST /simulate/scenario {"scenario":"${scenario}"} → ${err.code}: ${err.message}`);
    setBanner(`${err.code} — ${err.message}`, 'err');
  }
  // Persist after both outcomes: a rejected scenario still leaves the visitor's
  // earlier work worth keeping.
  persist();
}

function persist() {
  saveSession({ currentSatellite });
  const el = $('sessionNote');
  if (el) el.textContent = 'Progress saved in this browser · just now';
}

// "3 hours ago" / "yesterday" reads better than a raw timestamp for a returning
// visitor deciding whether the data on screen is still theirs.
function humanAge(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

function wireControls() {
  $('btnUnauth').onclick = () => runScenario('unauthorized_command');
  $('btnFreq').onclick = () => runScenario('frequency_spike');
  $('btnPattern').onclick = () => runScenario('pattern_shift');
  $('btnInvalid').onclick = () => runScenario('warp_drive_failure'); // deliberately invalid — negative test
  $('btnNormal').onclick = () => runScenario('normal');

  $('toggleBackend').onchange = (e) => {
    STATE.backendDown = e.target.checked;
    log(`Backend down = ${STATE.backendDown}`);
    refreshAll();
  };
  $('toggleLLM').onchange = (e) => {
    STATE.llmFailure = e.target.checked;
    log(`LLM failure simulation = ${STATE.llmFailure}`);
  };
  $('btnReset').onclick = async () => {
    resetDB();
    clearSession();
    currentSatellite = 'EOS-1';
    $('toggleBackend').checked = false;
    $('toggleLLM').checked = false;
    $('drawerContent').innerHTML = EMPTY_DRAWER;
    setBanner(null);
    log('Demo reset — saved session deleted, in-memory DB cleared and reseeded');
    await apiSimulateScenario('EOS-1', 'unauthorized_command');
    await refreshAll();
    persist();
  };

  subscribeLive((payload) => {
    log(`WS /live push → ${JSON.stringify(payload)}`);
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  wireControls();
  $('drawerContent').innerHTML = EMPTY_DRAWER;

  const saved = loadSession();
  if (saved) {
    // Returning visitor: loadSession() has already restored window.DB.
    currentSatellite = DB.satellites[saved.currentSatellite] ? saved.currentSatellite : 'EOS-1';
    await refreshAll();
    const alerts = DB.riskEvents.length;
    setBanner(`👋 Welcome back — picking up where you left off (last visit ${humanAge(saved.savedAt)}). `
      + `${alerts} alert${alerts === 1 ? '' : 's'} restored. Press "↺ Restart demo" to start over.`, 'info');
    log(`Session restored from this browser — saved ${humanAge(saved.savedAt)}`);
  } else {
    // First-time visitor: seed one realistic CRITICAL alert by running the real
    // pipeline once, so the dashboard isn't empty on first open.
    await apiSimulateScenario('EOS-1', 'unauthorized_command');
    await refreshAll();
    log('Dashboard initialized — seeded EOS-1 with an unauthorized_command scenario');
    persist();
  }
});
