"""Human Manipulation / Behavioral Analyzer (HM-FR-01..06).

Detects the psychological techniques an attacker uses in a sample.
"""
from __future__ import annotations

from threatlens.config import MANIPULATION_TECHNIQUES


def analyze(sample: dict) -> dict[str, bool]:
    """HM-FR-01/02: detect manipulation techniques present in a sample.

    TODO: implement lexicon/ML detection with evidence spans (HM-FR-03).
    Placeholder marks fear/urgency/authority as present.
    """
    present = {"fear", "urgency", "authority"}
    return {t: (t in present) for t in MANIPULATION_TECHNIQUES}
