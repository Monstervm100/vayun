import Anthropic from '@anthropic-ai/sdk'

/**
 * AI Socratic Tutor backend.
 *
 * When ANTHROPIC_API_KEY (or an `ant auth login` profile) is available, the
 * tutor is powered by Claude. Without credentials it returns null and the
 * client falls back to its built-in rule-based Socratic ladder, so the app
 * is fully functional offline.
 */

export interface TutorRequest {
  question: {
    prompt: string
    choices: string[]
    skill: string
    hints: [string, string, string]
    explanation: string[]
    strategy: string
  }
  stage: number
  solved: boolean
  studentMessage: string | null
}

const SYSTEM_PROMPT = `You are the Socratic tutor inside ReasoningLab, a math-reasoning practice app for children aged 10-12 preparing for competitions like Math Kangaroo.

Rules you must always follow:
- NEVER state or imply which answer choice is correct while the problem is unsolved. Never do the decisive calculation for the student.
- Guide with questions: help the student restate the problem, notice patterns, try small cases, and check their own ideas.
- Escalate gently: early messages give the lightest possible nudge; later messages may point more directly at the key idea (you receive the question's own hint ladder — stay consistent with it).
- After the problem is solved (solved=true), you may explain the full reasoning warmly and name the underlying strategy.
- Tone: encouraging, playful, concise — 1 to 3 short sentences, maximum one emoji. Never condescending.
- If the student asks for the answer directly, kindly decline and offer a stronger hint instead.
- If the student proposes reasoning, respond to THEIR idea first (praise what is right, question what is shaky) before adding anything new.`

let client: Anthropic | null = null
function getClient(): Anthropic | null {
  if (client) return client
  try {
    // Zero-arg constructor resolves ANTHROPIC_API_KEY / auth profile.
    client = new Anthropic()
    return client
  } catch {
    return null
  }
}

export function hasTutorCredentials(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN)
}

export async function tutorReply(req: TutorRequest): Promise<string | null> {
  if (!hasTutorCredentials()) return null
  const anthropic = getClient()
  if (!anthropic) return null

  const context = [
    `Problem (${req.question.skill}): ${req.question.prompt}`,
    `Choices: ${req.question.choices.join(' | ')}`,
    `Hint ladder: 1) ${req.question.hints[0]} 2) ${req.question.hints[1]} 3) ${req.question.hints[2]}`,
    `Strategy takeaway: ${req.question.strategy}`,
    req.solved ? `The student has now SOLVED the problem. Full solution: ${req.question.explanation.join(' ')}` : `The student has NOT yet solved the problem. Nudge level so far: ${req.stage} of 4.`,
  ].join('\n')

  const userText = req.studentMessage
    ? `Student says: "${req.studentMessage}"`
    : 'The student tapped "Nudge me" and wants the next gentle push.'

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 300,
      thinking: { type: 'adaptive' },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `${context}\n\n${userText}` }],
    })
    if (response.stop_reason === 'refusal') return null
    const text = response.content.find((b) => b.type === 'text')
    return text && 'text' in text ? text.text : null
  } catch (err) {
    console.error('[tutor] Claude call failed:', err instanceof Error ? err.message : err)
    return null
  }
}
