# STARWATCH — Test Plan & Traceability Document

**Companion to:** STARWATCH System Requirement Document (SRD) v1.0
**Scope:** Functional test cases for the simulator, detection engine, risk engine, AI explanation layer, API, and dashboard
**Convention:** Every test case ID maps to one SRD Functional Requirement ID (e.g. `FR2.2`) so results can be traced directly back to the requirement it verifies — useful both for your own QA discipline and as evidence of rigor in a research writeup.

---

## 1. Positive Test Cases (expected/valid behavior)

| TC ID | SRS Req ID | Title | Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| TC-P01 | FR1.1 | Simulator generates scheduled normal events | Run `simulator.py` in batch mode for a 24h simulated window with default comm-window config | Events generated only within configured comm windows; `event_type` distribution matches normal profile (telemetry, scheduled commands) | High |
| TC-P02 | FR1.3 | Batch mode writes correct volume to CSV + DB | Run simulator with `mode=batch, n=5000` | Exactly 5,000 rows written to `satellite_events.csv` AND identical row count present in SQLite `satellite_events` table | High |
| TC-P03 | FR2.1 | Rule-based pre-filter flags known violation | Feed an event window with `auth_failures_count = 8` (threshold = 5) | Rule-based flag `AUTH_THRESHOLD_EXCEEDED` is set before ML scoring runs | High |
| TC-P04 | FR2.2 | Isolation Forest flags injected anomaly | Inject `frequency_spike` scenario (300 cmds/hr vs. 5 baseline) via simulator, run through `anomaly_detector.py` | Anomaly score returned in [0,1] and score ≥ 0.7 for the injected window | High |
| TC-P05 | FR3.1 / FR3.2 | Risk engine computes correct score and factor breakdown | Feed risk engine a fixed input: auth_failures flag on, unknown_source on, command_spike on | Output `risk_score = 90`, `severity = "CRITICAL"`, and `contributing_factors` array contains exactly the 3 expected entries with correct point values | High |
| TC-P06 | FR3.3 | Severity threshold mapping is correct mid-range | Feed risk engine a score of 65 | `severity` returned as `"HIGH"` (60–79 band) | Medium |
| TC-P07 | FR4.2 | AI explanation returns complete structured output | Call `explainer.py` with a CRITICAL risk engine output | Response includes non-empty summary, likely cause, and 3–5 recommended actions, matching the schema in SRD §4 Module 4 | High |
| TC-P08 | FR5.1 | Status endpoint returns correct schema | `GET /satellites/EOS-1/status` for a satellite with an active CRITICAL alert | HTTP 200; response includes `satellite_id`, `status`, `risk_score`, `active_threats` fields with correct current values | High |
| TC-P09 | FR5.4 / FR5.5 | Scenario injection is reflected on the live feed | `POST /simulate/scenario {"scenario":"unauthorized_command"}`, then listen on `WS /live` | New event and resulting alert are pushed over the WebSocket within 2 seconds of the POST | High |
| TC-P10 | FR6.2 / FR6.3 | Dashboard renders alert and opens AI panel | Trigger an alert end-to-end, click the alert in the Timeline UI | Timeline entry renders with correct severity color; AI Explanation drawer opens and displays the matching `/alerts/{id}/explanation` content | Medium |

---

## 2. Negative Test Cases (invalid input / failure / edge behavior)

| TC ID | SRS Req ID | Title | Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| TC-N01 | FR5.1 | Status request for nonexistent satellite | `GET /satellites/DOES-NOT-EXIST/status` | HTTP 404 with a clear error body — no 500, no partial/default data returned | High |
| TC-N02 | FR4.3 | LLM API unavailable during explanation request | Simulate LLM API timeout/error, then trigger an alert requiring explanation | System returns the templated fallback explanation; API responds 200, not 500; dashboard shows no visible error state | High |
| TC-N03 | FR2.2 | Detector receives malformed feature input | Send an event window missing `command_frequency` (required feature) to `anomaly_detector.py` | Detector raises a caught, logged validation error — does not silently substitute a default value or crash the pipeline | High |
| TC-N04 | FR5.4 | Scenario injection with invalid scenario name | `POST /simulate/scenario {"scenario":"warp_drive_failure"}` | HTTP 400 with message listing valid scenario names; no event is created | Medium |
| TC-N05 | FR3.3 | Risk score at exact severity boundary | Feed risk engine scores of exactly 29, 30, 59, 60, 79, 80 | 29→LOW, 30→MEDIUM, 59→MEDIUM, 60→HIGH, 79→HIGH, 80→CRITICAL — no off-by-one errors at boundaries | Medium |
| TC-N06 | FR6.4 | Dashboard behavior when backend is unreachable | Stop the FastAPI backend, load the dashboard | Dashboard detects failed connection and falls back to static demo dataset — no blank screen, no unhandled fetch error in console | High |
| TC-N07 | FR5.5 | WebSocket connection drops mid-session | Establish `WS /live` connection, then forcibly kill it server-side | Client detects disconnect and attempts reconnection; no duplicate or lost events once reconnected | Medium |
| TC-N08 | FR2.3 | Inference attempted with missing model file | Delete/rename the persisted `.joblib` model file, then trigger detection | System returns a clear "model unavailable" error/log — does not crash the API process or silently return a default anomaly score | High |
| TC-N09 | FR1.2 | Scenario injection with no ground stations configured | Set `ground_stations = []` in simulator config, inject `unauthorized_command` scenario | Simulator logs a configuration error and exits/skips gracefully — does not throw an unhandled exception | Low |
| TC-N10 | FR5.3 | Explanation requested for event with no associated alert | `GET /alerts/{event_id}/explanation` where `event_id` is a valid but non-alerted normal event | HTTP 404 or empty result — system must NOT fabricate an explanation for an event that was never flagged | High |

---

## 3. Mock Test Data Strategy

You need three distinct tiers of test data, because "realistic random data" and "precise edge-case data" solve different problems.

### Tier 1 — Bulk realistic data (for positive-path and ML training tests)
Use your own `simulator.py` in batch mode with a **fixed random seed** — don't reach for an external tool like Faker here, since your simulator already knows the correct schema and realistic satellite-comm patterns (comm windows, trust scores, etc.), and a fixed seed makes every test run reproducible.

```bash
python simulator.py --mode batch --n 5000 --seed 42 --out datasets/test_normal.csv
python simulator.py --mode batch --n 5000 --seed 42 --scenario unauthorized_command --out datasets/test_anomaly_auth.csv
python simulator.py --mode batch --n 5000 --seed 42 --scenario frequency_spike --out datasets/test_anomaly_freq.csv
python simulator.py --mode batch --n 5000 --seed 42 --scenario pattern_shift --out datasets/test_anomaly_pattern.csv
```
Same seed + same scenario = identical dataset every time, which is what lets TC-P02 and TC-P04 above give a deterministic pass/fail rather than a flaky one.

### Tier 2 — Hand-crafted fixture files (for negative/edge tests)
These must be small, exact, and version-controlled — not generated — because negative tests need precise, deliberately-broken inputs, not statistically plausible ones.

```
tests/fixtures/
  malformed_event_missing_field.json     → TC-N03
  boundary_risk_scores.json              → TC-N05  (scores: 29,30,59,60,79,80)
  invalid_scenario_request.json          → TC-N04
  event_with_no_alert.json               → TC-N10
  empty_ground_stations_config.json      → TC-N09
```
Write these by hand, once, and keep them tiny (1–5 records each). Precision matters more than volume here.

### Tier 3 — API/integration mocks (for testing without live dependencies)
- Use `pytest` fixtures with `unittest.mock` to fake the LLM API response for TC-P07 and TC-N02, so your test suite doesn't burn API quota or depend on network access to pass.
- Use FastAPI's built-in `TestClient` for all `/satellites`, `/events`, `/alerts`, `/simulate` endpoint tests — it runs the app in-process, so no server needs to be running.
- For the WebSocket tests (TC-P09, TC-N07), `TestClient` also supports a `websocket_connect()` context manager — no external tooling needed.

### Suggested repo location
```
STARWATCH/
├── tests/
│   ├── fixtures/          ← Tier 2 hand-crafted edge cases
│   ├── test_simulator.py
│   ├── test_detector.py
│   ├── test_risk_engine.py
│   ├── test_explainer.py
│   ├── test_api.py
│   └── test_plan.md       ← this document
└── datasets/
    └── test_*.csv         ← Tier 1 seeded bulk data (gitignore if large, or keep if small enough to version)
```

This structure also gives you a clean "Testing" section to point to in your GitHub README and research writeup — a `tests/` folder with clear tiering is a strong, low-effort credibility signal for reviewers skimming your repo.
