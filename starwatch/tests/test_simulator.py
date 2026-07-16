"""
Covers TC-P01, TC-P02, TC-N09 from STARWATCH_Test_Plan.md.
Run with: pytest tests/test_simulator.py
"""
import pytest
# from backend.simulator import SatelliteSimulator

def test_normal_events_within_comm_window():
    """TC-P01 (FR1.1)"""
    pytest.skip("TODO: implement once simulator.py is built")

def test_batch_mode_row_counts_match():
    """TC-P02 (FR1.3) -- CSV row count must equal SQLite row count"""
    pytest.skip("TODO: implement once simulator.py is built")

def test_scenario_injection_with_no_ground_stations():
    """TC-N09 (FR1.2) -- must fail gracefully, not crash"""
    pytest.skip("TODO: implement once simulator.py is built")
