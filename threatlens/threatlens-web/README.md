# ThreatLens Web — Runnable HTML Product

A **fully working, zero-install** browser build of the ThreatLens CTI console:
navigable UI (front end) + a mock service/API layer (back end) + a mock database,
a **live test runner** for the SRD test cases, and a **monthly phishing-feed refresh** button.

No server, no build step, no dependencies — it runs by opening a file.

> 📖 **New to the app? Read [USER_GUIDE.md](USER_GUIDE.md)** — a friendly, screen-by-screen
> walkthrough with "try this" steps. This README is the developer-style reference.

---

## How to run

**Option A — double-click:** open `index.html` in any modern browser.

**Option B — local server** (recommended; enables the **live** phishing feed):
```bash
cd threatlens-web
python server.py
# then open http://localhost:8000
```
`server.py` also serves `/api/feed`, which fetches genuine live phishing URLs
server-side (see "Monthly threat-feed refresh" below).

## How to test it (positive & negative)

1. Open the app and click **Test Runner** in the sidebar (it also auto-runs on open).
2. Click **▶ Run all tests** — the 10 positive + 10 negative cases execute against the
   live modules and show ✓ PASS / ✗ FAIL, each tagged with its SRD requirement IDs.
3. Filter by **Positive** / **Negative**.

You can also exercise the flows manually:
- **Email Analysis** → pick a sample (its **subject/body preview** appears below the picker)
  → **Analyze** → see verdict, weighted explanation, IOCs, manipulation chips, and an
  **"Understanding this verdict"** panel answering: *Why was it malicious? Which indicators
  triggered detection? What attacker techniques were used? How can humans recognize similar attacks?*
- **Live Scams** → browse pulled phishing scams, see the **data source** and a **dated
  pull history** (e.g. "11 Jul — 4 scams"), and click **Analyze →** on any row.
- **Research** has three tabs: **Model Metrics** (model comparison, feature importance, exports),
  **Knowledge Base** (cited answers to the core questions — how phishing is created, how campaigns
  evolve, how attackers manipulate people, dominant methods, how ML detects threats, why systems
  decide, how generative AI changed phishing — plus a **🌐 Scan the internet** button that appends
  the latest security-news headlines with a timestamp via `/api/research`, plus a **Glossary** defining
  every acronym: CTI, IOC, ML, XAI, SHAP, LIME, SPF, DKIM, MFA, BEC, CRED, FIN, LOGIN, MALWARE), and
  **Awareness & Safety** (which scams target which age groups + a "be careful" protection checklist).
  Model Metrics has plain-English "What am I looking at?" explainers for accuracy/precision/recall and feature importance.
- Try the **negative paths**: click Analyze with nothing selected (prompt), upload a
  `.exe` or a >20 MB file (rejected), paste a benign email (predicted *Not phishing*).

**Detection factors.** The scorer weighs: threat-feed reputation (a URL on OpenPhish/URLhaus
is itself a strong indicator), suspicious-URL behavior, urgency, credential requests,
payment/BEC fraud cues, and sender anomalies (SPF failure, new domain). Acronyms are spelled
out in the UI: **SHAP** (SHapley Additive exPlanations), **SPF** (Sender Policy Framework).

## Monthly threat-feed refresh

The sidebar **⟳ Pull latest phishing scams** button ingests fresh phishing samples into
the mock DB, de-duplicates them, updates campaigns, and stamps the "last updated" time.
The status line shows the source and when the next **monthly** refresh is due
(`FEED_INTERVAL_DAYS = 30`).

The button sources data in three tiers, in priority order (`js/backend/phishingFeed.js`):

1. **Live** — `GET /api/feed`, which `server.py` fetches server-side from the
   **OpenPhish** community feed (fallback **URLhaus**). This is genuine, current
   phishing data and avoids browser CORS. Requires running `python server.py`.
2. **Snapshot** — `js/data/feed_latest.js`, a fresh phishing snapshot committed
   **monthly by a GitHub Action** (below). Powers the static, no-server demo.
3. **Simulated** — locally generated realistic samples, for offline / `file://` use.

### Automated monthly refresh (GitHub Action)

`.github/workflows/monthly-feed.yml` runs on the 1st of each month (and on demand):
it executes `scripts/fetch_feed.py`, which calls the same `feed_fetch.py` used by the
live proxy, writes `js/data/feed_latest.js`, and commits it if it changed. So a deployed
GitHub Pages demo automatically shows up-to-date phishing scams every month.

```
feed_fetch.py            # shared fetch/normalize logic (stdlib only, no API key)
├── server.py            # live proxy: GET /api/feed  (tier 1)
└── scripts/fetch_feed.py  # monthly snapshot writer  (tier 2, run by the Action)
```

> **Data sources:** OpenPhish community feed and URLhaus (abuse.ch) are free and need
> no API key. **PhishTank** is another option but now requires a registered app key —
> add it in `feed_fetch.py` if you want to use it.

## Folder structure

```
threatlens-web/
├── index.html                  # app shell + script load order
├── README.md
├── server.py                   # static server + /api/feed LIVE proxy
├── feed_fetch.py               # shared feed fetch/normalize (OpenPhish/URLhaus)
├── scripts/
│   └── fetch_feed.py           # monthly snapshot writer (run by the Action)
├── .github/workflows/
│   └── monthly-feed.yml        # monthly cron: pull feed + commit snapshot
├── css/
│   └── styles.css              # theme (light/dark), all components
└── js/
    ├── config.js               # namespace, taxonomy, models, limits, helpers
    ├── data/
    │   ├── seed.js             # seed dataset (phishing + legitimate)
    │   └── feed_latest.js      # monthly phishing snapshot (Action-generated)
    ├── backend/                # ← the "back end" tier
    │   ├── db.js               # mock DB (localStorage + in-memory fallback)
    │   ├── api.js              # service facade the UI/tests call
    │   └── phishingFeed.js     # live → snapshot → simulated feed sourcing
    ├── modules/                # ← business logic, one file per SRD component
    │   ├── dataCollection.js       # DC-FR-*
    │   ├── taxonomy.js             # TT-FR-*
    │   ├── featureExtraction.js    # FE-FR-*
    │   ├── threatIntel.js          # TI-FR-*
    │   ├── humanManipulation.js    # HM-FR-*
    │   ├── mlEngine.js             # ML-FR-*
    │   ├── explainability.js       # XAI-FR-*
    │   └── reporting.js            # REP-FR-*
    ├── views/                  # ← the "front end" (DASH-FR-*)
    │   ├── campaign.js             # DASH-FR-01
    │   ├── emailAnalysis.js        # DASH-FR-02
    │   ├── research.js             # DASH-FR-03
    │   └── tests.js                # live test runner UI
    ├── tests/
    │   └── testCases.js        # 10 positive + 10 negative, traceable to SRD
    └── app.js                  # UI helpers, router, bootstrap, sidebar actions
```

## Architecture (3-tier, matching the SDD)

- **Front end** (`views/`, `app.js`, `css/`): navigable views + hash router.
- **Back end** (`backend/api.js`): a service facade that orchestrates the `modules/`.
- **Mock DB** (`backend/db.js`): localStorage-backed store, seeded from `data/seed.js`.

Every component maps to its SRD requirement IDs (see the SRD, SDD, and Test Case
documents in the parent folder). This HTML build is a zero-install prototype/demo; the
`../threatlens/` Streamlit scaffold is the Python reference implementation.

## Notes & limitations

- The ML "model" is a transparent weighted scorer (not a trained neural net) so
  predictions are deterministic and explainable — ideal for demoing and testing.
- The phishing feed is simulated; wire a real feed at the marked integration point.
- Data persists in your browser's localStorage; **Reset DB** restores the seed set.
```
