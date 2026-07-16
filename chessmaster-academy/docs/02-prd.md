# ChessMaster Academy — Product Requirements Document

Status: v1.0 · Owner: Product · Last updated: 2026-07-12

## 1. Users & personas

### P1 — "Vayun", 10, aspiring competitor (primary)
Plays at school club, ~500 Elo online. Loses to the same tricks repeatedly. Has 20–30
minutes on weekdays. Motivated by streaks, badges, and beating friends.
**Needs:** short structured sessions, clear "what to do next", encouragement.

### P2 — "Priya", parent
Non-player. Pays for the subscription. Wants proof that screen time = learning.
**Needs:** weekly report, consistency view, safe environment (no open chat with strangers).

### P3 — "Mr. Rao", school chess club teacher
Runs a 20-kid club with mixed levels. **Needs:** assign homework, see cohort progress,
leaderboards that reward effort, not just rating.

### P4 — Adult beginner/intermediate (600–1100)
Self-driven. **Needs:** honest weakness diagnosis, endgame/positional depth, game review.

## 2. User journey maps (condensed)

### First session (child)
1. Lands on marketing home → "Start free" → age-appropriate onboarding quiz
   (age, experience, rating estimate via 3 quick positions, goals, time budget, learning style)
2. Roadmap generated → celebratory reveal ("Your journey to 1200 starts here")
3. First coached session (10 min): mini-lesson → 5 puzzles → 1 short game vs AI → review
4. Earns first achievement + XP → streak starts → parent invite prompt

### Daily loop (returning child)
Open app → coach asks "What do you struggle with today?" (or continues roadmap) →
personalized session → post-game analysis → homework scheduled → streak +1.

### Weekly loop (parent)
Email digest Sunday → opens parent dashboard → sees practice time, accuracy trend,
areas needing improvement → prints weekly report → encourages child.

## 3. User stories (MoSCoW, abridged)

### Must
- As a learner, I answer "what do you struggle with today?" and get a tailored 10–20 min session.
- As a learner, I follow a 5-level structured path (Fundamentals → Openings → Tactics → Positional → Endgames) where each lesson has explanation, animated examples, interactive board practice, quiz, common mistakes, and a challenge.
- As a learner, I train tactics by theme (fork, pin, skewer, discovered attack, deflection, decoy, removing defender, zwischenzug, sacrifice, double attack) with difficulty that adapts to my results.
- As a learner, I drill checkmate patterns (mate in 1–4, back rank, Arabian, Anastasia, smothered, hook, Lolli, Boden) until mastery.
- As a learner, I study openings (Italian, London, Queen's Gambit, Ruy Lopez, Scotch, Sicilian, French, Caro-Kann, King's Indian) with ideas, move orders, plans, mistakes, quiz, and practice vs AI.
- As a learner, I train endgames (K+P, K+Q, K+R, Lucena, Philidor, opposition, promotion).
- As a learner, I play vs Stockfish at 5 difficulty levels with hints, undo, suggested move + explanation, and time controls.
- As a learner, every finished game gives me accuracy, best moves/mistakes/blunders/missed wins, phase-by-phase analysis, move-by-move explanation, a recommended lesson, and homework.
- As a learner, I can ask the AI coach questions ("Why was my move wrong?", "What should I study next?") and get answers with visual boards and highlighted squares.
- As a learner, my mistakes are tracked and resurface via spaced repetition until I master them.
- As a learner, I earn XP, levels, coins, achievements, and keep a streak.
- As a parent, I see practice time, consistency, accuracy, rating trend, achievements, weak areas, and can print a weekly report.
- As any user, I sign in with Google or email; my data syncs across devices.

### Should
- Analytics: rating progress, strength/weakness maps, blunder frequency, monthly progress.
- Leaderboards (weekly XP, puzzle accuracy) scoped to friends/club.
- Daily challenge and weekly missions.
- Admin panel: manage users, lessons, puzzles, openings, achievements, learning paths.

### Could
- Play vs friends (async + live), unlockable board/piece themes, voice narration for
  younger kids, multiple languages.

### Won't (v1)
- Open chat between minors, tournaments with prizes, mobile native apps (responsive web only).

## 4. Functional requirements by module

| # | Module | Key requirements |
|---|---|---|
| F1 | Onboarding | Collect age, experience, rating, favorite opening, weekly goal, daily time, target rating, learning style. Generate roadmap. Guest mode allowed; progress migrates on signup. |
| F2 | Coach session generator | Input: struggle tags + time budget + skill profile. Output: ordered session = 1 lesson + 5 puzzles + 1 opening drill + 1 endgame drill + 1 game + review + homework. 10–20 min. |
| F3 | Learning path | 5 levels, ~40 lessons. Lesson player with steps: explain → animate → try (interactive board with validation) → quiz → challenge → summary. Completion tracked per step. |
| F4 | Tactics trainer | Themed + mixed queues. Rating-style adaptive difficulty (Elo-like puzzle rating per user). Streak bonuses. Every fail is logged as a mistake for SRS. |
| F5 | Checkmate lab | Pattern drills grouped by motif; mastery = 3 consecutive correct at target speed. |
| F6 | Opening academy | Per-opening: history, ideas, interactive move-order trainer, typical plans, mistakes, quiz, practice vs AI from tabiya. |
| F7 | Endgame lab | Scripted winning-technique drills validated by engine (win kept = pass; draw/loss = retry with hint). |
| F8 | Play | Stockfish levels 1–5 (skill-limited), hints, undo, best-move + plain-language explanation, 5/10/15+10 time controls. |
| F9 | Post-game analysis | Full-game engine pass; classify moves (best/good/inaccuracy/mistake/blunder/missed win); accuracy %; phase summaries; per-move explanations; recommend next lesson; add worst 3 moments to SRS + homework. |
| F10 | AI coach chat | Q&A grounded in the user's games/profile. Rendered with boards + highlights. Kid-safe tone. |
| F11 | SRS | SM-2-style scheduler over mistake items (position + correct idea). Due queue feeds sessions. |
| F12 | Gamification | XP, levels, coins, streaks (with freeze), daily challenge, weekly missions, achievement catalog, unlockable themes. |
| F13 | Analytics | Per-user: rating, accuracy, opening/endgame performance, blunder rate, time invested, strength/weakness map, monthly trend. |
| F14 | Parent dashboard | Read-only child views + consistency calendar + printable weekly report. Linked via family code. |
| F15 | Admin | CRUD lessons/puzzles/openings/achievements/paths; user management; content publishing workflow; reports. |

## 5. Non-functional requirements

- **Responsive, mobile-first**; dark mode; WCAG 2.1 AA (keyboard-playable board, ARIA labels, reduced-motion support).
- **Performance:** LCP < 2.5s on mid-range mobile; puzzle board interactive < 1s; engine runs client-side (WASM) so play/analysis works offline-ish.
- **Security:** JWT access (15 min) + refresh rotation; Google OAuth; role-based access (student/parent/teacher/admin); COPPA-conscious — minimal PII for children, parent consent flow.
- **Quality:** unit + integration tests in CI; typed end-to-end (TypeScript + Pydantic).
- **Ops:** Docker images for web/api; docker-compose for local; REST with OpenAPI/Swagger docs; CI/CD pipeline.

## 6. Release plan

- **M1 (this repo):** Core loop playable end-to-end — onboarding, roadmap, lessons engine with Level 1–3 content, tactics trainer with verified puzzles, checkmate lab, opening academy (5 openings), endgame lab, play vs engine, post-game analysis, coach sessions, SRS, gamification, analytics, parent view, auth + sync API, Docker.
- **M2:** Full content depth (all lessons/openings), teacher/club tools, live friend play, admin CMS UI.
- **M3:** LLM-powered coach dialogue, voice mode, localization, native wrappers.
