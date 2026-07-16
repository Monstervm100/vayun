# STARWATCH

AI-assisted cybersecurity monitoring for simulated satellite communications.
A digital-twin research prototype -- not connected to any real satellite,
ground station, or NASA system.

**Live demo:** `https://<your-github-username>.github.io/<repo-name>/`
*(update this link after enabling GitHub Pages -- see "Hosting" below)*

This is an open-source proof of concept (MIT licensed) -- try to break it,
and tell us what you find! Open a GitHub Issue with bugs, ideas, or feedback.

## Try it right now (no install, no server)

Open `frontend-demo/index.html` directly in a browser (double-click it, or
right-click → Open with → your browser). This is a **fully working demo**:
a browser-based mock backend implements the exact same logic described in
`documentation/STARWATCH_Design_Document.md` (same rule thresholds, same
risk-scoring formula, same API contracts), so you can click "🚨 Hacker sends
a fake command" and watch a real detection → risk-scoring → AI
explanation pipeline run in front of you.

Open `frontend-demo/test-console.html` to run the actual positive and
negative test cases from `documentation/STARWATCH_Test_Plan.md` live in the
browser, each one tagged with the SRD requirement ID it verifies.

## Folder structure

```
STARWATCH/
├── README.md                    ← you are here
│
├── frontend-demo/                ← FULLY WORKING, navigable HTML/CSS/JS demo
│   ├── index.html                 Mission dashboard (FR6.1-FR6.4)
│   ├── test-console.html          Runnable +ve/-ve test cases (Test Plan)
│   ├── real-world.html            Real documented satellite attacks (with sources) + prevention guide
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── mockData.js            In-memory DB matching Design Doc §2.1 schema
│   │   ├── demoData.js            FR6.4 static fallback dataset
│   │   ├── rules.js                FR2.1 rule engine
│   │   ├── riskEngine.js          FR3.1-FR3.3 risk scoring
│   │   ├── simulator.js           FR1.1-FR1.3 scenario generator
│   │   ├── explainer.js           FR4.1-FR4.3 AI explanation (+ fallback)
│   │   ├── mockApi.js             FR5.1-FR5.6 mock FastAPI layer
│   │   ├── dashboard.js           Wires index.html to the pipeline above
│   │   └── testConsole.js         Runs the Test Plan's TC-P/TC-N cases
│   └── data/
│       └── demo-data.json         JSON mirror of demoData.js (future real-fetch use)
│
├── backend/                      ← Phase 1-4 real Python implementation (stubs)
│   ├── simulator.py                mirrors frontend-demo/js/simulator.js
│   ├── rules.py                    mirrors frontend-demo/js/rules.js
│   ├── anomaly_detector.py         real Isolation Forest goes here
│   ├── risk_engine.py              mirrors frontend-demo/js/riskEngine.js
│   ├── explainer.py                mirrors frontend-demo/js/explainer.js
│   ├── api.py                      real FastAPI app
│   ├── schemas.py                  Pydantic models
│   ├── db.py                       SQLite setup
│   └── train_model.py              Isolation Forest training script
│
├── datasets/                     ← generated CSVs go here (not included)
│
├── tests/                        ← pytest suite, stubbed and mapped to Test Plan
│   ├── fixtures/
│   ├── test_simulator.py
│   ├── test_detector.py
│   ├── test_risk_engine.py         (only file with real, runnable assertions
│   │                                 right now -- pure functions, no deps)
│   ├── test_explainer.py
│   └── test_api.py
│
├── research/                     ← for your paper/writeup
│   ├── problem_statement.md
│   ├── methodology.md
│   └── results.md
│
└── documentation/
    ├── STARWATCH_SRD.md            what the system must do
    ├── STARWATCH_Design_Document.md how each module is built (FR-tagged)
    └── STARWATCH_Test_Plan.md      test cases proving it works (FR-tagged)
```

## Why the demo works without a real backend

`frontend-demo/js/mockApi.js` implements the same six endpoints as the real
`backend/api.py` will, with the same status codes and the same latency-like
behavior, backed by a browser-side JS reimplementation of `rules.py`,
`risk_engine.py`, `simulator.py`, and `explainer.py`. This means:

- Every button you click in `index.html` runs the *real* detection logic
  described in the Design Document -- not a hardcoded fake.
- Every test case in `test-console.html` is a genuine assertion against that
  logic, not a scripted animation.
- When you're ready to build the real Python backend, the JS files are your
  reference implementation -- port the same thresholds and formulas over
  (each JS file has a comment pointing at its Python counterpart).

Two test cases (TC-P02, TC-N08) genuinely can't be verified in a browser --
they depend on real file-system/CSV/SQLite behavior and a real `.joblib`
model file. Those are marked "Backend required" in the test console and
stubbed in `tests/test_simulator.py` / `tests/test_detector.py` for when the
real backend exists.

## Hosting (zero cost)

The demo is 100% static HTML/CSS/JS, so GitHub Pages hosts it for free:

1. Push this repository to GitHub.
2. On GitHub: **Settings → Pages → Source: Deploy from a branch →
   Branch: `main`, folder: `/ (root)` → Save**.
3. After ~1 minute your site is live at
   `https://<your-username>.github.io/<repo-name>/` (the root `index.html`
   forwards straight to the dashboard).
4. Paste that URL into the "Live demo" line at the top of this README.

## Tracking visitors (free, privacy-friendly)

The demo ships with a GoatCounter snippet commented out at the bottom of
`frontend-demo/index.html`. GoatCounter's free tier counts page views without
cookies and without storing personal data, so no consent banner is needed and
nothing has to run on your machine.

1. Sign up at <https://www.goatcounter.com> and pick a code (e.g. `starwatch`).
2. In `frontend-demo/index.html`, replace `MYCODE` with that code and remove
   the `<!--` and `-->` around the `<script>` tag.
3. Copy the same block into `test-console.html` and `real-world.html` to count
   those pages too.
4. Your visitor dashboard lives at `https://<yourcode>.goatcounter.com`.

Note that counting only works on the public GitHub Pages URL, not on a
`file://` copy.

## Saved sessions

Each visitor's events, alerts, and selected satellite are stored in their own
browser via `localStorage` (see `saveSession()` / `loadSession()` in
`frontend-demo/js/mockData.js`). Someone who leaves and returns the next day
resumes exactly where they stopped, and sees a "Welcome back" banner; the
"Restart demo" button deletes the saved session.

This is per-browser and per-device, and it is deliberate: it needs no server,
no accounts, and no personal data, which keeps hosting free and privacy simple.
Syncing one person's progress across their phone and laptop would require the
real backend (`backend/api.py`) plus user accounts — that's a Phase 2 concern,
not something the static demo should pretend to do.

## Next steps

1. Implement `backend/simulator.py` for real (Phase 1) -- the JS version in
   `frontend-demo/js/simulator.js` is your spec.
2. Train the real Isolation Forest with `backend/train_model.py`.
3. Build `backend/api.py` to match the contracts already exercised by
   `frontend-demo/js/mockApi.js`.
4. Swap the demo's `js/*` mock modules for real `fetch()` calls to that API --
   at that point `index.html` becomes your real (or React-ported) dashboard.
