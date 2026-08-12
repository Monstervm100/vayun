// mockData.js
// In-memory stand-in for the SQLite schema defined in the Design Document §2.1.
// This is the "Event Store" box from SRD §2, implemented in the browser so the
// dashboard is fully demoable without a running backend.

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
}

function seedDB() {
  return {
    satellites: {
      'EOS-1': { satellite_id: 'EOS-1', status: 'NOMINAL' },
      'EOS-2': { satellite_id: 'EOS-2', status: 'NOMINAL' },
      'COMSAT-3': { satellite_id: 'COMSAT-3', status: 'NOMINAL' }
    },
    events: [
      {
        event_id: uuid(), satellite_id: 'EOS-1', event_type: 'TELEMETRY_UPLOAD',
        source: 'GROUND_STATION_A', authentication: 'SUCCESS', data_volume_mb: 5,
        command_type: null, source_trust_score: 0.95, timestamp: '09:00', label: null
      }
    ],
    riskEvents: [],   // mirrors risk_events table, Design Doc §2.1
    explanations: {}  // mirrors alert_explanations table, keyed by risk_event_id
  };
}

window.DB = seedDB();
window.STATE = { backendDown: false, llmFailure: false };
window._liveListeners = [];

function resetDB() {
  window.DB = seedDB();
  window.STATE = { backendDown: false, llmFailure: false };
  window._liveListeners = [];
}

// ---------------------------------------------------------------------------
// Session persistence (browser localStorage)
//
// Stands in for what a real deployment would do with a user account + the
// SQLite store: keep each visitor's events so they can leave and come back.
// localStorage survives closing the tab, the browser, and rebooting, so a
// visitor returning the next day resumes exactly where they stopped.
//
// Deliberately NOT called from resetDB(): the test console calls resetDB()
// constantly while running its cases, and those runs must never overwrite a
// real visitor's saved dashboard session. Only dashboard.js persists.
// ---------------------------------------------------------------------------

const SESSION_KEY = 'starwatch_session_v1';

function saveSession(extra = {}) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      version: 1,
      savedAt: new Date().toISOString(),
      db: window.DB,
      ...extra
    }));
    return true;
  } catch (err) {
    // Private browsing or a full quota — the demo must still work, just
    // without memory between visits.
    console.warn('STARWATCH: could not save session —', err.message);
    return false;
  }
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    // Reject sessions written by an older, incompatible schema rather than
    // rendering half-broken data.
    if (saved.version !== 1 || !saved.db || !saved.db.satellites) return null;
    window.DB = saved.db;
    return saved;
  } catch (err) {
    console.warn('STARWATCH: saved session unreadable, starting fresh —', err.message);
    return null;
  }
}

function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch (err) { /* nothing to clear */ }
}
