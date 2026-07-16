"""Threat Intelligence Engine (TI-FR-01..07).

Extracts IOCs and correlates individual samples into campaigns.
"""
from __future__ import annotations

import pandas as pd


def extract_iocs(sample: dict) -> dict[str, str]:
    """TI-FR-01: extract indicators of compromise from a sample.

    TODO: parse real headers/URLs. Placeholder returns illustrative IOCs.
    """
    return {
        "sender": sample.get("sender", "it-support@secure-mail-verify.co"),
        "domain": "secure-mail-verify[.]co · age 3d",
        "url": "hxxp://sec-login[.]co/verify?id=…",
        "subject": sample.get("subject", "Account suspended within 24 hours"),
        "spf": "fail",
        "brand": "impersonates: Microsoft 365",
    }


def get_campaigns() -> pd.DataFrame:
    """TI-FR-04/06: campaign groupings for the Campaign View timeline."""
    # TODO: correlate real samples by shared IOC / infrastructure / wording.
    return pd.DataFrame(
        [
            {"Campaign": "CMP-0041", "First seen": "2026-06-28", "Samples": 312,
             "Type": "CRED", "Shared IOC": "secure-mail-verify[.]co"},
            {"Campaign": "CMP-0039", "First seen": "2026-06-14", "Samples": 188,
             "Type": "BEC", "Shared IOC": "203.0.113.44"},
            {"Campaign": "CMP-0036", "First seen": "2026-05-30", "Samples": 241,
             "Type": "CRED", "Shared IOC": "login-account[.]info"},
        ]
    )


def get_trend() -> pd.DataFrame:
    """Weekly attack-volume trend for the Campaign View chart."""
    # TODO: aggregate real collected_at timestamps.
    return pd.DataFrame(
        {"week": list(range(1, 10)),
         "samples": [104, 96, 100, 128, 122, 158, 152, 190, 214]}
    ).set_index("week")
