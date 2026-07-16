import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Attempt, Question, SkillId, SkillState, SrsItem } from '../types'
import { K_OVERALL, K_SKILL, START_RATING, updateRating } from '../lib/elo'
import { enqueueMiss, reviewOutcome } from '../lib/srs'
import { dayKey, earnedBadges, updateStreak, xpForAttempt } from '../lib/xp'
import { SKILLS } from '../lib/skills'

function freshSkillState(): SkillState {
  return { rating: START_RATING, attempts: 0, correct: 0, missStreak: 0, hitStreak: 0, remediation: false }
}

function freshSkills(): Record<SkillId, SkillState> {
  return Object.fromEntries(SKILLS.map((s) => [s.id, freshSkillState()])) as Record<SkillId, SkillState>
}

export function weekKey(now = Date.now()): string {
  const d = new Date(now)
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.floor((d.getTime() - jan1.getTime()) / (7 * 24 * 60 * 60 * 1000))
  return `${d.getFullYear()}-w${week}`
}

export interface AttemptOptions {
  review?: boolean
  daily?: boolean
}

interface State {
  // profile
  name: string
  grade: 5 | 6
  avatarId: string
  onboarded: boolean
  // progression
  overallRating: number
  skills: Record<SkillId, SkillState>
  xp: number
  attempts: Attempt[]
  /** overall-rating delta per attempt (parallel to attempts) */
  overallDeltas: number[]
  srsQueue: SrsItem[]
  badges: string[]
  streak: { current: number; best: number; lastDay: string }
  // engagement
  daily: { date: string; done: number }
  dailiesCompleted: number
  reviewsCleared: number
  remediationsCleared: number
  tournament: { week: string; score: number; podiums: number }
  recentIds: string[]
  // actions
  setProfile: (name: string, grade: 5 | 6, avatarId: string) => void
  setAvatar: (avatarId: string) => void
  recordAttempt: (q: Question, correct: boolean, timeSec: number, hintsUsed: number, opts?: AttemptOptions) => void
  bumpDaily: () => void
  awardPodium: () => void
  resetAll: () => void
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      name: '',
      grade: 5,
      avatarId: 'fox',
      onboarded: false,
      overallRating: START_RATING,
      skills: freshSkills(),
      xp: 0,
      attempts: [],
      overallDeltas: [],
      srsQueue: [],
      badges: [],
      streak: { current: 0, best: 0, lastDay: '' },
      daily: { date: '', done: 0 },
      dailiesCompleted: 0,
      reviewsCleared: 0,
      remediationsCleared: 0,
      tournament: { week: weekKey(), score: 0, podiums: 0 },
      recentIds: [],

      setProfile: (name, grade, avatarId) => set({ name, grade, avatarId, onboarded: true }),
      setAvatar: (avatarId) => set({ avatarId }),

      recordAttempt: (q, correct, timeSec, hintsUsed, opts = {}) => {
        const s = get()
        const now = Date.now()

        // ── adaptive ratings ──
        const skillState = s.skills[q.skill] ?? freshSkillState()
        const skillUpd = updateRating(skillState.rating, q.difficulty, correct, hintsUsed, K_SKILL)
        const overallUpd = updateRating(s.overallRating, q.difficulty, correct, hintsUsed, K_OVERALL)

        // ── remediation state machine ──
        let { missStreak, hitStreak, remediation } = skillState
        let remediationsCleared = s.remediationsCleared
        if (correct) {
          hitStreak += 1
          missStreak = 0
          if (remediation && hitStreak >= 2) {
            remediation = false
            remediationsCleared += 1
          }
        } else {
          missStreak += 1
          hitStreak = 0
          if (missStreak >= 3) remediation = true
        }

        const nextSkill: SkillState = {
          rating: skillUpd.next,
          attempts: skillState.attempts + 1,
          correct: skillState.correct + (correct ? 1 : 0),
          missStreak,
          hitStreak,
          remediation,
        }

        // ── spaced repetition ──
        let srsQueue = s.srsQueue
        let reviewsCleared = s.reviewsCleared
        if (opts.review) {
          srsQueue = reviewOutcome(srsQueue, q.id, correct, now)
          if (correct) reviewsCleared += 1
        } else if (!correct) {
          srsQueue = enqueueMiss(srsQueue, q, now)
        }

        // ── xp, streak, tournament ──
        const gained = xpForAttempt(q.difficulty, correct, hintsUsed)
        const streak = updateStreak(s.streak, now)
        const wk = weekKey(now)
        const tournament =
          s.tournament.week === wk
            ? { ...s.tournament, score: s.tournament.score + (correct ? gained : 0) }
            : { week: wk, score: correct ? gained : 0, podiums: s.tournament.podiums }

        const attempt: Attempt = {
          qid: q.id, skill: q.skill, difficulty: q.difficulty,
          correct, timeSec, hintsUsed, ts: now,
        }
        const attempts = [...s.attempts, attempt]
        const overallDeltas = [...s.overallDeltas, overallUpd.delta]

        // ── daily challenge progress ──
        const today = dayKey(now)
        let daily = s.daily.date === today ? s.daily : { date: today, done: 0 }
        let dailiesCompleted = s.dailiesCompleted
        if (opts.daily) {
          daily = { date: today, done: daily.done + 1 }
          if (daily.done === 3) dailiesCompleted += 1
        }

        // ── badges ──
        const skills = { ...s.skills, [q.skill]: nextSkill }
        const skillsTried = Object.values(skills).filter((st) => st.attempts > 0).length
        const badges = earnedBadges({
          attempts,
          streak,
          overallRating: overallUpd.next,
          skillsTried,
          totalSkills: SKILLS.length,
          dailiesCompleted,
          reviewsCleared,
          remediationsCleared,
          tournamentPodiums: tournament.podiums,
        })

        const recentIds = [...s.recentIds, q.id].slice(-40)

        set({
          skills, overallRating: overallUpd.next, xp: s.xp + gained,
          attempts, overallDeltas, srsQueue, badges, streak,
          daily, dailiesCompleted, reviewsCleared, remediationsCleared,
          tournament, recentIds,
        })
      },

      bumpDaily: () => {
        const s = get()
        const today = dayKey(Date.now())
        if (s.daily.date !== today) set({ daily: { date: today, done: 0 } })
      },

      awardPodium: () => {
        const s = get()
        set({ tournament: { ...s.tournament, podiums: s.tournament.podiums + 1 } })
      },

      resetAll: () =>
        set({
          overallRating: START_RATING, skills: freshSkills(), xp: 0,
          attempts: [], overallDeltas: [], srsQueue: [], badges: [],
          streak: { current: 0, best: 0, lastDay: '' },
          daily: { date: '', done: 0 }, dailiesCompleted: 0,
          reviewsCleared: 0, remediationsCleared: 0,
          tournament: { week: weekKey(), score: 0, podiums: 0 },
          recentIds: [],
        }),
    }),
    { name: 'reasoninglab-v1' },
  ),
)
