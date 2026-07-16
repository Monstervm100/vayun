import type { Attempt, BadgeDef, AvatarDef, Difficulty } from '../types'

// ── XP & levels ──────────────────────────────────────────────────────

const XP_BY_DIFFICULTY: Record<Difficulty, number> = { 1: 10, 2: 18, 3: 30, 4: 50 }

export function xpForAttempt(difficulty: Difficulty, correct: boolean, hintsUsed: number): number {
  if (!correct) return 2 // effort still counts a little
  const base = XP_BY_DIFFICULTY[difficulty]
  return Math.max(Math.round(base * 0.4), base - hintsUsed * 5)
}

/** XP needed to go from level n to n+1 grows gently */
export function xpForLevel(level: number): number {
  return 80 + (level - 1) * 40
}

export function levelFromXp(totalXp: number): { level: number; into: number; needed: number } {
  let level = 1
  let rest = totalXp
  while (rest >= xpForLevel(level)) {
    rest -= xpForLevel(level)
    level += 1
  }
  return { level, into: rest, needed: xpForLevel(level) }
}

export const LEVEL_TITLES = [
  'Spark', 'Explorer', 'Puzzler', 'Thinker', 'Strategist',
  'Pattern Hunter', 'Logic Knight', 'Number Ninja', 'Mind Athlete', 'Grandmaster of Reason',
]

export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.floor((level - 1) / 2))]
}

// ── Badges ───────────────────────────────────────────────────────────

export const BADGES: BadgeDef[] = [
  { id: 'first-solve', name: 'First Steps', emoji: '👣', desc: 'Solve your first question' },
  { id: 'ten-solves', name: 'Double Digits', emoji: '🔟', desc: 'Solve 10 questions' },
  { id: 'fifty-solves', name: 'Half Century', emoji: '⭐', desc: 'Solve 50 questions' },
  { id: 'streak-3', name: 'On a Roll', emoji: '🔥', desc: '3-day practice streak' },
  { id: 'streak-7', name: 'Week Warrior', emoji: '🗓️', desc: '7-day practice streak' },
  { id: 'no-hints-5', name: 'Solo Solver', emoji: '🦉', desc: '5 correct in a row without hints' },
  { id: 'speedster', name: 'Speedster', emoji: '⚡', desc: 'Correct answer in under 20 seconds' },
  { id: 'comeback', name: 'Comeback Kid', emoji: '💪', desc: 'Clear a remediation round' },
  { id: 'competition-solve', name: 'Giant Slayer', emoji: '🐉', desc: 'Solve a competition-level question' },
  { id: 'all-skills', name: 'Explorer of Everything', emoji: '🗺️', desc: 'Try every reasoning skill' },
  { id: 'daily-5', name: 'Daily Champion', emoji: '🌞', desc: 'Complete 5 daily challenges' },
  { id: 'rating-1200', name: 'Rising Star', emoji: '🌟', desc: 'Reach a 1200 rating' },
  { id: 'rating-1400', name: 'Master Mind', emoji: '🧠', desc: 'Reach a 1400 rating' },
  { id: 'reviewer', name: 'Second Look', emoji: '🔁', desc: 'Clear 10 review questions' },
  { id: 'tournament', name: 'Podium Finish', emoji: '🏅', desc: 'Finish top 3 in a weekly tournament' },
]

export const BADGE_MAP = Object.fromEntries(BADGES.map((b) => [b.id, b]))

// ── Avatars (collectible, unlocked by level) ─────────────────────────

export const AVATARS: AvatarDef[] = [
  { id: 'fox', emoji: '🦊', name: 'Clever Fox', unlockLevel: 1 },
  { id: 'owl', emoji: '🦉', name: 'Wise Owl', unlockLevel: 1 },
  { id: 'panda', emoji: '🐼', name: 'Puzzle Panda', unlockLevel: 3 },
  { id: 'robot', emoji: '🤖', name: 'Logic Bot', unlockLevel: 5 },
  { id: 'dragon', emoji: '🐲', name: 'Number Dragon', unlockLevel: 8 },
  { id: 'unicorn', emoji: '🦄', name: 'Rare Reasoner', unlockLevel: 11 },
  { id: 'wizard', emoji: '🧙', name: 'Math Wizard', unlockLevel: 14 },
  { id: 'rocket', emoji: '🚀', name: 'Rocket Brain', unlockLevel: 18 },
]

// ── Streaks ──────────────────────────────────────────────────────────

export function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export function updateStreak(
  streak: { current: number; best: number; lastDay: string },
  now = Date.now(),
): { current: number; best: number; lastDay: string } {
  const today = dayKey(now)
  if (streak.lastDay === today) return streak
  const yesterday = dayKey(now - 24 * 60 * 60 * 1000)
  const current = streak.lastDay === yesterday ? streak.current + 1 : 1
  return { current, best: Math.max(streak.best, current), lastDay: today }
}

// ── Badge evaluation ────────────────────────────────────────────────

export interface BadgeContext {
  attempts: Attempt[]
  streak: { current: number; best: number }
  overallRating: number
  skillsTried: number
  totalSkills: number
  dailiesCompleted: number
  reviewsCleared: number
  remediationsCleared: number
  tournamentPodiums: number
}

export function earnedBadges(ctx: BadgeContext): string[] {
  const out: string[] = []
  const correct = ctx.attempts.filter((a) => a.correct)
  if (correct.length >= 1) out.push('first-solve')
  if (correct.length >= 10) out.push('ten-solves')
  if (correct.length >= 50) out.push('fifty-solves')
  if (ctx.streak.best >= 3) out.push('streak-3')
  if (ctx.streak.best >= 7) out.push('streak-7')
  if (correct.some((a) => a.timeSec < 20)) out.push('speedster')
  if (correct.some((a) => a.difficulty === 4)) out.push('competition-solve')
  if (ctx.skillsTried >= ctx.totalSkills) out.push('all-skills')
  if (ctx.dailiesCompleted >= 5) out.push('daily-5')
  if (ctx.overallRating >= 1200) out.push('rating-1200')
  if (ctx.overallRating >= 1400) out.push('rating-1400')
  if (ctx.reviewsCleared >= 10) out.push('reviewer')
  if (ctx.remediationsCleared >= 1) out.push('comeback')
  if (ctx.tournamentPodiums >= 1) out.push('tournament')
  // 5 correct in a row without hints
  let run = 0
  for (const a of ctx.attempts) {
    run = a.correct && a.hintsUsed === 0 ? run + 1 : 0
    if (run >= 5) { out.push('no-hints-5'); break }
  }
  return out
}
