"""Machine Learning Engine (ML-FR-01..07).

Trains, evaluates, and compares classification models. Heavy ML libraries are
imported lazily inside ``train()`` so the dashboard runs before they're installed.
"""
from __future__ import annotations

import pandas as pd


def predict(sample: dict) -> dict:
    """ML-FR-01/02: classify a single sample.

    TODO: load a persisted trained model and run inference.
    Placeholder returns an illustrative high-confidence phishing verdict.
    """
    return {
        "prediction": "Phishing — Credential Theft",
        "confidence": 0.92,
        "model": "XGBoost",
        "model_agreement": "3 of 4 models agree",
        "is_phishing": True,
    }


def get_model_comparison() -> pd.DataFrame:
    """ML-FR-03/04: performance metrics across models (Research View)."""
    # TODO: populate from real cross-validated evaluation runs.
    return pd.DataFrame(
        [
            {"Model": "Logistic Regression", "Accuracy": 0.910, "Precision": 0.90, "Recall": 0.89},
            {"Model": "Random Forest",       "Accuracy": 0.947, "Precision": 0.94, "Recall": 0.93},
            {"Model": "XGBoost",             "Accuracy": 0.963, "Precision": 0.96, "Recall": 0.95},
            {"Model": "Neural Network",      "Accuracy": 0.951, "Precision": 0.95, "Recall": 0.94},
        ]
    )


def train(dataset: pd.DataFrame):
    """ML-FR-01/04/05: train and compare models with reproducible splits.

    TODO: implement. Sketch of the intended flow (lazy imports keep the UI light):

        from sklearn.model_selection import train_test_split
        from sklearn.ensemble import RandomForestClassifier
        from xgboost import XGBClassifier
        ...
    """
    raise NotImplementedError("Model training not yet implemented (ML-FR-01).")
