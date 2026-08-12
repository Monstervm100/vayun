"""Explainable AI Module (XAI-FR-01..06).

Turns a model prediction into a human-readable, weighted explanation.
"""
from __future__ import annotations

import pandas as pd


def explain(sample: dict) -> list[tuple[str, int]]:
    """XAI-FR-01/02/03: per-prediction explanation as (factor, weight%).

    TODO: compute with SHAP/LIME over the real model & feature vector.
    Placeholder matches the SRD's worked example.
    """
    return [
        ("Suspicious URL behavior", 40),
        ("Urgency language", 30),
        ("Credential request", 20),
        ("Sender anomaly", 10),
    ]


def global_feature_importance() -> pd.DataFrame:
    """XAI-FR-04: mean |SHAP| feature importance across the dataset."""
    # TODO: compute from a trained model with shap.
    return pd.DataFrame(
        [
            {"Feature": "domain_age",   "Importance": 0.192},
            {"Feature": "urgency_score", "Importance": 0.146},
            {"Feature": "url_length",   "Importance": 0.115},
            {"Feature": "has_cred_kw",  "Importance": 0.092},
            {"Feature": "spf_fail",     "Importance": 0.061},
        ]
    )
