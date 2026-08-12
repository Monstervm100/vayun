"""Threat Taxonomy Engine (TT-FR-01..06).

Structured, hierarchical classification of phishing threats.
"""
from __future__ import annotations

from threatlens.config import TAXONOMY


def get_taxonomy() -> dict[str, str]:
    """TT-FR-01/05: return the taxonomy as {category: description}."""
    return dict(TAXONOMY)


def classify(sample: dict) -> str:
    """TT-FR-03: assign a sample to a taxonomy category.

    TODO: implement rule/ML-based classification. Placeholder returns the
    sample's existing label or the most common category.
    """
    return sample.get("label", "Credential Theft")


def get_distribution() -> dict[str, float]:
    """Share of the dataset per category (for the Campaign View bars)."""
    # TODO: compute from real labeled data.
    return {
        "Credential Theft": 41,
        "Fake Login Page": 27,
        "Business Email Compromise": 16,
        "Financial Scam": 10,
        "Malware Delivery": 6,
    }
