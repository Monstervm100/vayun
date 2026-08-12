# ThreatLens

**Open-Source Cyber Threat Intelligence Research Platform** — Version 1: Phishing Intelligence Platform.

ThreatLens transforms publicly available phishing data into explainable cyber threat
intelligence. It is not a phishing classifier — it's a miniature research laboratory:
*Detection → Understanding → Intelligence → Research.*

Built local-first, in Python, with **zero recurring cost** and no paid libraries.

---

## Quick start

```bash
# 1. (optional) create a virtual environment
python -m venv .venv && .venv\Scripts\activate      # Windows
# source .venv/bin/activate                         # macOS / Linux

# 2. install dependencies
pip install -r requirements.txt

# 3. run the dashboard
streamlit run app.py
```

Then open the URL Streamlit prints (default http://localhost:8501).

> **First run works immediately.** The app ships with a small sample dataset and
> illustrative placeholder outputs so every view renders before the ML models are
> implemented. Heavy ML libraries are imported lazily, so the UI runs even if
> `xgboost`/`shap` aren't installed yet.

### Run with Docker

```bash
docker build -t threatlens .
docker run -p 8501:8501 threatlens
```

---

## Project structure

```
threatlens/
├── app.py                       # Streamlit entry point + sidebar navigation
├── requirements.txt
├── Dockerfile
├── .streamlit/config.toml       # theme (teal accent, cool neutrals)
├── sample_data/sample_emails.csv
├── data/                        # local SQLite DB is written here (git-ignored)
└── threatlens/                  # the package
    ├── config.py                # paths, taxonomy, model list, features
    ├── db.py                    # SQLite schema + connection (local-first storage)
    ├── modules/                 # one file per SRD component (business logic)
    │   ├── data_collection.py       # DC-FR-*
    │   ├── taxonomy.py              # TT-FR-*
    │   ├── feature_extraction.py    # FE-FR-*
    │   ├── threat_intel.py          # TI-FR-*
    │   ├── human_manipulation.py    # HM-FR-*
    │   ├── ml_engine.py             # ML-FR-*
    │   ├── explainability.py        # XAI-FR-*
    │   └── reporting.py             # REP-FR-*
    └── ui/                      # the three dashboard views
        ├── style.py                 # shared CSS + render helpers
        ├── campaign_view.py         # DASH-FR-01
        ├── email_analysis_view.py   # DASH-FR-02
        └── research_view.py         # DASH-FR-03
```

## How it maps to the SRD

Each module carries the requirement IDs it implements in its docstring. The three
views map to the dashboard requirements (DASH-FR-01/02/03) and pull data from the
analysis modules. Everything currently returns **placeholder data marked with
`# TODO`** — replacing those bodies with real logic is the implementation roadmap.

## Implementation roadmap (suggested order)

1. **Data Collection** — load a real public phishing dataset into SQLite.
2. **Feature Extraction** — implement email/URL/behavioral features.
3. **ML Engine** — train & compare the four models with reproducible splits.
4. **Explainable AI** — wire SHAP/LIME to real predictions.
5. **Threat Intelligence** — real IOC extraction + campaign correlation.
6. **Human Manipulation** — lexicon/ML technique detection with evidence.
7. **Reporting** — real dataset/report/taxonomy exports.

## Deployment

- **Local-first (primary):** run on your machine via `pip` or Docker. Malicious
  samples stay local; full compute for training. $0 forever.
- **Free public demo (secondary):** push to **Hugging Face Spaces** or
  **Streamlit Community Cloud** as a shop-window. Free tier, no credit card.

## License

Intended for open-source release (see SRD deliverables). Add your chosen license here.
