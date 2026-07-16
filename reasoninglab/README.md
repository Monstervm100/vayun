# 🧠 ReasoningLab

An AI-powered adaptive learning platform that helps Grade 5–6 students prepare for **Math Kangaroo** and other mathematical-reasoning competitions — by training *thinking skills*, not memorised formulas.

## What's inside

| | |
|---|---|
| **12 reasoning skills** | Pattern Recognition, Logical Reasoning, Number Sense, Geometry & Spatial, Counting, Combinatorics, Probability, Working Backwards, Sequences, Verbal Reasoning, Analytical Reasoning, Mixed Challenge |
| **4 difficulty bands** | Beginner → Intermediate → Advanced → Competition, each mapped to an Elo rating (900–1500) |
| **Adaptive engine** | Chess.com-style ratings (overall + per skill). Correct answers raise your rating; 3 misses in a row trigger **remediation mode** (easier practice until 2 consecutive corrects) |
| **Question bank** | 96 hand-curated competition-style questions + procedural generator templates (tagged ✨ AI-generated), every question tagged by skill, grade, time estimate, cognitive complexity and prerequisites |
| **Every question has** | 4 multiple choices · 3 progressively stronger hints · step-by-step solution · a one-line *reasoning strategy* takeaway |
| **AI Socratic Tutor** | Chat coach that never reveals answers — Claude-powered via the server (`claude-opus-4-8`), with a built-in rule-based Socratic ladder as offline fallback |
| **Student dashboard** | Rating trend, accuracy, avg solve time, streak, strongest/weakest skills, recent mistakes, mastery bars, competition-readiness projection, personalised daily plan |
| **Parent dashboard** | Weekly report, practice-time and accuracy trends, skill growth, detected error patterns (rushing, hint-dependence, skill clusters, difficulty walls) with at-home suggestions |
| **Gamification** | XP + levels, 15 badges, daily challenges, weekly tournaments with leaderboard, collectible avatars unlocked by level |
| **Learning science** | Spaced repetition of missed questions (0.5/1/3/7/14-day intervals), misconception detection, targeted recommendations |
| **Visual reasoning** | Declarative figure specs rendered as SVG: grids, shape rows, cube nets, number lines, balance scales |

## Architecture

```
reasoninglab/
├── client/          React 19 + TypeScript + Tailwind 4 (Vite)
│   └── src/
│       ├── data/        question bank (curated + generators)
│       ├── lib/         engines: elo, srs, xp, analytics, recommend
│       ├── store/       zustand + localStorage (guest-first)
│       ├── components/  QuestionPlayer, TutorPanel, FigureRenderer, charts
│       └── pages/       Dashboard, Practice, Session, Arcade, Parent, Settings
├── server/          Node + Express + TypeScript (modular /api router)
│   ├── src/         health, tutor (Claude proxy), sync, leaderboard
│   └── db/          schema.sql — PostgreSQL / Supabase production schema
└── README.md
```

**Guest-first**: all progress lives in the browser (`localStorage`, key `reasoninglab-v1`) so the app is fully functional with no account and no server. The server adds the Claude tutor, versioned progress backup (`POST /api/sync`) and a shared leaderboard. The dev server persists to a JSON file shaped exactly like `db/schema.sql`, so moving to Supabase/Postgres is a storage-adapter swap, not a redesign.

**Built to extend**: competitions are *data*, not code (see the `competitions` table). Adding AMC 8, MathCounts, MOEMS, Noetic or CogAT means new question rows + a readiness mapping — the engines, tutor and dashboards are competition-agnostic.

## Running it

```powershell
# 1. API server (port 5175)
cd reasoninglab/server
npm install
npm run start

# 2. Client (port 5173, proxies /api → 5175)
cd reasoninglab/client
npm install
npm run dev
```

Open http://localhost:5173.

### Enabling the Claude-powered tutor

The tutor works out of the box with a rule-based Socratic ladder. To upgrade it to Claude, give the **server** credentials:

```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-…"
npm run start
```

`GET /api/health` reports which mode is active (`claude` vs `rule-based-fallback`). The system prompt hard-forbids revealing answers pre-solve and escalates hints in step with each question's own hint ladder.

## API surface (modular, versioned)

| Route | Purpose |
|---|---|
| `GET /api/health` | liveness + tutor mode |
| `POST /api/tutor` | Socratic tutor turn (question context + student message → guarded reply) |
| `GET /api/sync/:studentId` · `POST /api/sync` | versioned progress blobs (409 on version conflict) |
| `GET /api/leaderboard` | cross-student tournament standings |

`/api/v1/*` is an alias of the same router — future breaking changes mount as `/api/v2` without disturbing clients.

## Question authoring

Questions are typed TypeScript objects (`client/src/data/questions/*.ts`) validated by the compiler. Figures are declarative JSON (`grid`, `shapeRow`, `cubeNet`, `numberLine`, `balance`) rendered by `FigureRenderer`. Generator templates (`data/generators.ts`) mint unlimited parameterised variants with seeded, deterministic answers.
