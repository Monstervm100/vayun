// mockApi.js — implements FR5.1 through FR5.6
// Simulates the FastAPI backend from Design Doc §3.5: same endpoints, same
// status codes, same error semantics, with artificial latency so the UI
// behaves like it's really talking to a network service. STATE.backendDown
// simulates the network being unreachable at all (used for FR6.4 / TC-N06).

function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

function networkErrorIfDown() {
  if (STATE.backendDown) {
    const e = new Error('Network error: backend unreachable');
    e.code = 0;
    throw e;
  }
}

function subscribeLive(cb) {
  _liveListeners.push(cb);
  return () => {
    const i = _liveListeners.indexOf(cb);
    if (i > -1) _liveListeners.splice(i, 1);
  };
}

function publishLive(payload) {
  _liveListeners.forEach(cb => cb(payload));
}

// FR5.1 (TC-P08, TC-N01)
async function apiGetStatus(satelliteId) {
  await delay(200);
  networkErrorIfDown();
  const sat = DB.satellites[satelliteId];
  if (!sat) {
    const e = new Error(`Satellite '${satelliteId}' not found`);
    e.code = 404;
    throw e;
  }
  const risks = DB.riskEvents.filter(r => r.satellite_id === satelliteId);
  const latest = risks[risks.length - 1];
  return {
    code: 200,
    body: {
      satellite_id: satelliteId,
      status: sat.status,
      risk_score: latest ? latest.risk_score : 0,
      active_threats: risks.filter(r => r.severity === 'HIGH' || r.severity === 'CRITICAL').length
    }
  };
}

// FR5.2
async function apiGetEvents({ satellite_id, limit = 50 } = {}) {
  await delay(150);
  networkErrorIfDown();
  const ev = DB.events.filter(e => !satellite_id || e.satellite_id === satellite_id);
  return { code: 200, body: ev.slice(-limit) };
}

// FR5.3 (TC-N10)
async function apiGetExplanation(riskEventId) {
  await delay(150);
  networkErrorIfDown();
  const exp = DB.explanations[riskEventId];
  if (!exp) {
    const e = new Error('No explanation found for this event');
    e.code = 404;
    throw e;
  }
  return { code: 200, body: exp };
}

// FR5.4 + FR5.5 (TC-P09, TC-N04)
async function apiSimulateScenario(satelliteId, scenario) {
  await delay(300);
  networkErrorIfDown();

  let win;
  try {
    win = scenario === 'normal' ? generateNormalWindow(satelliteId) : injectScenario(satelliteId, scenario);
  } catch (err) {
    err.code = err.code || 400;
    throw err;
  }

  const flags = applyRules(win);
  const risk = computeRisk(flags);
  const riskEventId = uuid();
  const nowTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  DB.events.push({
    event_id: uuid(), satellite_id: satelliteId, event_type: 'COMMAND',
    source: win.unknown_source ? 'UNKNOWN' : 'GROUND_STATION_A',
    authentication: win.unknown_source ? 'FAILURE' : 'SUCCESS',
    data_volume_mb: win.data_transfer_volume_sum, command_type: 'ORBIT_ADJUST',
    source_trust_score: win.avg_source_trust_score, timestamp: nowTime, label: null
  });

  if (risk.contributing_factors.length > 0) {
    DB.riskEvents.push({
      risk_event_id: riskEventId, satellite_id: satelliteId, ...risk,
      description: win.description, timestamp: nowTime, created_at: new Date().toISOString()
    });
    const explanation = buildExplanation(risk, win, { forceFailure: STATE.llmFailure });
    DB.explanations[riskEventId] = explanation;
    DB.satellites[satelliteId].status = 'WARNING';
    publishLive({ type: 'alert', data: { risk_event_id: riskEventId, satellite_id: satelliteId, ...risk, timestamp: nowTime } });
  } else {
    DB.satellites[satelliteId].status = 'NOMINAL';
    publishLive({ type: 'event', data: { satellite_id: satelliteId, timestamp: nowTime } });
  }

  return {
    code: 202,
    body: { risk_event_id: risk.contributing_factors.length ? riskEventId : null, ...risk }
  };
}
