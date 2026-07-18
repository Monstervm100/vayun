# ChessMaster Academy — Product Vision

## One-liner

An AI-powered personal chess coach that helps children (8–16), beginners, and intermediate
players become genuinely stronger — not by memorizing tricks, but by learning **how to think**.

> Duolingo's habit loop + Khan Academy's structured mastery + Chess.com's play & analysis
> + a personal Grandmaster coach who knows exactly what *you* need next.

## The problem

- Kids who learn chess online bounce between random YouTube videos, unstructured puzzle
  grinders, and blitz games they never review. They plateau around 400–700 Elo.
- Existing platforms optimize for *playing volume*, not *learning*. Analysis is engine
  jargon ("-1.3 after 14...Rc8") that a 10-year-old cannot act on.
- Parents and school clubs have no visibility into whether practice time is producing skill.

## The insight

Chess improvement is a loop, not a library:

```
Learn → Practice → Play → Analyze → Improve → Repeat
```

Every feature in ChessMaster Academy exists to power one stage of that loop and feed the
next. Nothing is a standalone gadget.

## What we build skill in

Board vision · Pattern recognition · Tactical awareness · Positional understanding ·
Planning · Piece coordination · Endgame technique · Decision making · Calculation ·
**Confidence**

## What makes it different

1. **Coach-first, not menu-first.** The app opens by asking *"What do you struggle with
   today?"* — "I keep losing my queen", "I miss forks", "I only have 15 minutes" — and
   builds a personalized 10–20 minute session on the spot.
2. **Deliberate practice, not content consumption.** Every lesson ends in guided practice
   on a live board. Every game ends in a review that becomes homework. Mistakes are
   tracked and resurface via spaced repetition until mastered.
3. **Kid-legible analysis.** Post-game review speaks in plans and patterns ("your knight
   on a3 never joined the game — that's why the kingside attack was 3 attackers vs 4
   defenders"), with highlighted squares and animations, not centipawns.
4. **Parents in the loop.** A dedicated dashboard shows practice consistency, accuracy
   trends, and a printable weekly report.

## Success definition

A committed beginner (~400 Elo) reaches **~1200 Elo** through structured lessons,
adaptive puzzles, coached play, and consistent review — while *enjoying* the journey
enough to keep a streak alive.

## North-star metrics

| Metric | Target |
|---|---|
| Weekly active learning loops completed (session with lesson + puzzles + game + review) | 3+/user/week |
| Median rating improvement after 6 months of 3 sessions/week | +300 Elo |
| Puzzle accuracy trend (rolling 30 days) | Improving for 70% of actives |
| D30 retention (children) | ≥ 40% |
| Parent dashboard weekly views | ≥ 1/family/week |
