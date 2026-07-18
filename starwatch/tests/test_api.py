"""
Covers TC-P08, TC-P09, TC-P10, TC-N01, TC-N04, TC-N06, TC-N07, TC-N10
from STARWATCH_Test_Plan.md. Uses FastAPI's TestClient (in-process, no
server needs to be running).
"""
import pytest
# from fastapi.testclient import TestClient
# from backend.api import app
# client = TestClient(app)

def test_status_endpoint_schema():
    """TC-P08 (FR5.1)"""
    pytest.skip("TODO: implement once api.py is built")

def test_status_unknown_satellite_404():
    """TC-N01 (FR5.1)"""
    pytest.skip("TODO")

def test_scenario_injection_invalid_name_400():
    """TC-N04 (FR5.4)"""
    pytest.skip("TODO")

def test_explanation_for_non_alerted_event_404():
    """TC-N10 (FR5.3)"""
    pytest.skip("TODO")
