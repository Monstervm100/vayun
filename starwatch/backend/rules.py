"""
rules.py — implements FR2.1 (SRD Module 2)
Design reference: STARWATCH_Design_Document.md Section 3.2
Mirrors frontend-demo/js/rules.js -- keep thresholds in sync.
"""

AUTH_FAILURE_THRESHOLD = 5
COMMAND_FREQ_THRESHOLD = 50


def apply_rules(window) -> list:
    """FR2.1 -- cheap, explainable pre-filter. Returns list of fired rule names."""
    flags = []
    if window.auth_failures_count > AUTH_FAILURE_THRESHOLD:
        flags.append("AUTH_THRESHOLD_EXCEEDED")
    if getattr(window, "unknown_source", False):
        flags.append("UNKNOWN_SOURCE")
    if window.command_frequency > COMMAND_FREQ_THRESHOLD:
        flags.append("COMMAND_FREQUENCY_EXCEEDED")
    return flags
