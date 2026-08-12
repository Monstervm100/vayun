// rules.js — implements FR2.1 (rule-based pre-filter)
// Mirrors backend/rules.py from the Design Document §3.2 exactly, so the
// thresholds and rule names match what the real Python module will use.

const RULE_THRESHOLDS = {
  AUTH_FAILURES: 5,
  COMMAND_FREQ: 50
};

// FR2.2 (TC-N03): validates a feature window has all required fields before
// any rule or model touches it. A missing field is a caught, logged error —
// never silently defaulted.
function validateWindow(win) {
  const required = ['auth_failures_count', 'command_frequency', 'unknown_source'];
  const missing = required.filter(f => win[f] === undefined || win[f] === null);
  if (missing.length > 0) {
    const err = new Error(`FeatureWindow missing required field(s): ${missing.join(', ')}`);
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  return true;
}

function applyRules(win) {
  validateWindow(win);
  const flags = [];
  if (win.auth_failures_count > RULE_THRESHOLDS.AUTH_FAILURES) flags.push('AUTH_THRESHOLD_EXCEEDED');
  if (win.unknown_source) flags.push('UNKNOWN_SOURCE');
  if (win.command_frequency > RULE_THRESHOLDS.COMMAND_FREQ) flags.push('COMMAND_FREQUENCY_EXCEEDED');
  return flags;
}
