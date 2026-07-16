/** Achievement catalog. `check` runs against the store state after every relevant event. */

interface StateLike {
  xp: number;
  streak: number;
  puzzleLog: { solved: boolean; theme: string }[];
  puzzleRating: number;
  lessonProgress: Record<string, { status: string }>;
  patternMastery: Record<string, number>;
  openingProgress: Record<string, { studied: boolean }>;
  endgameProgress: Record<string, boolean>;
  games: { result: string; analysis?: { accuracy: number } }[];
  session: { steps: { done: boolean }[] } | null;
  profile: { onboarded: boolean };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  check: (s: StateLike) => boolean;
}

const solvedCount = (s: StateLike) => s.puzzleLog.filter((p) => p.solved).length;
const lessonsDone = (s: StateLike) =>
  Object.values(s.lessonProgress).filter((l) => l.status === "complete").length;

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-steps", title: "First Steps", description: "Complete onboarding and meet your coach", icon: "👋", check: (s) => s.profile.onboarded },
  { id: "first-lesson", title: "Scholar", description: "Complete your first lesson", icon: "📖", check: (s) => lessonsDone(s) >= 1 },
  { id: "five-lessons", title: "Dedicated Student", description: "Complete 5 lessons", icon: "🎓", check: (s) => lessonsDone(s) >= 5 },
  { id: "fifteen-lessons", title: "Chess Professor", description: "Complete 15 lessons", icon: "🧑‍🏫", check: (s) => lessonsDone(s) >= 15 },
  { id: "first-puzzle", title: "Puzzler", description: "Solve your first puzzle", icon: "🧩", check: (s) => solvedCount(s) >= 1 },
  { id: "puzzle-25", title: "Puzzle Master", description: "Solve 25 puzzles", icon: "🏅", check: (s) => solvedCount(s) >= 25 },
  { id: "puzzle-100", title: "Tactical Genius", description: "Solve 100 puzzles", icon: "⚡", check: (s) => solvedCount(s) >= 100 },
  { id: "puzzle-800", title: "Sharp Eyes", description: "Reach 800 puzzle rating", icon: "👀", check: (s) => s.puzzleRating >= 800 },
  { id: "puzzle-1200", title: "Eagle Eyes", description: "Reach 1200 puzzle rating", icon: "🦅", check: (s) => s.puzzleRating >= 1200 },
  { id: "fork-fan", title: "Fork Fanatic", description: "Solve 10 fork puzzles", icon: "🍴", check: (s) => s.puzzleLog.filter((p) => p.solved && p.theme === "fork").length >= 10 },
  { id: "streak-3", title: "On Fire", description: "Keep a 3-day learning streak", icon: "🔥", check: (s) => s.streak >= 3 },
  { id: "streak-7", title: "Unstoppable", description: "Keep a 7-day learning streak", icon: "🌟", check: (s) => s.streak >= 7 },
  { id: "streak-30", title: "Grandmaster Habits", description: "Keep a 30-day learning streak", icon: "💎", check: (s) => s.streak >= 30 },
  { id: "first-win", title: "First Victory", description: "Win your first game", icon: "🏆", check: (s) => s.games.some((g) => g.result === "win") },
  { id: "five-wins", title: "Winner's Circle", description: "Win 5 games", icon: "🥇", check: (s) => s.games.filter((g) => g.result === "win").length >= 5 },
  { id: "accurate-game", title: "Precision Play", description: "Finish a game with 85%+ accuracy", icon: "🎯", check: (s) => s.games.some((g) => (g.analysis?.accuracy ?? 0) >= 85) },
  { id: "mate-master", title: "Checkmate Artist", description: "Master 3 checkmate patterns", icon: "♔", check: (s) => Object.values(s.patternMastery).filter((c) => c >= 3).length >= 3 },
  { id: "opening-explorer", title: "Opening Explorer", description: "Study 3 different openings", icon: "🗺️", check: (s) => Object.values(s.openingProgress).filter((o) => o.studied).length >= 3 },
  { id: "endgame-hero", title: "Endgame Hero", description: "Pass 3 endgame drills", icon: "🏰", check: (s) => Object.values(s.endgameProgress).filter(Boolean).length >= 3 },
  { id: "xp-500", title: "Rising Star", description: "Earn 500 XP", icon: "⭐", check: (s) => s.xp >= 500 },
  { id: "xp-2000", title: "Chess Champion", description: "Earn 2,000 XP", icon: "🌠", check: (s) => s.xp >= 2000 },
  { id: "full-session", title: "Perfect Session", description: "Complete every step of a coach session", icon: "✅", check: (s) => !!s.session && s.session.steps.length > 0 && s.session.steps.every((st) => st.done) },
];

export const achievementById = (id: string) => ACHIEVEMENTS.find((a) => a.id === id);
