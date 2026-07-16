import type { Attempt, Question, SkillId, SkillState, SrsItem } from '../types'
import { ratingToDifficulty } from './elo'
import { dueItems } from './srs'
import { skillReports } from './analytics'
import { SKILLS } from './skills'

export interface Recommendation {
  id: string
  emoji: string
  title: string
  reason: string
  /** route the card links to */
  to: string
}

/**
 * Personalised daily plan:
 *  1. clear due reviews (spaced repetition)
 *  2. shore up the weakest skill
 *  3. daily challenge for streak + variety
 *  4. stretch goal when the student is hot
 */
export function dailyRecommendations(
  skills: Record<SkillId, SkillState>,
  attempts: Attempt[],
  srsQueue: SrsItem[],
  dailyDone: boolean,
): Recommendation[] {
  const recs: Recommendation[] = []
  const due = dueItems(srsQueue)
  if (due.length > 0) {
    recs.push({
      id: 'reviews',
      emoji: '🔁',
      title: `Review ${due.length} missed question${due.length > 1 ? 's' : ''}`,
      reason: 'Spaced repetition: revisiting a miss right when you are about to forget it makes it stick.',
      to: '/practice/review',
    })
  }

  if (!dailyDone) {
    recs.push({
      id: 'daily',
      emoji: '🌞',
      title: 'Daily Challenge',
      reason: 'Three fresh questions to keep the streak alive.',
      to: '/practice/daily',
    })
  }

  const reports = skillReports(skills, attempts)
  const tried = reports.filter((r) => r.attempts >= 3)
  if (tried.length > 0) {
    const weakest = [...tried].sort((a, b) => a.rating - b.rating)[0]
    recs.push({
      id: 'weakest',
      emoji: weakest.emoji,
      title: `Train ${weakest.name}`,
      reason: `Your ${weakest.name} rating (${weakest.rating}) is your biggest growth opportunity.`,
      to: `/practice/skill/${weakest.skill}`,
    })
  }

  const untouched = reports.filter((r) => r.attempts === 0)
  if (untouched.length > 0) {
    recs.push({
      id: 'explore',
      emoji: '🗺️',
      title: `Explore ${untouched[0].name}`,
      reason: 'You have not tried this skill yet — new territory, new badge progress.',
      to: `/practice/skill/${untouched[0].skill}`,
    })
  }

  const recent = attempts.slice(-5)
  if (recent.length === 5 && recent.every((a) => a.correct)) {
    recs.push({
      id: 'stretch',
      emoji: '🚀',
      title: 'Stretch challenge',
      reason: 'Five correct in a row — time to try the Mixed Challenge set a level up!',
      to: '/practice/skill/mixed',
    })
  }

  return recs.slice(0, 4)
}

// ── Question selection for a session ─────────────────────────────────

/** deterministic PRNG so daily sets are stable per day */
export function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pickSessionQuestions(
  pool: Question[],
  skill: SkillId | 'any',
  skillState: SkillState | null,
  recentIds: Set<string>,
  count: number,
  rng: () => number = Math.random,
): Question[] {
  const targetDiff = skillState
    ? skillState.remediation
      ? (Math.max(1, ratingToDifficulty(skillState.rating) - 1) as Question['difficulty'])
      : ratingToDifficulty(skillState.rating)
    : 1

  const inSkill = pool.filter((q) => (skill === 'any' ? true : q.skill === skill))
  // prefer target difficulty, then ±1 band, avoiding recently seen questions
  const fresh = inSkill.filter((q) => !recentIds.has(q.id))
  const candidates = fresh.length >= count ? fresh : inSkill
  const scored = candidates
    .map((q) => ({ q, score: -Math.abs(q.difficulty - targetDiff) + rng() * 0.8 }))
    .sort((a, b) => b.score - a.score)
  return scored.slice(0, count).map((x) => x.q)
}

/** three questions for today's daily challenge, same for the whole day */
export function dailyChallengeQuestions(pool: Question[], dateKey: string): Question[] {
  const seed = [...dateKey].reduce((s, c) => s * 31 + c.charCodeAt(0), 7)
  const rng = mulberry32(seed)
  // one easy, one medium, one harder — from different skills
  const bands: Question['difficulty'][][] = [[1], [2], [3, 4]]
  const out: Question[] = []
  const usedSkills = new Set<SkillId>()
  for (const band of bands) {
    const options = pool.filter(
      (q) => band.includes(q.difficulty) && !usedSkills.has(q.skill) && !out.includes(q),
    )
    if (options.length === 0) continue
    const pick = options[Math.floor(rng() * options.length)]
    out.push(pick)
    usedSkills.add(pick.skill)
  }
  return out
}

/** simulated weekly tournament field — friendly bots with stable weekly scores */
export interface TournamentRow {
  name: string
  emoji: string
  score: number
  isYou?: boolean
}

export function tournamentField(weekKey: string, yourScore: number, yourAvatar: string): TournamentRow[] {
  const seed = [...weekKey].reduce((s, c) => s * 31 + c.charCodeAt(0), 13)
  const rng = mulberry32(seed)
  const bots: [string, string][] = [
    ['Ada', '🦉'], ['Blaise', '🦊'], ['Carl', '🐼'], ['Emmy', '🤖'],
    ['Katherine', '🐲'], ['Leo', '🦄'], ['Maryam', '🧙'], ['Srinivasa', '🚀'],
  ]
  const rows: TournamentRow[] = bots.map(([name, emoji]) => ({
    name,
    emoji,
    score: Math.floor(40 + rng() * 260),
  }))
  rows.push({ name: 'You', emoji: yourAvatar, score: yourScore, isYou: true })
  return rows.sort((a, b) => b.score - a.score)
}

export function skillMetaList() {
  return SKILLS
}
