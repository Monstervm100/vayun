// demoData.js — implements the FR6.4 static fallback dataset.
// NOTE: this is deliberately an inline JS object rather than a fetched .json
// file. A bundled data/demo-data.json is also included in this repo (for
// parity with the real backend's future static-export format), but this demo
// intentionally avoids fetch() for it so the dashboard still works when
// opened directly via file:// — some browsers block fetch() of local JSON
// under file:// due to CORS, which would break the very fallback path this
// file exists to demonstrate. In the real React build (served over http),
// swap this for an actual fetch('/demo-data.json').

const DEMO_DATA = {
  risk_score: 86,
  severity: 'CRITICAL',
  active_threats: 2,
  latestRisk: {
    description: 'Unauthorized command activity detected',
    severity: 'CRITICAL',
    contributing_factors: [
      { factor: 'AUTH_THRESHOLD_EXCEEDED', points: 30 },
      { factor: 'UNKNOWN_SOURCE', points: 25 },
      { factor: 'COMMAND_FREQUENCY_EXCEEDED', points: 35 }
    ]
  },
  timeline: [
    { kind: 'event', timestamp: '09:00', event_type: 'TELEMETRY_UPLOAD', source: 'GROUND_STATION_A', authentication: 'SUCCESS' },
    { kind: 'event', timestamp: '09:15', event_type: 'AUTH_ATTEMPT', source: 'UNKNOWN', authentication: 'FAILURE' },
    { kind: 'risk', timestamp: '09:18', risk_event_id: 'demo-cached-alert', risk_score: 86, severity: 'CRITICAL', description: 'Security alert generated (cached)' }
  ]
};
