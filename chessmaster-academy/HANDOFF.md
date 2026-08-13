# ChessMaster Academy — Session Handoff

Everything a fresh Claude Code session needs to continue this project. Read this
file first, then `README.md` and the `docs/` folder.

_Last updated: 2026-07-16._

---

## 1. What this project is

**ChessMaster Academy** — an AI-powered personal chess coach web app for children
(8–16), beginners, and intermediate players. Think *Duolingo + Khan Academy +
Chess.com + a personal Grandmaster coach*. Every feature serves one loop:
**Learn → Practice → Play → Analyze → Improve → Repeat.**

Built to take a beginner from ~400 Elo toward ~1200 through structured lessons,
adaptive puzzles, coached play vs Stockfish, and kid-legible game analysis.

**Status: complete and working.** Production build passes, content verified,
backend tests green, runs locally. The only thing NOT finished is the public
Vercel deployment (see §7).

---

## 2. Where the files live

```
<repo root>  = the GitHub repo "vayun" (holds 3 separate projects)
├── chessmaster-academy/     ← THIS project
│   ├── frontend/            ← Next.js app  (Vercel Root Directory = chessmaster-academy/frontend)
│   ├── backend/             ← FastAPI app (optional; app works fully without it)
│   ├── docs/                ← 6 docs: vision, PRD, architecture, deployment, roadmap, Vercel guide
│   ├── docker-compose.yml
│   ├── HANDOFF.md           ← this file
│   ├── README.md
│   └── Start ChessMaster Academy.bat   ← Windows one-click launcher
├── reasoninglab/            ← a DIFFERENT project (math trainer) — leave alone
└── pylingo/                 ← a DIFFERENT project (Python game) — leave alone
```

Local absolute path on the current machine:
`C:\Users\bhans\OneDrive\Documents\claude\vayun bhansali chess academy\chessmaster-academy`

> Note: the working folder is named "vayun bhansali chess academy" but the chess
> app lives in the `chessmaster-academy/` subfolder (moved there 2026-07-16).

---

## 3. Tech stack

- **Frontend:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 ·
  Zustand (persisted to localStorage) · chess.js · react-chessboard 4.7 ·
  Stockfish (WASM, in-browser Web Worker — assets in `frontend/public/engine/`)
- **Backend (optional):** FastAPI · SQLAlchemy 2 · SQLite (dev) / PostgreSQL (prod) ·
  JWT + Google OAuth · scrypt password hashing
- **Infra:** Docker + docker-compose · content-verification script

---

## 4. Key architecture decisions (don't re-litigate these)

1. **Guest-first.** All learner progress lives in a Zustand store persisted to
   localStorage under key `chessmaster-academy-v1`. The app is 100% usable with
   NO account and NO backend. This is why "continue where you left off next day"
   already works — localStorage survives across sessions/days.
2. **Stockfish runs client-side** in a Web Worker (`frontend/src/engine/stockfish.ts`).
   Zero server compute for play/analysis. This is why it CAN'T run from a `file://`
   HTML file — browsers block Web Workers + WASM on `file://`; it needs an http server.
3. **Backend sync is a versioned blob** — `/progress/sync` (GET/PUT) with 409 conflict
   detection. The backend stores results (games, progress), not engine sessions.
4. **All chess content is hand-authored and machine-verified.** Every puzzle FEN,
   solution line, and forced-mate claim is checked by `frontend/scripts/verify-content.mjs`
   (brute-force mate solver using chess.js). ALWAYS run it after editing content.
5. **Board has click-to-move AND drag** (`frontend/src/components/board/Board.tsx`) —
   click-to-move added for touch + accessibility.
6. **Visit tracker** at `frontend/src/app/api/track/route.ts` — anonymous counts only
   (random id, no PII). Uses Upstash/Vercel KV env vars if present, else a local
   JSON file (`frontend/.data/analytics.json`, gitignored).

---

## 5. Content inventory (all verified)

- **28 lessons** across 5 levels — `frontend/src/data/lessons.json`
- **31 tactical puzzles**, 10 themes — `frontend/src/data/puzzles.json`
- **9 openings** — `frontend/src/data/openings.json`
- **7 endgame drills** — `frontend/src/data/endgames.json`
- **22 achievements** — `frontend/src/data/achievements.ts`

Feature pages: home, onboarding, dashboard, learn (+lesson player), tactics,
checkmates, openings (+trainer), endgames, play (vs Stockfish, 5 levels), analysis
(post-game), coach (session generator + Q&A), review (SRS), progress (analytics),
parents (printable report), admin.

---

## 6. How to run it (Windows specifics matter!)

**CRITICAL environment quirk:** Node 24 is installed via winget at
`C:\Program Files\nodejs` but is NOT on the default PowerShell PATH. Every node/npm
command must be prefixed:
```powershell
$env:Path += ";C:\Program Files\nodejs"
```

**Run the app (dev):**
```powershell
$env:Path += ";C:\Program Files\nodejs"
cd "chessmaster-academy\frontend"
npm install    # first time only
npm run dev    # http://localhost:3000
```
Or double-click `chessmaster-academy\Start ChessMaster Academy.bat`.

**Verify content:** `node scripts/verify-content.mjs` (from `frontend/`)
**Production build:** `npm run build` (from `frontend/`)
**Backend tests:** `backend\.venv\Scripts\python -m pytest tests -q` (8 tests)

**Other gotchas learned this session:**
- The in-app Browser pane `screenshot` action times out here — verify with
  `get_page_text` / `read_page` / `javascript_tool` instead.
- Git Bash `/tmp` maps to a different place than the Windows Node binary's `C:\tmp`.
  Use `$TEMP` or the scratchpad for temp files.
- PowerShell mangles complex quoted git args — use the Bash tool for `git filter-branch`
  and heredocs.
- Bash tool cwd can be inconsistent between calls — use absolute paths.

---

## 7. THE ONE UNFINISHED TASK: deploy to Vercel

The app is ready to deploy; it just hasn't been done yet.

**Correct method — GitHub import (do this):**
1. Go to https://vercel.com/new
2. Import the GitHub repo `Monstervm100/vayun`
3. **Set Project Name = `chess-master`** (the user wants this name, not "vayun")
4. **Set Root Directory = `chessmaster-academy/frontend`** ← the one critical setting
5. Deploy → get a URL like `chess-master.vercel.app`

Full walkthrough: `docs/06-free-hosting-vercel.md`.

**Why NOT the Vercel MCP `deploy_to_vercel` tool:** it uploads files inline through
the tool call. This app has 42 source files + a 558 KB Stockfish WASM binary — too
large/fragile to inline reliably, and a file-upload deploy isn't git-linked (breaks
auto-redeploy on push). The GitHub import is the right tool. A Vercel connector was
authorized in a prior session and can MONITOR a build (read logs, get deployment
status) once the user starts it from the dashboard — but it cannot do the git import
itself.

**Optional — permanent visit counter on Vercel:** add the free Upstash Redis
integration in the Vercel project (Storage tab); it auto-sets `KV_REST_API_URL` +
`KV_REST_API_TOKEN` and the tracker switches to it automatically. See
`docs/06-free-hosting-vercel.md` §3.

---

## 8. GitHub repo

- Repo: **https://github.com/Monstervm100/vayun** (public), branch `main`.
- Local branch is `master`; push with: `git push origin master:main`
- Commit author is configured as **Mithil Bhansali <mithil.bhansali@gmail.com>**
  (repo-local git config). Keep this identity.
- The repo is a multi-project container. Do NOT rename it to "chess-master" — that
  would mislabel reasoninglab & pylingo. Rename the *Vercel project* instead (§7).
- `.gitignore` excludes node_modules, .next, .venv, .data, *.db, .env*.

**⚠️ If switching to a new GitHub account:** the current repo is under `Monstervm100`.
To move it to a new account, either (a) transfer the repo in GitHub settings, or
(b) create a new empty repo on the new account and re-point the remote:
```bash
git remote set-url origin https://github.com/<NEW-USER>/<NEW-REPO>.git
git push -u origin master:main
```
Then update the raw-URL references if any build step fetches from GitHub (none
currently do — the engine binary is committed directly).

---

## 9. Ideas / roadmap (not yet built)

See `docs/05-future-roadmap.md`. Highlights: import the Lichess CC0 puzzle DB
(2,000+ puzzles) to replace the hand-authored 31; wire up the login UI to the
existing backend for cross-device sync; teacher/club dashboards; more lessons.

---

## 10. First things to do in a fresh session

1. Read this file, then `README.md`.
2. `$env:Path += ";C:\Program Files\nodejs"` then `cd chessmaster-academy\frontend` && `npm run dev` to confirm it still runs.
3. If continuing deployment: guide the user through the Vercel GitHub import (§7).
4. If editing chess content: edit the JSON, then ALWAYS run `node scripts/verify-content.mjs`.
