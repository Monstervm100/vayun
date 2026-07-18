"""
anomaly_detector.py — implements FR2.2, FR2.3, FR2.4 (SRD Module 2)
Design reference: STARWATCH_Design_Document.md Section 3.2

TODO Phase 2: train an IsolationForest on the derived feature set (SRD 3.2),
persist with joblib, and load it here. See train_model.py.
"""
import joblib


class ModelUnavailableError(Exception):
    pass


class AnomalyDetector:
    def __init__(self, model_path: str):
        try:
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(model_path.replace(".joblib", "_scaler.joblib"))
        except FileNotFoundError as e:
            # FR2.3 / TC-N08 -- caught here, not silently swallowed
            raise ModelUnavailableError(f"Model file not found: {model_path}") from e

    def score(self, window) -> float:
        """FR2.2 -- returns normalized anomaly score in [0,1]."""
        raise NotImplementedError("TODO: Phase 2")

    def detect(self, window):
        """FR2.4 -- combines rule flags + ML score into one result object."""
        raise NotImplementedError("TODO: Phase 2")
