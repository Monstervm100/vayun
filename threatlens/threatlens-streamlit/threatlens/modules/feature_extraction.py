"""Feature Extraction Pipeline (FE-FR-01..07).

Converts a raw sample into a structured feature vector across three domains:
email, URL, and behavioral.
"""
from __future__ import annotations

from threatlens.config import FEATURE_GROUPS


def extract(sample: dict) -> dict[str, float]:
    """FE-FR-01/02/03/04: produce a feature vector for one sample.

    TODO: implement real extraction (sender domain, URL features via tldextract,
    behavioral cues, etc.). Placeholder returns illustrative values.
    """
    return {
        "sender_domain": 1.0,
        "language_pattern": 0.8,
        "keyword_score": 0.7,
        "grammar_score": 0.4,
        "domain_age_days": 3,
        "url_length": 64,
        "suspicious_pattern": 1.0,
        "urgency_score": 0.9,
        "authority_impersonation": 1.0,
        "fear_tactic": 0.8,
    }


def feature_docs() -> dict[str, list[str]]:
    """FE-FR-06: documented feature groups (a published deliverable)."""
    return dict(FEATURE_GROUPS)
