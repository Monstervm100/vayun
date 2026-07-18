// riskEngine.js — implements FR3.1, FR3.2, FR3.3
// Deterministic, pure — mirrors backend/risk_engine.py exactly (Design Doc §3.3).

const RULE_POINTS = {
  AUTH_THRESHOLD_EXCEEDED: 30,
  UNKNOWN_SOURCE: 25,
  COMMAND_FREQUENCY_EXCEEDED: 35
};

// FR3.3 — boundaries verified by TC-N05
function severityBand(score) {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 30) return 'MEDIUM';
  return 'LOW';
}

// FR3.1, FR3.2
function computeRisk(ruleFlags) {
  const factors = ruleFlags.map(f => ({ factor: f, points: RULE_POINTS[f] }));
  const score = Math.min(100, factors.reduce((s, f) => s + f.points, 0));
  return {
    risk_score: score,
    severity: severityBand(score),
    contributing_factors: factors
  };
}
