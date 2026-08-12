// simulator.js — implements FR1.1, FR1.2, FR1.3
// Browser-side stand-in for backend/simulator.py. Scenario profiles here are
// tuned to intentionally cross the rule thresholds in rules.js, exactly like
// the SRD §9 "Suspicious Behavior Simulation" examples.

const SCENARIO_PROFILES = {
  unauthorized_command: {
    // Trips all three rules (auth > 5, unknown source, cmd freq > 50) so the
    // flagship attack scores 90 = CRITICAL, per TC-P08's "active CRITICAL
    // alert" precondition and the seed comment in dashboard.js.
    auth_failures_count: 15, unknown_source: true, command_frequency: 120,
    time_anomaly_flag: 0, data_transfer_volume_sum: 2, avg_source_trust_score: 0.1,
    unique_unknown_sources_count: 1,
    description: '15 failed authentication attempts and a command flood from an unknown source'
  },
  frequency_spike: {
    auth_failures_count: 1, unknown_source: false, command_frequency: 300,
    time_anomaly_flag: 0, data_transfer_volume_sum: 40, avg_source_trust_score: 0.8,
    unique_unknown_sources_count: 0,
    description: 'Command frequency 300/hr vs. 5/hr baseline'
  },
  pattern_shift: {
    auth_failures_count: 2, unknown_source: false, command_frequency: 10,
    time_anomaly_flag: 1, data_transfer_volume_sum: 8, avg_source_trust_score: 0.85,
    unique_unknown_sources_count: 0,
    description: 'Communication occurring outside scheduled comm window'
  }
};

// FR1.2 — throws a 400-style error for unknown scenario names (TC-N04)
function injectScenario(satelliteId, scenario) {
  // FR1.2 / TC-N09 analog: no satellite/ground-station context configured
  if (!satelliteId) {
    const err = new Error('No ground stations configured for this satellite — cannot inject scenario');
    err.code = 'CONFIG_ERROR';
    throw err;
  }
  const profile = SCENARIO_PROFILES[scenario];
  if (!profile) {
    const err = new Error(`Invalid scenario '${scenario}'. Valid scenarios: ${Object.keys(SCENARIO_PROFILES).join(', ')}`);
    err.code = 400;
    throw err;
  }
  return { satellite_id: satelliteId, scenario, ...profile };
}

// FR1.1 — normal event generator, always within comm window (time_anomaly_flag = 0)
function generateNormalWindow(satelliteId) {
  return {
    satellite_id: satelliteId, auth_failures_count: 0, unknown_source: false,
    command_frequency: 4, time_anomaly_flag: 0, data_transfer_volume_sum: 5,
    avg_source_trust_score: 0.95, unique_unknown_sources_count: 0,
    description: 'Normal scheduled telemetry uplink'
  };
}
