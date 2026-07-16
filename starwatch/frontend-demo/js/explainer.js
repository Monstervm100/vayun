// explainer.js — implements FR4.1, FR4.2, FR4.3
// This is a templated stand-in for the real LLM call in backend/explainer.py.
// It only ever receives the risk engine's structured output (never raw events),
// which is the actual mechanism behind the "explainable AI" claim in the SRD.
// Toggling STATE.llmFailure demonstrates the FR4.3 fallback path (TC-N02).

function buildExplanation(riskEvent, win, opts = {}) {
  if (opts.forceFailure) {
    // FR4.3 — templated fallback, always available, never throws
    return {
      summary: 'Automated analysis is temporarily unavailable. Showing standard guidance based on the computed risk factors.',
      likely_cause: 'Unable to generate a live AI explanation at this time.',
      recommended_actions: [
        'Review the contributing factors listed above',
        'Escalate to mission operations for manual review',
        'Re-attempt automated analysis shortly'
      ],
      source: 'FALLBACK_TEMPLATE'
    };
  }

  const factorNames = riskEvent.contributing_factors.map(f => f.factor);
  let cause = 'Communication pattern deviates from scheduled baseline';
  if (factorNames.includes('UNKNOWN_SOURCE') && factorNames.includes('AUTH_THRESHOLD_EXCEEDED')) {
    cause = 'Unauthorized command injection attempt';
  } else if (factorNames.includes('COMMAND_FREQUENCY_EXCEEDED')) {
    cause = 'Command frequency anomaly — possible flooding or misconfiguration';
  } else if (factorNames.includes('AUTH_THRESHOLD_EXCEEDED')) {
    cause = 'Repeated authentication failures — possible credential attack';
  }

  return {
    summary: `The satellite communication pattern differs significantly from normal behavior (risk score ${riskEvent.risk_score}/100, severity ${riskEvent.severity}).`,
    likely_cause: cause,
    recommended_actions: [
      'Verify communication source',
      'Restrict sensitive commands',
      'Require additional authentication',
      'Notify mission operations'
    ],
    source: 'LLM'
  };
}
