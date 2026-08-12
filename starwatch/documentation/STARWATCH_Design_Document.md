# STARWATCH — System Design Document (SDD)

**Companion to:** STARWATCH SRD v1.0 and Test Plan v1.0
**Purpose:** Translate each SRD functional requirement into concrete design — module structure, data schemas, API contracts, and data flow — so implementation has zero ambiguity.
**Traceability convention:** Every design element below is tagged `[Traces: FRx.x]` linking back to the SRD requirement it implements. Use these same tags as comments in code (`# Implements FR2.2`) to keep the chain unbroken from requirement → design → code → test case.

---

## 1. Architecture-to-Module Map

This is the SRD's Section 2 diagram, restated as a concrete file/module map:

| SRD Module | File(s) | Traces to |
|---|---|---|
| Simulator | `backend/simulator.py` | FR1.1–FR1.3 |
| Detection Engine | `backend/anomaly_detector.py`, `backend/rules.py` | FR2.1–FR2.4 |
| Risk Scoring Engine | `backend/risk_engine.py` | FR3.1–FR3.3 |
| AI Explanation Layer | `backend/explainer.py` | FR4.1–FR4.3 |
| Backend API | `backend/api.py`, `backend/schemas.py`, `backend/db.py` | FR5.1–FR5.6 |
| React Dashboard | `frontend/react-dashboard/src/*` | FR6.1–FR6.4 |

Data flows strictly left-to-right through this table — no module reaches backward into an earlier stage. This is the core architectural rule: **each module is a pure transformation with one input schema and one output schema**, which is what makes the Section 7 testing strategy possible (you can unit-test any module by feeding it a fixed input and asserting the output, without standing up the whole pipeline).

---

## 2. Data Design

### 2.1 Database schema (SQLite → same DDL portable to future DynamoDB migration)
`[Traces: FR-Section 3.1 data schema, FR5.1–FR5.3]`

```sql
CREATE TABLE satellite_events (
    event_id TEXT PRIMARY KEY,
    satellite_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK(event_type IN
        ('TELEMETRY_UPLOAD','COMMAND','AUTH_ATTEMPT','DATA_DOWNLINK')),
    source TEXT NOT NULL,
    authentication TEXT NOT NULL CHECK(authentication IN ('SUCCESS','FAILURE')),
    data_volume_mb REAL,
    command_type TEXT,
    source_trust_score REAL,
    timestamp TEXT NOT NULL,
    label TEXT CHECK(label IN ('NORMAL','ANOMALOUS') OR label IS NULL)
);

CREATE TABLE risk_events (
    risk_event_id TEXT PRIMARY KEY,
    satellite_id TEXT NOT NULL,
    window_start TEXT NOT NULL,
    window_end TEXT NOT NULL,
    anomaly_score REAL NOT NULL,
    risk_score INTEGER NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    contributing_factors TEXT NOT NULL,  -- JSON array, see 2.3
    created_at TEXT NOT NULL
);

CREATE TABLE alert_explanations (
    risk_event_id TEXT PRIMARY KEY REFERENCES risk_events(risk_event_id),
    summary TEXT NOT NULL,
    likely_cause TEXT NOT NULL,
    recommended_actions TEXT NOT NULL,  -- JSON array of strings
    source TEXT NOT NULL CHECK(source IN ('LLM','FALLBACK_TEMPLATE')),
    generated_at TEXT NOT NULL
);

CREATE INDEX idx_events_satellite_time ON satellite_events(satellite_id, timestamp);
CREATE INDEX idx_risk_satellite_time ON risk_events(satellite_id, window_end);
```

Note `alert_explanations.source` — this is what makes TC-N02 (LLM fallback) auditable. Every explanation on record says whether it came from the real LLM or the template fallback, so you can report a "fallback rate" metric in your research writeup.

### 2.2 Derived feature vector (in-memory, not persisted per-event)
`[Traces: FR2.2, SRD §3.2]`

```python
@dataclass
class FeatureWindow:
    satellite_id: str
    window_start: datetime
    window_end: datetime
    auth_failures_count: int
    command_frequency: float          # commands/hour
    avg_source_trust_score: float
    data_transfer_volume_sum: float
    time_anomaly_flag: int            # 0 or 1
    unique_unknown_sources_count: int

    def to_array(self) -> list[float]:
        """Ordered vector for model input — order must match training."""
        return [
            self.auth_failures_count,
            self.command_frequency,
            self.avg_source_trust_score,
            self.data_transfer_volume_sum,
            self.time_anomaly_flag,
            self.unique_unknown_sources_count,
        ]
```

### 2.3 Contributing factors JSON shape
`[Traces: FR3.2]`

```json
[
  {"factor": "auth_failures", "points": 30},
  {"factor": "unknown_source", "points": 25},
  {"factor": "command_spike", "points": 35}
]
```

---

## 3. Module Design

### 3.1 Simulator — `simulator.py`
`[Traces: FR1.1–FR1.3]`

```python
class SatelliteSimulator:
    def __init__(self, satellite_id: str, comm_windows: list[tuple[int,int]], seed: int):
        ...

    def generate_normal_stream(self, n: int) -> list[dict]:
        """FR1.1 — events only within configured comm windows."""

    def inject_scenario(self, scenario: Literal["unauthorized_command","frequency_spike","pattern_shift"]) -> list[dict]:
        """FR1.2 — deterministic anomaly injection for demo control."""

    def run_batch(self, n: int, out_csv: str, out_db: str) -> None:
        """FR1.3 (batch mode)."""

    def run_stream(self, interval_sec: float, on_event: Callable[[dict], None]) -> None:
        """FR1.3 (streaming mode) — calls on_event() per tick, used by the WebSocket layer."""
```

**Design decision:** `inject_scenario` returns a plain list of event dicts rather than writing directly to the DB — keeps the simulator decoupled from persistence, so the same method is reusable for both batch training-data generation and the live demo feed (FR5.4 calls this directly).

### 3.2 Detection Engine — `rules.py` + `anomaly_detector.py`
`[Traces: FR2.1–FR2.4]`

```python
# rules.py
def apply_rules(window: FeatureWindow) -> list[str]:
    """FR2.1 — cheap, explainable pre-filter. Returns list of fired rule names."""
    flags = []
    if window.auth_failures_count > AUTH_FAILURE_THRESHOLD:
        flags.append("AUTH_THRESHOLD_EXCEEDED")
    if window.command_frequency > COMMAND_FREQ_THRESHOLD:
        flags.append("COMMAND_FREQUENCY_EXCEEDED")
    return flags

# anomaly_detector.py
class AnomalyDetector:
    def __init__(self, model_path: str):
        self.model = joblib.load(model_path)   # FR2.3 — raises FileNotFoundError if missing (TC-N08)
        self.scaler = joblib.load(model_path.replace(".joblib","_scaler.joblib"))

    def score(self, window: FeatureWindow) -> float:
        """FR2.2 — returns normalized anomaly score in [0,1]."""
        x = self.scaler.transform([window.to_array()])
        raw = self.model.decision_function(x)[0]
        return normalize_score(raw)  # map sklearn's raw output to [0,1]

    def detect(self, window: FeatureWindow) -> DetectionResult:
        """FR2.4 — combines rule flags + ML score into one result object."""
        return DetectionResult(
            rule_flags=apply_rules(window),
            anomaly_score=self.score(window),
        )
```

**Design decision:** rules run first and unconditionally (not short-circuited by the ML step) — FR2.4 requires both signals logged together even when only one fires. This also means a missing/corrupt model file (TC-N08) degrades the system to rule-only detection rather than a hard crash, if you choose to catch the `FileNotFoundError` at the `detect()` call site — flagging this as an implementation choice for you to confirm you want that graceful degradation, versus failing loudly. Given this is a portfolio/research project, failing loudly with a clear logged error is probably the better choice so your evaluation metrics aren't silently degraded — recommend catching it only at the API layer (FR5.x), not inside the detector itself.

### 3.3 Risk Scoring Engine — `risk_engine.py`
`[Traces: FR3.1–FR3.3]`

```python
RULE_POINTS = {
    "AUTH_THRESHOLD_EXCEEDED": 30,
    "UNKNOWN_SOURCE": 25,
    "COMMAND_FREQUENCY_EXCEEDED": 35,
}

def compute_risk(detection: DetectionResult) -> RiskEvent:
    """FR3.1 — pure function, fully deterministic, no ML/LLM involved here."""
    factors = [{"factor": f, "points": RULE_POINTS[f]} for f in detection.rule_flags]
    score = min(100, sum(f["points"] for f in factors))
    return RiskEvent(
        risk_score=score,
        severity=severity_band(score),   # FR3.3
        contributing_factors=factors,     # FR3.2
    )

def severity_band(score: int) -> str:
    """FR3.3 — boundaries verified by TC-N05."""
    if score >= 80: return "CRITICAL"
    if score >= 60: return "HIGH"
    if score >= 30: return "MEDIUM"
    return "LOW"
```

### 3.4 AI Explanation Layer — `explainer.py`
`[Traces: FR4.1–FR4.3]`

```python
class Explainer:
    def explain(self, risk_event: RiskEvent) -> Explanation:
        """FR4.1 — input is the structured RiskEvent, never raw event logs."""
        prompt = build_prompt(risk_event)  # grounded template, not free-form
        try:
            response = call_llm_api(prompt, timeout=5)
            return parse_llm_response(response)   # FR4.2 schema
        except (TimeoutError, APIError):
            return fallback_template(risk_event)   # FR4.3 — TC-N02
```

**Design decision:** `build_prompt` only ever receives fields already computed by the risk engine (rule names, points, severity) — never raw event rows. This bounds what the LLM can talk about to things you've already verified deterministically, which is the actual mechanism behind your "explainable AI" claim: the LLM explains verified facts in plain language, it doesn't independently decide what's suspicious.

### 3.5 Backend API — `api.py`
`[Traces: FR5.1–FR5.6]`

| Endpoint | Method | Traces | Success | Failure |
|---|---|---|---|---|
| `/satellites/{id}/status` | GET | FR5.1 | 200 + status schema | 404 unknown satellite (TC-N01) |
| `/events` | GET | FR5.2 | 200 + list, supports `satellite_id`, `limit` query params | 200 + empty list if none |
| `/alerts/{event_id}/explanation` | GET | FR5.3 | 200 + explanation | 404 if event has no associated risk_event (TC-N10) |
| `/simulate/scenario` | POST | FR5.4 | 202 + created event summary | 400 invalid scenario name (TC-N04) |
| `/live` | WS | FR5.5 | pushes `{type: "event"\|"alert", data: {...}}` frames | auto-reconnect handled client-side (TC-N07) |
| `/docs` | GET | FR5.6 | auto-generated by FastAPI, no custom code needed | — |

### 3.6 React Dashboard component tree
`[Traces: FR6.1–FR6.4]`

```
<App>
 ├── <TopBar />                     -- FR6.1 overall status
 ├── <SatelliteRail satellites={} /> -- satellite selector
 ├── <MainPanel>
 │    ├── <RiskGauge score={} />
 │    └── <EventTimeline events={} onSelect={} />  -- FR6.2, color-coded by severity
 └── <AIDrawer alertId={} />        -- FR6.3, fetches /alerts/{id}/explanation on open
```

**Data source abstraction (`useDataSource` hook)** `[Traces: FR6.4]`:
```javascript
function useDataSource() {
  const [live, setLive] = useState(true);
  // Tries WebSocket connection; on failure/timeout, falls back to
  // static JSON fixture bundled in /public/demo-data.json
  // This single hook is what every component reads from — components
  // never know or care whether data is live or demo.
}
```
This single abstraction point is the cleanest way to satisfy FR6.4 without scattering fallback logic across every component.

---

## 4. Sequence Flow — end-to-end alert (ties FR1→FR6 together)

```
Simulator.inject_scenario()          [FR1.2]
        │  event dict
        ▼
DB write + feature window compute
        │
        ▼
AnomalyDetector.detect()             [FR2.1, FR2.2, FR2.4]
        │  DetectionResult (rule_flags + score)
        ▼
compute_risk()                       [FR3.1, FR3.2, FR3.3]
        │  RiskEvent (score, severity, factors)
        ▼
   ┌────┴────┐
   │         │
Persist   Broadcast over WS          [FR5.5]
to DB         │
   │          ▼
   │     Dashboard EventTimeline updates   [FR6.2]
   │
User clicks alert
   │          ▼
GET /alerts/{id}/explanation         [FR5.3]
   │          ▼
Explainer.explain()                  [FR4.1, FR4.2, FR4.3]
   │          ▼
AIDrawer renders explanation         [FR6.3]
```

---

## 5. Error Handling & Logging Design

| Layer | Strategy |
|---|---|
| Simulator | Config validation errors logged and raised at startup, not mid-run (TC-N09) |
| Detector | Missing/corrupt model file raises a typed `ModelUnavailableError`, caught only at API layer (TC-N08) |
| Risk Engine | Pure function — no I/O, no exceptions expected; malformed input caught upstream by schema validation (Pydantic) |
| Explainer | All LLM calls wrapped in try/except with a 5s timeout; failures always degrade to `fallback_template()`, never propagate (TC-N02) |
| API | Pydantic request/response models reject malformed input at the boundary before it reaches business logic (TC-N03, TC-N04) |
| Dashboard | `useDataSource` hook is the single fallback boundary; no component-level try/catch scattered around (TC-N06) |

---

## 6. Open Design Decisions for You to Confirm

1. **Detector failure mode** (Section 3.2): fail loudly at the API layer vs. silently degrade to rule-only detection. Recommendation above is fail loudly + log, since silent degradation would quietly corrupt your evaluation metrics.
2. **WebSocket reconnection strategy**: simple fixed-interval retry vs. exponential backoff. For a demo app, fixed 2-second retry is simpler and sufficient — exponential backoff matters more at production scale than for this project.
3. **Contributing factors point table** (`RULE_POINTS` in 3.3) currently only covers 3 rules from the PRD's example — decide if you want additional rules (e.g., a `TIME_ANOMALY` flag contributing points) before you lock the training data generation, since the risk engine's factor list should match whatever rules the detector can actually fire.
