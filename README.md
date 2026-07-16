# Vayun 🚀

Projects built for **Vayun Bro** — created by **Mithil Bhansali**.

| Project | What it is |
|---|---|
| ♞ **ChessMaster Academy** (this repo's root — `frontend/` + `backend/`) | AI-powered personal chess coach: lessons, adaptive tactics, play vs Stockfish, game analysis, parent dashboard. Deploy on Vercel with **Root Directory = `frontend`**. |
| 🧠 [ReasoningLab](reasoninglab/) | Adaptive math-reasoning trainer for Grade 5–6 Math Kangaroo prep. Deploy on Vercel with **Root Directory = `reasoninglab/client`**. |

---

# ♞ ChessMaster Academy

An AI-powered personal chess coach for children, beginners and intermediate players —
**Duolingo + Khan Academy + Chess.com + a personal Grandmaster coach.**

Every feature powers one loop: **Learn → Practice → Play → Analyze → Improve → Repeat.**

## What's inside

| Feature | Where |
|---|---|
| 🤖 **Personal AI coach** — "What do you struggle with today?" → builds a 10–20 min session (lesson + 5 puzzles + opening + endgame + game + review) | `/coach` |
| 🧭 **Onboarding & roadmap** — age, experience, rating, goals, learning style | `/onboarding` |
| 📚 **Structured path** — 28 interactive lessons across 5 levels (Fundamentals → Openings → Tactics → Positional → Endgames), each with explanation, board examples, guided practice, quiz and summary | `/learn` |
| 🧩 **Adaptive tactics trainer** — 31 machine-verified puzzles, 10 themes, Elo-style adaptive difficulty | `/tactics` |
| ♔ **Checkmate Lab** — back-rank, smothered, Arabian, Anastasia, Boden, hook, Lolli, ladder; 3-in-a-row mastery | `/checkmates` |
| 🗺️ **Opening Academy** — 9 openings with history, ideas, plans, mistakes, move-order trainer and quiz | `/openings` |
| 🏰 **Endgame Lab** — K+Q, K+R, K+P, opposition, Lucena, Philidor vs full-strength Stockfish | `/endgames` |
| ⚔️ **Play** — Stockfish WASM at 5 levels with hints, undo, move suggestions with plain-language explanations, time controls | `/play` |
| 🔬 **Post-game analysis** — accuracy %, move grading (best→blunder), phase reports, kid-legible comments, lesson recommendation, homework | `/analysis/<id>` |
| 🔁 **Spaced repetition** — missed puzzles and game blunders return on an SM-2 schedule until mastered | `/review` |
| 📈 **Analytics** — rating & accuracy trends, strength/weakness maps, activity calendar | `/progress` |
| 👪 **Parent dashboard** — practice time, consistency, weak areas, printable weekly report | `/parents` |
| 🎮 **Gamification** — XP, levels, coins, streaks, 22 achievements, daily challenge | everywhere |
| 🛠️ **Admin** — content inventory, verified puzzle library | `/admin` |

Plus: dark mode, mobile-first responsive design, reduced-motion support, and a
**guest-first architecture** — the whole app works without an account (localStorage),
and syncs to the API when signed in.

## Quick start

```bash
# Frontend (fully functional on its own)
cd frontend
npm install
npm run dev            # http://localhost:3000

# Backend API (auth, sync, family links, leaderboards) — optional
cd backend
python -m venv .venv && .venv\Scripts\activate    # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000          # Swagger at /docs

# Full stack with Docker
docker compose up --build
```

## Verify the chess content

Every puzzle FEN, solution line, forced mate and opening move order is machine-checked:

```bash
cd frontend
node scripts/verify-content.mjs
```

## Run the tests

```bash
cd backend
pytest                 # 8 integration tests: auth, sync w/ conflict, games, family, leaderboard
```

## Repository layout

```
docs/            Product vision, PRD, architecture (ER diagram + API design), deployment, roadmap
frontend/        Next.js 15 + TypeScript + Tailwind 4 + chess.js + react-chessboard + Stockfish WASM
  src/data/      Verified content: lessons, puzzles, openings, endgames, achievements
  src/engine/    Stockfish Web-Worker client + difficulty presets
  src/lib/       Analysis engine, coach logic, SM-2 spaced repetition
  scripts/       Content verification (chess.js brute-force mate checker)
backend/         FastAPI + SQLAlchemy (SQLite dev / PostgreSQL prod), JWT + Google OAuth
docker-compose.yml
```

## Tech stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · Zustand · chess.js ·
react-chessboard · Stockfish (WASM, in-browser Web Worker) · FastAPI · SQLAlchemy 2 ·
PostgreSQL · Redis · JWT · Docker

See [docs/](docs/) for the full PRD, architecture, deployment guide and roadmap.

---

♟️ **Created by Mithil Bhansali · For — Vayun Bro** ❤️
