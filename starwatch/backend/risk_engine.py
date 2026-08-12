"""
risk_engine.py — implements FR3.1, FR3.2, FR3.3 (SRD Module 3)
Design reference: STARWATCH_Design_Document.md Section 3.3
Mirrors frontend-demo/js/riskEngine.js exactly -- keep RULE_POINTS in sync.
"""

RULE_POINTS = {
    "AUTH_THRESHOLD_EXCEEDED": 30,
    "UNKNOWN_SOURCE": 25,
    "COMMAND_FREQUENCY_EXCEEDED": 35,
}


def severity_band(score: int) -> str:
    """FR3.3 -- boundaries verified by TC-N05."""
    if score >= 80:
        return "CRITICAL"
    if score >= 60:
        return "HIGH"
    if score >= 30:
        return "MEDIUM"
    return "LOW"


def compute_risk(rule_flags: list) -> dict:
    """FR3.1, FR3.2 -- pure function, fully deterministic."""
    factors = [{"factor": f, "points": RULE_POINTS[f]} for f in rule_flags]
    score = min(100, sum(f["points"] for f in factors))
    return {
        "risk_score": score,
        "severity": severity_band(score),
        "contributing_factors": factors,
    }
