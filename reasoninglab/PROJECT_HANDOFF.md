# ReasoningLab — Project Handoff & Continuation Guide

> **Purpose:** This single file carries everything needed to resume work on ReasoningLab in a
> **fresh Claude Code session on a different account**, with no memory of the original session.
> Read this top-to-bottom and you'll have full context.

_Last updated: 2026-07-18 · Created by Mithil Bhansali, for Vayun._

---

## 1. What ReasoningLab is

An AI-powered adaptive learning web app that helps **Grade 5–6 students** prepare for **Math
Kangaroo** and other math-reasoning competitions by training *thinking skills*, not memorised
formulas. It is fully working and verified end-to-end (build passes, runs in browser).

**Core features already built:**
- **12 reasoning skills** — Pattern Recognition, Logical Reasoning, Number Sense, Geometry &
  Spatial, Counting, Combinatorics, Probability, Working Backwards, Sequences, Verbal Reasoning,
  Analytical Reasoning, Mixed Challenge.
- **4 difficulty bands** — Beginner / Intermediate / Advanced / Competition, mapped to Elo ratings.
- **Adaptive engine** — Chess.com-style overall + per-skill Elo ratings. 3 misses in a row →
  "remediation mode" (easier questions until 2 correct in a row).
- **~120 questions** — 96 hand-authored + 24 procedurally generated (tagged "✨ AI-generated").
  Every question has 4 choices, 3 progressively stronger hints, a step-by-step solution, a
  strategy takeaway, and tags (grade, time estimate, cognitive complexity, prerequisites).
- **AI Socratic Tutor** — never reveals the answer; asks guiding questions. Claude-powered on the
  server (`claude-opus-4-8`) when `ANTHROPIC_API_KEY` is set; otherwise a rule-based Socratic
  ladder runs client-side so it always works offline.
- **Student dashboard** — rating trend, accuracy, avg solve time, streak, strongest/weakest
  skills, recent mistakes, mastery bars, competition-readiness ring, personalised daily plan.
- **Parent dashboard** — weekly report, practice/accuracy trends, skill growth, detected error
  patterns (rushing, hint-dependence, skill clusters, difficulty walls), at-home suggestions.
- **Gamification** — XP + levels, 15 badges, daily challenges, weekly tournament + leaderboard,
  collectible avatars unlocked by level.
- **Spaced repetition** — missed questions return on a 0.5 / 1 / 3 / 7 / 14-day schedule.
- **Visual reasoning** — grids, shape rows, cube nets, number lines, balance scales rendered as
  inline SVG (`FigureRenderer.tsx`).
- **Credit footer on every page:** "Created with ❤️ by Mithil Bhansali · For — Vayun Bro".

---

## 2. Where the code lives

**GitHub (source of truth):** https://github.com/Monstervm100/vayun — a shared monorepo holding
several projects. ReasoningLab is under the **`reasoninglab/`** folder. (Other folders:
`chessmaster-academy/`, `pylingo/`, `starwatch/`, `threatlens/` — unrelated, leave them alone.)

**Local copy (Windows):** `C:\Users\bhans\OneDrive\Documents\vayun\reasoninglab\`

> ⚠️ If resuming on a **new account / new machine**, the simplest fresh start is:
> ```bash
> git clone https://github.com/Monstervm100/vayun.git
> cd vayun/reasoninglab
> ```

### Folder structure
```
reasoninglab/
├── PROJECT_HANDOFF.md      ← this file
├── README.md               ← full project docs
├── .gitignore
├── client/                 React 19 + TypeScript + Tailwind 4 (Vite 8)
│   ├── index.html
│   ├── vercel.json         SPA rewrite (all routes → index.html)
│   ├── vite.config.ts      dev proxy /api → :5175
│   ├── package.json
│   └── src/
│       ├── main.tsx, App.tsx (react-router routes), index.css (Tailwind theme + chart palette)
│       ├── types.ts        all domain types (Question, Attempt, SkillState, Figure, etc.)
│       ├── data/
│       │   ├── index.ts        assembles QUESTION_BANK
│       │   ├── generators.ts   6 procedural question templates
│       │   └── questions/*.ts  12 files, ~8 curated questions each
│       ├── lib/
│       │   ├── elo.ts        adaptive rating (expectedScore, updateRating, readiness)
│       │   ├── srs.ts        spaced repetition scheduler
│       │   ├── xp.ts         XP, levels, badges, avatars, streaks
│       │   ├── analytics.ts  accuracy, trends, skill reports, error-pattern detection, weekly report
│       │   ├── recommend.ts  daily plan, question selection, daily challenge, tournament field
│       │   └── skills.ts     the 12 skill definitions (name, emoji, blurb, colour)
│       ├── store/useStore.ts  Zustand + localStorage (key "reasoninglab-v1"); recordAttempt() is the hub
│       ├── components/
│       │   ├── QuestionPlayer.tsx  the play surface (choices, hints, solution, strategy)
│       │   ├── TutorPanel.tsx      Socratic tutor chat (calls /api/tutor, falls back locally)
│       │   ├── FigureRenderer.tsx  declarative figure → SVG
│       │   ├── charts.tsx          StatTile, TrendChart, BarsChart, SkillBars, ProgressRing
│       │   ├── Layout.tsx          nav + footer credit
│       │   └── Onboarding.tsx      first-run name/grade/avatar modal
│       └── pages/
│           ├── Dashboard.tsx, PracticeHub.tsx, Session.tsx, Arcade.tsx, Parent.tsx, Settings.tsx
└── server/                 Node + Express + TypeScript (tsx)
    ├── package.json        "@anthropic-ai/sdk": "^0.111.0" (needs ≥0.111 for adaptive thinking)
    ├── src/
    │   ├── index.ts        Express app, /api router (+ /api/v1 alias)
    │   ├── tutor.ts        Claude proxy for the Socratic tutor + credential detection
    │   └── store.ts        dev JSON-file persistence (mirrors db/schema.sql shape)
    └── db/schema.sql       PostgreSQL / Supabase production schema (competitions are DATA, not code)
```

---

## 3. How to run it (Windows — important environment quirks)

**Node 24 is installed at `C:\Program Files\nodejs` but is NOT on the default PowerShell PATH.**
Every node/npm command must be prefixed with:
```powershell
$env:Path += ";C:\Program Files\nodejs"
```

**`npm run dev` / `npm run build` fail with "'tsc'/'vite' is not recognized"** even with node on
PATH (a local Windows shell quirk). Work around it by calling the binaries directly:
```powershell
# Client dev server (port 5173)
cd "reasoninglab\client"; npm install
& ".\node_modules\.bin\vite.cmd" --port 5173 --strictPort

# Client production build (what Vercel runs)
& ".\node_modules\.bin\vite.cmd" build      # or: npm run build  (tsc -b && vite build)

# API server (port 5175) — tutor + sync + leaderboard
cd "reasoninglab\server"; npm install; npm run start
```

**PowerShell cwd persistence bug:** the shell's working directory can silently reset between
tool calls. **Always use absolute paths** in PowerShell commands. A relative `Set-Location`
once caused an npm install to land in the wrong folder, creating a stray `node_modules` with a
duplicate React copy → "Invalid hook call" at runtime. If you see that error, look for a stray
parent `node_modules`/`package.json` and remove it (stop the dev server first — Vite locks its
native binaries).

**Browser verification:** the in-app preview pane (`preview_start` / `mcp__Claude_Browser__*`)
works; the Claude-in-Chrome extension was flaky this session. Verify UI via
`get_page_text` / `javascript_tool` rather than screenshots.

---

## 4. Content invariant (don't break this)

Every multiple-choice question must have exactly **one** correct answer that the distractors
genuinely exclude. Two puzzles originally shipped with two valid answers (`seq-8` in
`sequences.ts`, `ana-8` in `analytical.ts`) and had to be reworded. When adding or editing MCQ
logic puzzles, verify each wrong choice is actually impossible.

---

## 5. Deployment status & next step

- ✅ Code is pushed to GitHub (`Monstervm100/vayun`, `reasoninglab/` folder), deploy-ready:
  `vercel.json` present, build verified, page title "ReasoningLab 🧠".
- ⏳ **NOT yet live on Vercel.** The user chose the **GitHub-import** method.

### To deploy on Vercel (user action — requires their Vercel login)
1. Go to **vercel.com/new** → "Continue with GitHub" (Monstervm100 account).
2. Import the **`vayun`** repo (may need "Adjust GitHub App Permissions" to grant access).
3. **Set Root Directory to `reasoninglab/client`** ← the one critical setting.
4. Framework auto-detects as **Vite** (build `npm run build`, output `dist`). Deploy.
- Result: a static SPA. Progress saves in the browser; the tutor uses its offline Socratic
  fallback (the Claude-powered tutor needs the Express server hosted separately — a future task).

> **Note for a Claude session:** you cannot do the Vercel sign-in for the user (never enter their
> credentials). A Vercel MCP connector exists but needs the user to authorize it via `/mcp` in an
> interactive session first. There's also a direct file-upload deploy tool, but it creates a
> one-off deployment disconnected from the GitHub repo — GitHub import is preferred.

---

## 6. Good next tasks (roadmap ideas, not yet done)

- **Host the tutor server** (Render/Railway/Fly or Vercel serverless function) and set
  `ANTHROPIC_API_KEY` so the Socratic tutor is Claude-powered in production. Point the client's
  `/api` calls at the deployed server URL.
- **Wire up Supabase/Postgres** using `server/db/schema.sql` for cross-device progress + a real
  leaderboard (client is currently guest-first localStorage; `POST /api/sync` is a versioned blob
  with 409-on-conflict, ready to back onto the DB).
- **Add more competitions** (AMC 8, MathCounts, MOEMS, Noetic, CogAT) — the schema treats
  competitions as data rows; add question rows + a readiness mapping, no redesign needed.
- **Expand the question bank** and/or add more generator templates in `data/generators.ts`.
- **More visual/interactive question types** (tangrams, drag-and-drop) via new `Figure` variants
  in `types.ts` + `FigureRenderer.tsx`.

---

## 7. First message to paste into a fresh session

> I'm continuing work on **ReasoningLab**, an adaptive math-reasoning web app for Grade 5–6 Math
> Kangaroo prep. The full context is in `reasoninglab/PROJECT_HANDOFF.md` — please read it first.
> The code is at https://github.com/Monstervm100/vayun in the `reasoninglab/` folder (clone it if
> you don't have it locally). It's built and working; next I want to **[describe your goal —
> e.g. "deploy it on Vercel", "host the Claude tutor server", "add 20 more questions", etc.]**.
