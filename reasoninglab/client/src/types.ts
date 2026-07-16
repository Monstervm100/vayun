// ── Core domain types for ReasoningLab ──────────────────────────────

export type SkillId =
  | 'pattern'
  | 'logic'
  | 'number'
  | 'geometry'
  | 'counting'
  | 'combinatorics'
  | 'probability'
  | 'backwards'
  | 'sequences'
  | 'verbal'
  | 'analytical'
  | 'mixed'

/** 1 beginner · 2 intermediate · 3 advanced · 4 competition */
export type Difficulty = 1 | 2 | 3 | 4

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
  4: 'Competition',
}

/** Elo-style rating a question of each difficulty represents. */
export const DIFFICULTY_RATING: Record<Difficulty, number> = {
  1: 900,
  2: 1100,
  3: 1300,
  4: 1500,
}

export interface SkillMeta {
  id: SkillId
  name: string
  emoji: string
  blurb: string
  color: string // viz role var, e.g. 'var(--viz-s1)'
}

// ── Declarative figures (rendered as SVG by FigureRenderer) ─────────

export interface GridCell {
  r: number
  c: number
  fill?: string // viz slot key: 's1'..'s6' | 'muted'
  label?: string
}

export type Figure =
  | { kind: 'grid'; rows: number; cols: number; cells: GridCell[] }
  | {
      kind: 'shapeRow'
      shapes: {
        shape: 'circle' | 'square' | 'triangle' | 'star' | 'diamond' | 'question'
        fill?: string
        label?: string
      }[]
    }
  | { kind: 'cubeNet'; faces: { pos: [number, number]; label: string }[] }
  | { kind: 'numberLine'; min: number; max: number; marks: { at: number; label?: string; highlight?: boolean }[] }
  | { kind: 'balance'; left: string[]; right: string[]; tilt?: 'left' | 'right' | 'even' }

// ── Questions ────────────────────────────────────────────────────────

export interface Question {
  id: string
  skill: SkillId
  difficulty: Difficulty
  grade: 5 | 6
  prompt: string
  figure?: Figure
  choices: string[]
  /** index into choices */
  answer: number
  /** three hints, progressively more helpful */
  hints: [string, string, string]
  /** step-by-step solution */
  explanation: string[]
  /** the underlying reasoning strategy, one takeaway sentence */
  strategy: string
  /** estimated solving time in seconds */
  timeEst: number
  /** cognitive complexity 1–5 */
  complexity: number
  /** prerequisite concepts */
  prereqs: string[]
  /** true when produced by a generator template */
  generated?: boolean
}

// ── Attempts, ratings, progression ──────────────────────────────────

export interface Attempt {
  qid: string
  skill: SkillId
  difficulty: Difficulty
  correct: boolean
  timeSec: number
  hintsUsed: number
  ts: number // epoch ms
}

export interface SkillState {
  rating: number
  attempts: number
  correct: number
  /** consecutive misses — drives remediation */
  missStreak: number
  /** consecutive correct answers — clears remediation */
  hitStreak: number
  /** true while the student is in easier remediation practice */
  remediation: boolean
}

export interface SrsItem {
  qid: string
  skill: SkillId
  /** epoch ms when the item is due for review */
  due: number
  /** current interval index into SRS_INTERVALS */
  step: number
}

export interface BadgeDef {
  id: string
  name: string
  emoji: string
  desc: string
}

export interface AvatarDef {
  id: string
  emoji: string
  name: string
  unlockLevel: number
}

export interface TutorMessage {
  role: 'tutor' | 'student'
  text: string
}
