# ChessMaster Academy — Future Roadmap

## M1 — Core learning loop (this repository) ✅
Onboarding + roadmap · 5-level lesson path with interactive lesson player · adaptive
tactics trainer with verified puzzles · checkmate lab · opening academy · endgame lab ·
play vs Stockfish (5 levels, hints, undo, explanations, time controls) · full post-game
analysis with accuracy + move classification · AI coach with session generator ·
spaced repetition · gamification (XP, levels, coins, streaks, achievements, missions) ·
analytics · parent dashboard with printable report · admin overview · FastAPI auth/sync
API · Docker.

## M2 — Depth & classrooms (next 1–2 quarters)
- Full lesson catalog (~120 lessons), 2,000+ puzzles imported from the Lichess CC0 puzzle
  DB with theme mapping and rating calibration
- Teacher/club mode: cohorts, homework assignment, effort-based leaderboards, CSV export
- Friend play: async correspondence + live games (WebSocket), club tournaments
- Admin CMS: rich lesson editor with board authoring, publishing workflow, versioning
- Accounts hardening: email verification, password reset, parental consent flow (COPPA)
- i18n framework + first 3 languages

## M3 — Smarter coach (2–4 quarters)
- LLM-powered coach dialogue (Claude API) grounded in the student's games, mistakes,
  and SRS history; tool-use for board rendering and engine queries
- Weakness detection v2: motif-level blunder clustering across games
- Voice narration + read-aloud lessons for younger children
- Opening repertoire builder with personal tabiya trainer
- Calculation trainer (visualization: play N moves blindfold, find the ply-3 tactic)

## M4 — Scale & platform
- Native mobile wrappers (Capacitor), offline session packs
- School district admin, SSO (Clever/Google Workspace for Edu)
- Content marketplace for coaches; certification paths with proctored assessments
- Rating interoperability (Lichess/Chess.com import) and FIDE-style progress reports

## Continuous
- Accessibility audits each release (screen-reader board parity)
- Puzzle solution re-verification pipeline on every content change
- A/B testing of session composition against retention + rating gain
