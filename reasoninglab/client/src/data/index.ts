import type { Question, SkillId } from '../types'
import { patternQuestions } from './questions/pattern'
import { logicQuestions } from './questions/logic'
import { numberQuestions } from './questions/number'
import { geometryQuestions } from './questions/geometry'
import { countingQuestions } from './questions/counting'
import { combinatoricsQuestions } from './questions/combinatorics'
import { probabilityQuestions } from './questions/probability'
import { backwardsQuestions } from './questions/backwards'
import { sequencesQuestions } from './questions/sequences'
import { verbalQuestions } from './questions/verbal'
import { analyticalQuestions } from './questions/analytical'
import { mixedQuestions } from './questions/mixed'
import { generatedQuestions } from './generators'

/** the full question bank: curated + procedurally generated */
export const QUESTION_BANK: Question[] = [
  ...patternQuestions,
  ...logicQuestions,
  ...numberQuestions,
  ...geometryQuestions,
  ...countingQuestions,
  ...combinatoricsQuestions,
  ...probabilityQuestions,
  ...backwardsQuestions,
  ...sequencesQuestions,
  ...verbalQuestions,
  ...analyticalQuestions,
  ...mixedQuestions,
  ...generatedQuestions(),
]

export const QUESTION_MAP: Map<string, Question> = new Map(
  QUESTION_BANK.map((q) => [q.id, q]),
)

export function questionsForSkill(skill: SkillId): Question[] {
  return QUESTION_BANK.filter((q) => q.skill === skill)
}
