"""Reporting, Publication & Dataset Export (REP-FR-01..06).

Packages platform outputs into shareable research artifacts.
"""
from __future__ import annotations

import json

import pandas as pd

from threatlens.config import TAXONOMY
from threatlens.modules import data_collection


def export_dataset_csv() -> bytes:
    """REP-FR-01: export the curated dataset as CSV bytes (for st.download_button)."""
    df = data_collection.load_sample_dataset()
    return df.to_csv(index=False).encode("utf-8")


def export_taxonomy_json() -> bytes:
    """REP-FR-02: export the threat taxonomy as JSON bytes."""
    return json.dumps(TAXONOMY, indent=2).encode("utf-8")


def build_report() -> bytes:
    """REP-FR-03: generate a technical report.

    TODO: render a real PDF/Markdown report of findings & model performance.
    Placeholder returns a short Markdown summary.
    """
    text = "# ThreatLens Report\n\nPlaceholder — findings and model performance go here.\n"
    return text.encode("utf-8")
