import type { CoachSession, SessionStep } from "@/store/useStore";

/** "What do you struggle with today?" — each struggle maps to a training plan. */
export interface Struggle {
  id: string;
  label: string;
  emoji: string;
  focus: string;
  lessonId: string;
  tacticsTheme: string;
  endgameId: string;
  openingFirst?: boolean;
}

export const STRUGGLES: Struggle[] = [
  { id: "losing-queen", label: "I keep losing my Queen", emoji: "👸", focus: "Piece safety", lessonId: "l3-board-safety", tacticsTheme: "hanging", endgameId: "kq-mate" },
  { id: "miss-forks", label: "I miss forks", emoji: "🍴", focus: "Fork vision", lessonId: "l3-fork", tacticsTheme: "fork", endgameId: "kr-mate" },
  { id: "no-openings", label: "I don't know openings", emoji: "🗺️", focus: "Opening principles", lessonId: "l2-opening-principles", tacticsTheme: "hanging", endgameId: "kp-promotion", openingFirst: true },
  { id: "endgame-losses", label: "I lose in the endgame", emoji: "🏰", focus: "Endgame technique", lessonId: "l5-king-activity", tacticsTheme: "skewer", endgameId: "opposition" },
  { id: "blunders", label: "I blunder pieces", emoji: "😱", focus: "Blunder-proofing", lessonId: "l3-board-safety", tacticsTheme: "hanging", endgameId: "kq-mate" },
  { id: "fast-mates", label: "I get checkmated quickly", emoji: "⚡", focus: "King safety", lessonId: "l2-castle-early", tacticsTheme: "mate1", endgameId: "kq-mate" },
  { id: "time-pressure", label: "I panic under time pressure", emoji: "⏰", focus: "Pattern speed", lessonId: "l3-fork", tacticsTheme: "mate1", endgameId: "kq-mate" },
  { id: "reach-800", label: "I want to reach 800 Elo", emoji: "🎯", focus: "Fundamentals", lessonId: "l2-development", tacticsTheme: "hanging", endgameId: "kq-mate" },
  { id: "reach-1200", label: "I want to reach 1200 Elo", emoji: "🚀", focus: "Tactics & plans", lessonId: "l4-planning", tacticsTheme: "pin", endgameId: "lucena" },
  { id: "beat-friends", label: "I want to beat my friends", emoji: "😎", focus: "Practical strength", lessonId: "l3-pin", tacticsTheme: "fork", endgameId: "kr-mate" },
  { id: "quick-session", label: "I only have 15 minutes today", emoji: "⏱️", focus: "Quick workout", lessonId: "l3-fork", tacticsTheme: "mate1", endgameId: "kq-mate" },
];

const uid = () => Math.random().toString(36).slice(2, 10);

/** Build a personalized 10–20 minute session for a struggle. */
export function generateSession(struggle: Struggle, minutes: number): CoachSession {
  const short = minutes <= 15;
  const steps: SessionStep[] = [];

  const lesson: SessionStep = { type: "lesson", label: `Lesson: ${struggle.focus}`, href: `/learn/${struggle.lessonId}`, minutes: short ? 4 : 6, done: false };
  const puzzles: SessionStep = { type: "puzzles", label: "5 tactical puzzles", href: `/tactics?theme=${struggle.tacticsTheme}&session=1`, minutes: short ? 4 : 5, done: false };
  const opening: SessionStep = { type: "opening", label: "Opening exercise", href: "/openings?session=1", minutes: 3, done: false };
  const endgame: SessionStep = { type: "endgame", label: "Endgame drill", href: `/endgames?drill=${struggle.endgameId}`, minutes: short ? 3 : 4, done: false };
  const play: SessionStep = { type: "play", label: "Practice game + review", href: "/play?session=1", minutes: short ? 5 : 8, done: false };

  if (struggle.openingFirst) steps.push(opening, lesson, puzzles, endgame, play);
  else if (short) steps.push(lesson, puzzles, endgame, play);
  else steps.push(lesson, puzzles, opening, endgame, play);

  return { id: uid(), createdAt: new Date().toISOString(), focus: struggle.label, steps };
}

/** Rule-based coach Q&A grounded in the student's stats. */
export interface CoachAnswer {
  text: string;
  fen?: string;
  highlights?: Record<string, "hint" | "good" | "bad">;
  followUp?: string[];
}

interface CoachStats {
  puzzleRating: number;
  weakestTheme: string | null;
  blunderRate: number | null;
  streak: number;
  lessonsDone: number;
  games: number;
}

export function answerQuestion(q: string, s: CoachStats): CoachAnswer {
  const t = q.toLowerCase();

  if (t.includes("study next") || t.includes("what should i") || t.includes("what next")) {
    if (s.weakestTheme)
      return {
        text: `Looking at your puzzle history, your weakest pattern right now is **${s.weakestTheme}**. I'd spend the next 3 sessions there: do the ${s.weakestTheme} lesson in Learn, then 10 themed puzzles in the Tactics Trainer. Small, focused reps beat random practice every time.`,
        followUp: ["Show another example", "Why do I keep losing?"],
      };
    return {
      text: `You haven't done enough puzzles yet for me to spot a pattern — that's step one! Do 10 mixed puzzles in the Tactics Trainer and I'll diagnose your weakest theme from the results.`,
      followUp: ["What was the best move?", "Explain forks simply"],
    };
  }

  if (t.includes("keep losing") || t.includes("why do i lose")) {
    const parts: string[] = [];
    if (s.blunderRate !== null && s.blunderRate > 0.5)
      parts.push(`In your analyzed games you average over half a blunder per game — that's the #1 thing costing you points. Before every move, run the safety scan: what did their move threaten, and is my piece safe where it lands?`);
    else parts.push(`Your games show reasonable safety — so the next win is consistency and planning.`);
    parts.push(`My prescription: the "Blunder-Proof Your Moves" lesson, then 5 hanging-piece puzzles daily for a week. Boring? A little. Effective? Massively.`);
    return { text: parts.join(" "), followUp: ["What should I study next?", "Explain pins simply"] };
  }

  if (t.includes("fork")) {
    return {
      text: `A **fork** is one piece attacking two things at once — your opponent can only save one! Knights are the champions because the pieces they attack usually can't hit back. On this board, the knight jump to e7 checks the king AND attacks the queen: a royal fork.`,
      fen: "6k1/5ppp/2N5/3q4/8/8/5PPP/6K1 w - - 0 1",
      highlights: { e7: "hint", g8: "bad", d5: "bad" },
      followUp: ["Show another example", "What should I study next?"],
    };
  }

  if (t.includes("pin")) {
    return {
      text: `A **pin** freezes an enemy piece against something more valuable behind it. Here the bishop pins the knight to the king — the knight literally cannot move. The winning idea: attack a pinned piece again (d5 next!) because it can't run away.`,
      fen: "4k3/p4ppp/2n5/1B6/3P4/8/PP3PPP/4K3 w - - 0 1",
      highlights: { c6: "bad", b5: "good", e8: "hint" },
      followUp: ["Explain skewers simply", "Show another example"],
    };
  }

  if (t.includes("skewer")) {
    return {
      text: `A **skewer** is a backwards pin: the BIG piece stands in front. Check the king on a line, it must move, and you win whatever hides behind it. Here Rh8+ forces the king aside and the queen on a8 falls.`,
      fen: "qk6/pp6/8/8/8/8/8/6KR w - - 0 1",
      highlights: { h8: "hint", b8: "bad", a8: "bad" },
      followUp: ["Explain pins simply", "What should I study next?"],
    };
  }

  if (t.includes("best move") || t.includes("move wrong") || t.includes("was my move")) {
    return {
      text: `Great question to ask! Open any finished game from your Dashboard and hit "Analyze" — I'll grade every move, show you the best alternative with an arrow, and explain the why in plain language. The three worst moments become homework so the same mistake never happens twice.`,
      followUp: ["Why do I keep losing?", "What should I study next?"],
    };
  }

  if (t.includes("opening")) {
    return {
      text: `Don't memorize long lines — learn the three opening jobs: 1) put a pawn in the center, 2) develop knights and bishops toward the center, 3) castle before move 10. Then pick ONE opening for White in the Opening Academy (the Italian is perfect) and play it every game for a month.`,
      followUp: ["What should I study next?", "Why do I keep losing?"],
    };
  }

  if (t.includes("example")) {
    return {
      text: `Here's a classic: the back-rank mate. Black's king looks cozy behind its pawns, but those pawns are prison bars. Ra8 is checkmate — the king has nowhere to run. Always give your castled king an escape hole before the back rank gets raided!`,
      fen: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
      highlights: { a8: "hint", f7: "bad", g7: "bad", h7: "bad" },
      followUp: ["Explain forks simply", "What should I study next?"],
    };
  }

  if (t.includes("endgame")) {
    return {
      text: `Endgames are where points are won and lost! Start with the big three in the Endgame Lab: King+Queen mate, King+Rook mate, and escorting a pawn with opposition. Master those and you'll convert every winning position — that alone is worth 100+ rating points.`,
      followUp: ["What should I study next?", "Show another example"],
    };
  }

  return {
    text: `I can help with that! Try asking me things like "Why was my move wrong?", "Explain forks", "What should I study next?", or "Why do I keep losing?" — or tap a suggestion below. You're on a ${s.streak}-day streak with ${s.lessonsDone} lessons done — keep the momentum!`,
    followUp: ["What should I study next?", "Explain forks simply", "Why do I keep losing?"],
  };
}
