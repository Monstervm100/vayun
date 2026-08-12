"""
Covers TC-P05, TC-P06, TC-N05 from STARWATCH_Test_Plan.md.
Pure functions -- easiest tests to write, do these first.
"""
from backend.risk_engine import compute_risk, severity_band

def test_risk_score_and_factors():
    """TC-P05 (FR3.1 / FR3.2)"""
    risk = compute_risk(["AUTH_THRESHOLD_EXCEEDED", "UNKNOWN_SOURCE", "COMMAND_FREQUENCY_EXCEEDED"])
    assert risk["risk_score"] == 90
    assert risk["severity"] == "CRITICAL"
    assert len(risk["contributing_factors"]) == 3

def test_severity_mid_range():
    """TC-P06 (FR3.3)"""
    assert severity_band(65) == "HIGH"

def test_severity_boundaries():
    """TC-N05 (FR3.3)"""
    assert severity_band(29) == "LOW"
    assert severity_band(30) == "MEDIUM"
    assert severity_band(59) == "MEDIUM"
    assert severity_band(60) == "HIGH"
    assert severity_band(79) == "HIGH"
    assert severity_band(80) == "CRITICAL"
