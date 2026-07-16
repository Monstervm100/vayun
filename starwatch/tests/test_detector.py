"""
Covers TC-P03, TC-P04, TC-N03, TC-N08 from STARWATCH_Test_Plan.md.
"""
import pytest
# from backend.rules import apply_rules
# from backend.anomaly_detector import AnomalyDetector, ModelUnavailableError

def test_rule_flags_auth_failures():
    """TC-P03 (FR2.1)"""
    pytest.skip("TODO")

def test_isolation_forest_flags_injected_anomaly():
    """TC-P04 (FR2.2)"""
    pytest.skip("TODO: requires trained model -- run train_model.py first")

def test_malformed_feature_window_raises():
    """TC-N03 (FR2.2)"""
    pytest.skip("TODO")

def test_missing_model_file_raises_clear_error():
    """TC-N08 (FR2.3) -- see ModelUnavailableError"""
    pytest.skip("TODO")
