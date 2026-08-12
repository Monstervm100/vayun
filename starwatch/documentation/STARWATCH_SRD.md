# STARWATCH — System Requirement Document (SRD)

**Project:** STARWATCH — AI-Assisted Cybersecurity Monitoring System for Satellite Communications
**Document Type:** System Requirement Document (technical companion to the Project Requirement Document)
**Version:** 1.0
**Author:** Darshan
**Status:** Draft for implementation

---

## 1. Purpose of This Document

The PRD defines *what* STARWATCH should do and *why*. This SRD defines *how* the system is built — exact modules, data contracts, APIs, model specs, and acceptance criteria. Every section here should be specific enough that you (or anyone else) could implement it without guessing.

---

## 2. System Architecture Overview

```
┌─────────────────────┐
│  Simulator Engine    │  Python — generates synthetic comm events
│  (simulator.py)      │
└──────────┬───────────┘
           │ writes
           ▼
┌─────────────────────┐
│  Event Store          │  SQLite (satellite_events table)
└──────────┬───────────┘
           │ read by
           ▼
┌─────────────────────┐
│  Detection Engine     │  Rule-based filters + Isolation Forest
│  (anomaly_detector.py)│
└──────────┬───────────┘
           │ produces anomaly_score, risk_flags
           ▼
┌─────────────────────┐
│  Risk Scoring Engine  │  Weighted scoring → 0-100 + severity
│  (risk_engine.py)     │
└──────────┬───────────┘
           │ produces RiskEvent
           ▼
┌─────────────────────┐
│  AI Explanation Layer │  LLM call → plain-language analyst report
│  (explainer.py)       │
└──────────┬───────────┘
           │ served via
           ▼
┌─────────────────────┐
│  FastAPI Backend       │  REST endpoints + WebSocket for live feed
│  (api.py)              │
└──────────┬───────────┘
           │ consumed by
           ▼
┌─────────────────────┐
│  React Dashboard       │  Mission Overview / Timeline / AI Panel
└─────────────────────┘
```

**Design principle:** each stage is a pure function/module with a well-defined input and output schema, so you can unit-test them independently and swap implementations (e.g., swap Isolation Forest for another model) without touching the rest of the pipeline.

---

## 3. Data Requirements

### 3.1 Core Event Schema (`satellite_events` table)

| Field | Type | Description |
|---|---|---|
| `event_id` | UUID | Primary key |
| `satellite_id` | string | e.g. `STARWATCH-EOS1` |
| `event_type` | enum | `TELEMETRY_UPLOAD`, `COMMAND`, `AUTH_ATTEMPT`, `DATA_DOWNLINK` |
| `source` | string | Ground station ID or `UNKNOWN` |
| `authentication` | enum | `SUCCESS`, `FAILURE` |
| `data_volume_mb` | float | Size of transmission |
| `command_type` | string, nullable | e.g. `ORBIT_ADJUST`, `SENSOR_CONFIG` |
| `timestamp` | ISO 8601 | Event time |
| `source_trust_score` | float 0–1 | Precomputed trust rating of the source |
| `label` | enum, nullable | `NORMAL` / `ANOMALOUS` — **only present in synthetic training data**, never in "live" simulated stream (this is what your model has to predict) |

### 3.2 Derived Feature Set (for ML)

Computed in a rolling window (e.g., last 60 minutes) per satellite:

- `auth_failures_count`
- `command_frequency` (commands/hour)
- `avg_source_trust_score`
- `data_transfer_volume_sum`
- `time_anomaly_flag` (1 if outside scheduled comm windows, else 0)
- `unique_unknown_sources_count`

### 3.3 Synthetic Dataset Generation Requirements

- Minimum 5,000 normal events, 300–500 labeled anomalous events (roughly 5–10% anomaly rate — realistic for anomaly detection and keeps Isolation Forest's contamination parameter meaningful).
- Anomalies must be generated from the 3 scenarios in the PRD (unauthorized command, frequency spike, pattern-of-life deviation) so you can report **per-scenario detection recall** later — this is a strong research-metrics story for reviewers.
- Store as `datasets/satellite_events.csv` AND load into SQLite for the live API demo.

---

## 4. Functional Requirements by Module

### Module 1 — Simulator (`simulator.py`)
- **FR1.1**: Generate normal event streams following a configurable schedule (e.g., comm windows every 90 min, matching a real LEO satellite pass cadence).
- **FR1.2**: Inject anomalies on demand via a `scenario` parameter (`unauthorized_command`, `frequency_spike`, `pattern_shift`) for demo control.
- **FR1.3**: Support both **batch mode** (write N events to CSV/DB for training) and **streaming mode** (emit one event every X seconds for the live dashboard demo).

### Module 2 — Detection Engine (`anomaly_detector.py`)
- **FR2.1**: Rule-based pre-filter flags obvious violations (e.g., `auth_failures_count > 5`) before ML scoring — cheap, explainable, catches known patterns.
- **FR2.2**: Isolation Forest model scores each event window on the 6 derived features, outputting an anomaly score in [0, 1] (via `decision_function` normalized).
- **FR2.3**: Model must be retrainable via a single script (`train_model.py`) and persisted with `joblib`.
- **FR2.4**: Log both rule-based flags and ML score together — this dual-layer design is your "explainability" story (rules explain *what* rule fired; ML catches *what rules missed*).

### Module 3 — Risk Scoring Engine (`risk_engine.py`)
- **FR3.1**: Deterministic point-based scoring (as in PRD section 9) — pure function, fully explainable, no black box.
- **FR3.2**: Output schema:
```json
{
  "risk_score": 90,
  "severity": "CRITICAL",
  "contributing_factors": [
    {"factor": "auth_failures", "points": 30},
    {"factor": "unknown_source", "points": 25},
    {"factor": "command_spike", "points": 35}
  ]
}
```
- **FR3.3**: Severity thresholds: 0–29 LOW, 30–59 MEDIUM, 60–79 HIGH, 80–100 CRITICAL (tune during testing).

### Module 4 — AI Explanation Layer (`explainer.py`)
- **FR4.1**: Take the risk engine's structured output (not raw events) as LLM input — keeps prompts small and grounded in real computed evidence, avoids hallucinated justifications.
- **FR4.2**: Output must include: plain-language summary, likely cause, and 3–5 recommended actions (matches PRD Module 4 example).
- **FR4.3**: Must handle LLM API failure gracefully — fall back to a templated explanation so the demo never breaks live.

### Module 5 — Backend API (`api.py`, FastAPI)
- **FR5.1**: `GET /satellites/{id}/status` — current status, latest risk score
- **FR5.2**: `GET /events?satellite_id=&limit=` — event timeline
- **FR5.3**: `GET /alerts/{event_id}/explanation` — AI explanation for a given alert
- **FR5.4**: `POST /simulate/scenario` — trigger a scenario injection (for live demo)
- **FR5.5**: `WS /live` — WebSocket pushing new events/alerts to the dashboard in real time
- **FR5.6**: OpenAPI docs auto-generated (FastAPI gives you this for free — mention it in your writeup, reviewers like seeing documented APIs)

### Module 6 — React Dashboard
- **FR6.1**: Mission Overview screen polls or subscribes via WebSocket for live status.
- **FR6.2**: Timeline screen renders chronological event list with color-coded severity.
- **FR6.3**: AI Explanation panel opens on alert click, calls `/alerts/{id}/explanation`.
- **FR6.4**: All three screens must work against a **static demo dataset fallback** if the backend isn't running — critical for a reliable live demo/interview situation.

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Explainability** | Every risk score must be traceable to specific contributing factors — no unexplained model outputs reach the dashboard |
| **Performance** | Detection pipeline (event → risk score) completes in <500ms per event for the live demo to feel real-time |
| **Reliability** | Dashboard must degrade gracefully (cached/demo data) if backend or LLM API is unavailable |
| **Reproducibility** | `train_model.py` + fixed random seed → same model + metrics every run (important for your research writeup) |
| **Portability** | Runs locally via `docker-compose up` or two terminal commands (`uvicorn` + `npm start`) — no cloud dependency required for demo |
| **Security scope honesty** | README must clearly state this is a simulated/synthetic environment, not connected to real satellite systems |

---

## 6. Machine Learning Specification

| Item | Spec |
|---|---|
| Algorithm | Isolation Forest (`sklearn.ensemble.IsolationForest`) |
| Input features | 6 derived features (Section 3.2), standardized with `StandardScaler` |
| Contamination param | Start at 0.05–0.10, tune against labeled validation set |
| Train/test split | 80/20, stratified by scenario type if possible |
| Baseline comparison | Compare against a simple rule-only baseline (Module 2 FR2.1) to demonstrate ML adds value — strong point for a research paper |
| Metrics to report | Accuracy, Precision, Recall, F1, False Positive Rate, per-scenario recall, detection latency |
| Explainability add-on | Report per-feature contribution using `IsolationForest`'s path length intuition, or layer in SHAP for a stronger "explainable AI" claim |

---

## 7. Testing Requirements

- **Unit tests**: risk_engine scoring logic, feature extraction functions (pure functions — easiest to test, do these first)
- **Integration tests**: simulator → detector → risk engine → explainer pipeline end-to-end on a fixed synthetic batch
- **Model evaluation tests**: automated script that reproduces your accuracy/precision/recall table from Section 6
- **API tests**: FastAPI's `TestClient` for each endpoint
- **Manual QA checklist**: full demo walkthrough (inject each of the 3 scenarios, confirm dashboard reflects correctly)

---

## 8. Documentation & GitHub Deliverables

Matches PRD Section 12 structure. Additions:
- `research/methodology.md` — should reference this SRD directly
- `research/results.md` — populated from Section 6/7 test outputs, include a confusion matrix image
- `architecture.png` — export of the diagram in Section 2
- README should include: problem statement, architecture diagram, how to run locally, sample screenshots, and an explicit "Ethical Scope & Disclaimer" section (ties to PRD Section 4)

---

## 9. Implementation Roadmap (maps to PRD's 4-week plan)

| Phase | Deliverable | This SRD section to build from |
|---|---|---|
| 1 | Simulator + synthetic dataset + SQLite schema | §3, §4 Module 1 |
| 2 | Detection engine + risk engine + trained model + metrics | §4 Modules 2–3, §6 |
| 3 | FastAPI backend + React dashboard | §4 Modules 5–6 |
| 4 | AI explanation layer, testing, docs, GitHub polish, demo video | §4 Module 4, §7, §8 |

---

## 10. Open Decisions (flag these for yourself before coding)

1. LLM provider for the explanation layer — Claude API vs. a local/open model (affects cost + offline demo reliability).
2. Whether to deploy a live hosted demo (e.g., Vercel + Render) or keep it local-only with a recorded demo video.
3. Whether to extend the risk engine with SHAP values now or note it as "future work" in your paper — SHAP adds real rigor but also real complexity for a first pass.
