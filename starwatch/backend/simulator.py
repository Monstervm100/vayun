"""
simulator.py — implements FR1.1, FR1.2, FR1.3 (SRD Module 1)
Design reference: STARWATCH_Design_Document.md Section 3.1

This is the real Python implementation to build for Phase 1. The browser
demo at frontend-demo/js/simulator.js is a JS analog of this same logic --
port the SCENARIO_PROFILES and thresholds over when you implement this file
so both versions produce comparable results.
"""
from dataclasses import dataclass
from typing import Callable, Literal
import random


class SatelliteSimulator:
    def __init__(self, satellite_id: str, comm_windows: list, seed: int):
        self.satellite_id = satellite_id
        self.comm_windows = comm_windows
        self.rng = random.Random(seed)

    def generate_normal_stream(self, n: int) -> list:
        """FR1.1 -- events only within configured comm windows."""
        raise NotImplementedError("TODO: Phase 1")

    def inject_scenario(self, scenario: str) -> list:
        """FR1.2 -- deterministic anomaly injection for demo control."""
        raise NotImplementedError("TODO: Phase 1")

    def run_batch(self, n: int, out_csv: str, out_db: str) -> None:
        """FR1.3 (batch mode) -- see TC-P02."""
        raise NotImplementedError("TODO: Phase 1")

    def run_stream(self, interval_sec: float, on_event) -> None:
        """FR1.3 (streaming mode) -- called by the WebSocket layer (FR5.5)."""
        raise NotImplementedError("TODO: Phase 1")
