# ThreatLens — Open-Source Cyber Threat Intelligence Research Platform

A miniature cyber-security lab that doesn't just detect phishing — it **explains** it:
why an email is malicious, which indicators triggered detection, what attacker
techniques were used, and how people can recognise similar attacks.

## What's in this folder

| Item | Description |
|---|---|
| [`threatlens-web/`](threatlens-web/) | **The runnable product** — zero-install HTML/JS app with live phishing feed, explainable verdicts, learning content, and an in-browser test runner (20/20). Start here. |
| [`threatlens-streamlit/`](threatlens-streamlit/) | Python/Streamlit reference scaffold (the planned V1 research platform). |
| `ThreatLens.pdf` | Original project concept document. |
| `ThreatLens_System_Requirements_Document.docx` | SRD — component-by-component requirements. |
| `ThreatLens_Design_Document.docx` | SDD — architecture & design, traceable to the SRD. |
| `ThreatLens_Test_Cases.docx` | 10 positive + 10 negative test cases mapped to requirement IDs. |

## Quick start (web app)

```bash
cd threatlens-web
python server.py          # full features incl. live phishing feed
# then open http://localhost:8000
```

Or just open `threatlens-web/index.html` in a browser (offline mode).

📖 New users: read [`threatlens-web/USER_GUIDE.md`](threatlens-web/USER_GUIDE.md) —
a screen-by-screen walkthrough. Developers: [`threatlens-web/README.md`](threatlens-web/README.md).

## Highlights

- **Explainable AI** — every verdict shows weighted factors (SHAP-style) in plain language
- **Live threat intelligence** — pulls real phishing URLs from OpenPhish/URLhaus, refreshed monthly by a GitHub Action
- **Education-first** — knowledge base, glossary, age-group awareness guide, protection checklist
- **Self-testing** — 10 positive + 10 negative test cases run live in the browser
- **Zero cost** — no paid libraries, no recurring fees, runs anywhere
