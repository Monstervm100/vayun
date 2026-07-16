import { DIFFICULTY_RATING, type Difficulty } from '../types'

/**
 * Chess.com-style adaptive rating.
 *
 * Every question carries an implicit rating from its difficulty band.
 * The student has an overall rating plus one per reasoning skill.
 * Correct answers move ratings up by the surprise factor of the win;
 * misses move them down the same way.
 */

export const START_RATING = 1000
export const MIN_RATING = 400
export const MAX_RATING = 2000

/** probability the student answers correctly, per Elo expectation */
export function expectedScore(studentRating: number, questionRating: number): number {
  return 1 / (1 + Math.pow(10, (questionRating - studentRating) / 400))
}

export interface RatingUpdate {
  next: number
  delta: number
}

/**
 * K is larger for the per-skill rating (moves fast, reflects recent form)
 * and smaller for the overall rating (stable headline number).
 * Hints reduce the credit for a correct answer but never turn it negative.
 */
export function updateRating(
  current: number,
  difficulty: Difficulty,
  correct: boolean,
  hintsUsed: number,
  k: number,
): RatingUpdate {
  const qRating = DIFFICULTY_RATING[difficulty]
  const expected = expectedScore(current, qRating)
  const score = correct ? Math.max(0.4, 1 - hintsUsed * 0.2) : 0
  const raw = k * (score - expected)
  const delta = Math.round(raw)
  const next = Math.min(MAX_RATING, Math.max(MIN_RATING, current + delta))
  return { next, delta: next - current }
}

export const K_SKILL = 40
export const K_OVERALL = 20

/** map a rating to the difficulty band the student should practise at */
export function ratingToDifficulty(rating: number): Difficulty {
  if (rating < 1000) return 1
  if (rating < 1200) return 2
  if (rating < 1400) return 3
  return 4
}

/** 0–100 projected readiness for a Kangaroo-style contest */
export function competitionReadiness(overallRating: number, totalAttempts: number): number {
  const ratingPart = Math.max(0, Math.min(1, (overallRating - 800) / 700))
  // confidence grows with practice volume; caps at 60 attempts
  const volumePart = Math.min(1, totalAttempts / 60)
  return Math.round(ratingPart * 80 + volumePart * 20)
}

export function readinessLabel(pct: number): string {
  if (pct >= 80) return 'Competition ready! 🏆'
  if (pct >= 60) return 'Almost there — keep sharpening'
  if (pct >= 40) return 'Good progress, training pays off'
  if (pct >= 20) return 'Warming up'
  return 'Just getting started'
}
