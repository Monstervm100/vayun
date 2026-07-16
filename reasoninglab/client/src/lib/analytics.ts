import type { Attempt, SkillId, SkillState } from '../types'
import { SKILLS } from './skills'

// ── Aggregates used by both dashboards ──────────────────────────────

export function accuracy(attempts: Attempt[]): number {
  if (attempts.length === 0) return 0
  return Math.round((attempts.filter((a) => a.correct).length / attempts.length) * 100)
}

export function avgTime(attempts: Attempt[]): number {
  if (attempts.length === 0) return 0
  return Math.round(attempts.reduce((s, a) => s + a.timeSec, 0) / attempts.length)
}

export function totalMinutes(attempts: Attempt[]): number {
  return Math.round(attempts.reduce((s, a) => s + a.timeSec, 0) / 60)
}

export function attemptsSince(attempts: Attempt[], sinceMs: number): Attempt[] {
  return attempts.filter((a) => a.ts >= sinceMs)
}

const DAY = 24 * 60 * 60 * 1000

/** last N days of activity as {label, count, correct, minutes} — for trend charts */
export function dailySeries(attempts: Attempt[], days: number, now = Date.now()) {
  const out: { label: string; count: number; correct: number; minutes: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const start = new Date(now - i * DAY)
    start.setHours(0, 0, 0, 0)
    const end = start.getTime() + DAY
    const dayAttempts = attempts.filter((a) => a.ts >= start.getTime() && a.ts < end)
    out.push({
      label: start.toLocaleDateString(undefined, { weekday: 'short' }),
      count: dayAttempts.length,
      correct: dayAttempts.filter((a) => a.correct).length,
      minutes: Math.round(dayAttempts.reduce((s, a) => s + a.timeSec, 0) / 60),
    })
  }
  return out
}

/** rating history reconstructed from attempts (overall rating over time) */
export function ratingHistory(attempts: Attempt[], deltas: number[], startRating: number) {
  // deltas[i] corresponds to attempts[i] (overall-rating delta recorded per attempt)
  const pts: { ts: number; rating: number }[] = [{ ts: attempts[0]?.ts ?? Date.now(), rating: startRating }]
  let r = startRating
  attempts.forEach((a, i) => {
    r += deltas[i] ?? 0
    pts.push({ ts: a.ts, rating: r })
  })
  return pts
}

// ── Skill strength / weakness ────────────────────────────────────────

export interface SkillReport {
  skill: SkillId
  name: string
  emoji: string
  rating: number
  attempts: number
  accuracy: number
  mastery: number // 0–100
}

export function skillReports(
  skills: Record<SkillId, SkillState>,
  attempts: Attempt[],
): SkillReport[] {
  return SKILLS.map((meta) => {
    const st = skills[meta.id]
    const skillAttempts = attempts.filter((a) => a.skill === meta.id)
    const acc = accuracy(skillAttempts)
    // mastery blends rating position with demonstrated volume
    const ratingPart = Math.max(0, Math.min(1, (st.rating - 800) / 700))
    const volumePart = Math.min(1, skillAttempts.length / 15)
    return {
      skill: meta.id,
      name: meta.name,
      emoji: meta.emoji,
      rating: st.rating,
      attempts: skillAttempts.length,
      accuracy: acc,
      mastery: Math.round(ratingPart * 70 + volumePart * 30),
    }
  })
}

export function strongestAndWeakest(reports: SkillReport[]) {
  const tried = reports.filter((r) => r.attempts >= 3)
  if (tried.length === 0) return { strongest: null, weakest: null }
  const sorted = [...tried].sort((a, b) => b.rating - a.rating)
  return { strongest: sorted[0], weakest: sorted[sorted.length - 1] }
}

// ── Misconception / error-pattern detection ─────────────────────────

export interface ErrorPattern {
  id: string
  title: string
  detail: string
  suggestion: string
}

export function detectErrorPatterns(attempts: Attempt[]): ErrorPattern[] {
  const out: ErrorPattern[] = []
  const recent = attempts.slice(-40)
  const misses = recent.filter((a) => !a.correct)
  if (recent.length < 5) return out

  // Rushing: wrong answers submitted much faster than the average
  const avg = avgTime(recent)
  const rushed = misses.filter((a) => a.timeSec < Math.max(15, avg * 0.5))
  if (rushed.length >= 3) {
    out.push({
      id: 'rushing',
      title: 'Rushing on hard questions',
      detail: `${rushed.length} recent misses were answered in under half the usual time.`,
      suggestion: 'Encourage a "read it twice" habit — restate the question before choosing an answer.',
    })
  }

  // Skill cluster: one skill dominates recent misses
  const bySkill = new Map<SkillId, number>()
  misses.forEach((a) => bySkill.set(a.skill, (bySkill.get(a.skill) ?? 0) + 1))
  for (const [skill, count] of bySkill) {
    if (count >= 3 && count >= misses.length * 0.4) {
      const meta = SKILLS.find((s) => s.id === skill)!
      out.push({
        id: `cluster-${skill}`,
        title: `${meta.name} needs attention`,
        detail: `${count} of the last ${misses.length} mistakes were ${meta.name} questions.`,
        suggestion: `Do a short ${meta.name} session at an easier level to rebuild confidence.`,
      })
    }
  }

  // Hint dependence: many correct answers rely on 2+ hints
  const hintHeavy = recent.filter((a) => a.correct && a.hintsUsed >= 2)
  if (hintHeavy.length >= 4) {
    out.push({
      id: 'hint-dependence',
      title: 'Leaning on hints',
      detail: `${hintHeavy.length} recent solves needed two or more hints.`,
      suggestion: 'Try a "one minute before hints" rule to build independent problem-solving stamina.',
    })
  }

  // Difficulty wall: accuracy collapses at a specific difficulty
  for (const d of [2, 3, 4] as const) {
    const atLevel = recent.filter((a) => a.difficulty === d)
    if (atLevel.length >= 5 && accuracy(atLevel) < 35) {
      out.push({
        id: `wall-${d}`,
        title: `Hitting a wall at ${['', 'Beginner', 'Intermediate', 'Advanced', 'Competition'][d]} level`,
        detail: `Accuracy at this level is ${accuracy(atLevel)}% over ${atLevel.length} questions.`,
        suggestion: 'The adaptive engine will step difficulty down briefly — celebrate the fundamentals.',
      })
    }
  }

  return out
}

// ── Parent-facing weekly summary ─────────────────────────────────────

export interface WeeklyReport {
  questions: number
  accuracy: number
  minutes: number
  activeDays: number
  ratingChange: number
  bestSkill: string | null
  focusSkill: string | null
  suggestions: string[]
}

export function weeklyReport(
  attempts: Attempt[],
  deltas: number[],
  reports: SkillReport[],
  now = Date.now(),
): WeeklyReport {
  const weekStart = now - 7 * DAY
  const week = attempts.filter((a) => a.ts >= weekStart)
  const weekDeltas = attempts
    .map((a, i) => ({ a, d: deltas[i] ?? 0 }))
    .filter((x) => x.a.ts >= weekStart)
  const days = new Set(week.map((a) => new Date(a.ts).toDateString()))
  const { strongest, weakest } = strongestAndWeakest(reports)

  const suggestions: string[] = []
  if (week.length === 0) {
    suggestions.push('No practice this week — even 10 minutes rebuilds momentum. Try a Daily Challenge together.')
  } else {
    if (days.size < 3) suggestions.push('Short, frequent sessions beat long ones — aim for 4+ days next week.')
    if (weakest) suggestions.push(`Spend one session on ${weakest.name} — it is currently the weakest skill.`)
    if (accuracy(week) > 85) suggestions.push('Accuracy is very high — the difficulty can go up. Encourage the "Advanced" band.')
    if (avgTime(week) > 120) suggestions.push('Solving time is long; hints are a healthy way to stay unstuck rather than giving up.')
  }
  suggestions.push('Ask your child to explain one solved problem out loud — teaching cements reasoning.')

  return {
    questions: week.length,
    accuracy: accuracy(week),
    minutes: totalMinutes(week),
    activeDays: days.size,
    ratingChange: weekDeltas.reduce((s, x) => s + x.d, 0),
    bestSkill: strongest?.name ?? null,
    focusSkill: weakest?.name ?? null,
    suggestions,
  }
}
