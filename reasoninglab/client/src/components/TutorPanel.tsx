import { useEffect, useRef, useState } from 'react'
import type { Question, TutorMessage } from '../types'
import { SKILL_MAP } from '../lib/skills'

/**
 * AI Socratic Tutor.
 *
 * Never reveals the answer before the student solves the problem.
 * Tries the server tutor (Claude-powered when the server has an API key);
 * falls back to a local Socratic ladder built from the question's own
 * hint sequence, so the tutor always works offline.
 */

const OPENERS: Record<string, string> = {
  pattern: 'Patterns love to repeat or grow. Read the sequence out loud — what do you notice changing?',
  logic: 'Let\'s be detectives 🕵️. Which clue tells you something 100% certain? Start there.',
  number: 'Before calculating, estimate: roughly how big should the answer be?',
  geometry: 'Can you sketch it? Even a rough drawing makes shape puzzles much friendlier.',
  counting: 'Counting puzzles reward organisation. Could you count in a careful order so nothing is missed?',
  combinatorics: 'Try building one example first. Then ask: how many choices did I have at each step?',
  probability: 'First question in probability land: how many total outcomes are possible?',
  backwards: 'The end of the story is known… what was the very last step? Can you undo it?',
  sequences: 'Look at the gaps between terms. Are they constant? Growing? Doubling?',
  verbal: 'Say the relationship between the first pair of words in one short sentence.',
  analytical: 'Which clue pins something down exactly? Lock that in before anything else.',
  mixed: 'What TYPE of puzzle is this really? Naming the type is half the battle.',
}

function localTutorReply(q: Question, stage: number, solved: boolean): string {
  if (solved) {
    return `Great work thinking it through! The key idea was: ${q.strategy} Want to try a similar one from the next question?`
  }
  switch (stage) {
    case 0:
      return `${OPENERS[q.skill] ?? 'What is the question really asking?'} Try putting the problem into your own words first.`
    case 1:
      return `Here's a thought to explore: ${q.hints[0]} What does that make you want to check?`
    case 2:
      return `You're closer than you think. ${q.hints[1]} Take your time — what would that give you?`
    case 3:
      return `One more stepping stone: ${q.hints[2]} You have everything you need now — trust your reasoning!`
    default:
      return 'You\'ve got all the clues now. Pick the choice your reasoning points to — and afterwards I\'ll walk you through the full solution.'
  }
}

export default function TutorPanel({ question, solved }: { question: Question; solved: boolean }) {
  const [messages, setMessages] = useState<TutorMessage[]>([])
  const [stage, setStage] = useState(0)
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)

  // reset when the question changes
  useEffect(() => {
    setMessages([
      {
        role: 'tutor',
        text: `Hi! I'm your reasoning coach 🧠 I won't give away the answer, but I'll help YOU find it. Stuck? Tap "Nudge me".`,
      },
    ])
    setStage(0)
  }, [question.id])

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function askTutor(studentText: string | null) {
    if (studentText) setMessages((m) => [...m, { role: 'student', text: studentText }])
    setThinking(true)
    let reply: string | null = null
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: {
            prompt: question.prompt,
            choices: question.choices,
            skill: SKILL_MAP[question.skill].name,
            hints: question.hints,
            explanation: question.explanation,
            strategy: question.strategy,
          },
          stage,
          solved,
          studentMessage: studentText,
        }),
      })
      if (res.ok) {
        const data = (await res.json()) as { reply?: string }
        reply = data.reply ?? null
      }
    } catch {
      // offline / no server — fall through to local tutor
    }
    if (!reply) reply = localTutorReply(question, stage, solved)
    setMessages((m) => [...m, { role: 'tutor', text: reply! }])
    setStage((s) => Math.min(s + 1, 4))
    setThinking(false)
  }

  return (
    <div className="flex h-full min-h-[280px] flex-col rounded-2xl bg-brand-50 ring-1 ring-brand-100">
      <div className="flex items-center gap-2 border-b border-brand-100 px-4 py-2.5">
        <span className="text-lg">🦉</span>
        <div className="text-sm font-semibold text-brand-800">Socratic Tutor</div>
        <div className="ml-auto text-[11px] text-brand-400">guides, never spoils</div>
      </div>
      <div ref={scroller} className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'student' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-snug ${
                m.role === 'student'
                  ? 'rounded-br-sm bg-brand-500 text-white'
                  : 'rounded-bl-sm bg-white text-slate-700 shadow-sm'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm text-slate-400 shadow-sm">thinking…</div>
          </div>
        )}
      </div>
      <div className="border-t border-brand-100 p-2.5">
        <div className="mb-2 flex flex-wrap gap-1.5">
          <button
            onClick={() => askTutor(null)}
            disabled={thinking}
            className="rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-700 shadow-sm ring-1 ring-brand-200 hover:bg-brand-100 disabled:opacity-50"
          >
            💡 Nudge me
          </button>
          <button
            onClick={() => askTutor("I'm stuck — where do I even start?")}
            disabled={thinking}
            className="rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-700 shadow-sm ring-1 ring-brand-200 hover:bg-brand-100 disabled:opacity-50"
          >
            🙋 I'm stuck
          </button>
          {solved && (
            <button
              onClick={() => askTutor('Can you explain the reasoning strategy?')}
              disabled={thinking}
              className="rounded-full bg-white px-3 py-1 text-xs font-medium text-mint-700 shadow-sm ring-1 ring-mint-100 hover:bg-mint-100 disabled:opacity-50"
            >
              🎓 Explain the strategy
            </button>
          )}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!input.trim() || thinking) return
            askTutor(input.trim())
            setInput('')
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the tutor anything…"
            aria-label="Message the tutor"
            className="min-w-0 flex-1 rounded-full border-0 bg-white px-3.5 py-2 text-sm shadow-sm ring-1 ring-brand-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <button
            type="submit"
            disabled={thinking || !input.trim()}
            className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
