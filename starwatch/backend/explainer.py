"""
explainer.py — implements FR4.1, FR4.2, FR4.3 (SRD Module 4)
Design reference: STARWATCH_Design_Document.md Section 3.4
Mirrors frontend-demo/js/explainer.js for the fallback path.
"""


def fallback_template(risk_event: dict) -> dict:
    """FR4.3 -- TC-N02. Always available, never throws."""
    return {
        "summary": "Automated analysis is temporarily unavailable. Showing standard guidance based on the computed risk factors.",
        "likely_cause": "Unable to generate a live AI explanation at this time.",
        "recommended_actions": [
            "Review the contributing factors listed above",
            "Escalate to mission operations for manual review",
            "Re-attempt automated analysis shortly",
        ],
        "source": "FALLBACK_TEMPLATE",
    }


def build_prompt(risk_event: dict) -> str:
    """FR4.1 -- only ever receives the risk engine's structured output, never raw events."""
    raise NotImplementedError("TODO: Phase 4")


class Explainer:
    def explain(self, risk_event: dict) -> dict:
        """FR4.1, FR4.2, FR4.3."""
        prompt = build_prompt(risk_event)
        try:
            # TODO Phase 4: call_llm_api(prompt, timeout=5)
            raise NotImplementedError("TODO: wire real LLM call")
        except Exception:
            return fallback_template(risk_event)
