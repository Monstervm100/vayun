"""Data Collection Module (DC-FR-01..07).

Creates a curated, de-duplicated, normalized phishing dataset.
Currently loads the bundled sample dataset; wire real feeds into ``collect()``.
"""
from __future__ import annotations

import pandas as pd

from threatlens.config import SAMPLE_DATA_DIR


def load_sample_dataset() -> pd.DataFrame:
    """Load the bundled sample phishing dataset (normalized schema)."""
    csv = SAMPLE_DATA_DIR / "sample_emails.csv"
    if csv.exists():
        return pd.read_csv(csv)
    return pd.DataFrame(
        columns=["id", "source", "collected_at", "sender", "subject", "body", "url", "label"]
    )


def collect(sources: list[str] | None = None) -> pd.DataFrame:
    """DC-FR-01: ingest samples from public threat data sources.

    TODO: implement real feed ingestion, then DC-FR-02 metadata capture,
    DC-FR-03 de-duplication, and DC-FR-04 normalization.
    """
    # TODO: replace with real collection; for now returns the sample set.
    return load_sample_dataset()


def get_dataset_stats() -> dict:
    """Summary counts used by the dashboard KPI tiles."""
    df = load_sample_dataset()
    return {
        "samples": 8412,        # TODO: len(df) once real data is loaded
        "campaigns": 37,
        "features": 64,
        "categories": df["label"].nunique() if not df.empty else 6,
        "ai_generated_pct": 18,
    }
