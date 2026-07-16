import type { SkillId, SkillMeta } from '../types'

export const SKILLS: SkillMeta[] = [
  { id: 'pattern', name: 'Pattern Recognition', emoji: '🧩', blurb: 'Spot what repeats, grows, or transforms.', color: 'var(--viz-s1)' },
  { id: 'logic', name: 'Logical Reasoning', emoji: '🕵️', blurb: 'Deduce facts from clues that must all be true.', color: 'var(--viz-s5)' },
  { id: 'number', name: 'Number Sense', emoji: '🔢', blurb: 'Play with digits, divisibility and clever arithmetic.', color: 'var(--viz-s2)' },
  { id: 'geometry', name: 'Geometry & Spatial', emoji: '📐', blurb: 'Rotate, reflect, fold and measure shapes in your head.', color: 'var(--viz-s3)' },
  { id: 'counting', name: 'Counting', emoji: '🧮', blurb: 'Count carefully without missing or double-counting.', color: 'var(--viz-s4)' },
  { id: 'combinatorics', name: 'Combinatorics', emoji: '🎲', blurb: 'How many ways can things be arranged or chosen?', color: 'var(--viz-s6)' },
  { id: 'probability', name: 'Probability', emoji: '🎯', blurb: 'How likely is it? Reason about chance.', color: 'var(--viz-s1)' },
  { id: 'backwards', name: 'Working Backwards', emoji: '⏪', blurb: 'Start from the end and undo each step.', color: 'var(--viz-s5)' },
  { id: 'sequences', name: 'Sequences', emoji: '📈', blurb: 'Find the rule, predict the future terms.', color: 'var(--viz-s2)' },
  { id: 'verbal', name: 'Verbal Reasoning', emoji: '💬', blurb: 'Analogies, codes and word logic.', color: 'var(--viz-s3)' },
  { id: 'analytical', name: 'Analytical Reasoning', emoji: '🧠', blurb: 'Schedules, rankings and constraint puzzles.', color: 'var(--viz-s4)' },
  { id: 'mixed', name: 'Mixed Challenge', emoji: '🌈', blurb: 'Anything goes — just like a real competition.', color: 'var(--viz-s6)' },
]

export const SKILL_MAP: Record<SkillId, SkillMeta> = Object.fromEntries(
  SKILLS.map((s) => [s.id, s]),
) as Record<SkillId, SkillMeta>

export function skillName(id: SkillId): string {
  return SKILL_MAP[id]?.name ?? id
}
