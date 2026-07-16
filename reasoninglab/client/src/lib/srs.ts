import type { SrsItem, Question } from '../types'

/**
 * Light spaced-repetition scheduler for missed questions.
 * A miss enqueues the question; each successful review pushes it to the
 * next interval; a failed review resets it to the first interval.
 */

const DAY = 24 * 60 * 60 * 1000

/** review intervals in days: same-day-ish, then spreading out */
export const SRS_INTERVALS = [0.5, 1, 3, 7, 14]

export function enqueueMiss(queue: SrsItem[], q: Question, now = Date.now()): SrsItem[] {
  const existing = queue.find((i) => i.qid === q.id)
  if (existing) {
    return queue.map((i) =>
      i.qid === q.id ? { ...i, step: 0, due: now + SRS_INTERVALS[0] * DAY } : i,
    )
  }
  return [...queue, { qid: q.id, skill: q.skill, step: 0, due: now + SRS_INTERVALS[0] * DAY }]
}

/** call after the student answers a due review item */
export function reviewOutcome(queue: SrsItem[], qid: string, correct: boolean, now = Date.now()): SrsItem[] {
  return queue.flatMap((i) => {
    if (i.qid !== qid) return [i]
    if (!correct) return [{ ...i, step: 0, due: now + SRS_INTERVALS[0] * DAY }]
    const nextStep = i.step + 1
    if (nextStep >= SRS_INTERVALS.length) return [] // graduated 🎓
    return [{ ...i, step: nextStep, due: now + SRS_INTERVALS[nextStep] * DAY }]
  })
}

export function dueItems(queue: SrsItem[], now = Date.now()): SrsItem[] {
  return queue.filter((i) => i.due <= now)
}
