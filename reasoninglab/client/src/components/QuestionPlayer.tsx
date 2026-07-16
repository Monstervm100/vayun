import { useEffect, useMemo, useRef, useState } from 'react'
import type { Question } from '../types'
import { DIFFICULTY_LABELS } from '../types'
import { SKILL_MAP } from '../lib/skills'
import FigureRenderer from './FigureRenderer'
import TutorPanel from './TutorPanel'

const DIFF_BADGE: Record<number, string> = {
  1: 'bg-mint-100 text-mint-700',
  2: 'bg-sky-100 text-sky-700',
  3: 'bg-sun-100 text-amber-700',
  4: 'bg-coral-100 text-coral-500',
}

export interface AttemptResult {
  correct: boolean
  timeSec: number
  hintsUsed: number
}

export default function QuestionPlayer({
  question,
  index,
  total,
  onAnswered,
  onNext,
}: {
  question: Question
  index: number
  total: number
  /** fires once, the moment an answer is locked in */
  onAnswered: (r: AttemptResult) => void
  onNext: () => void
}) {
  const [picked, setPicked] = useState<number | null>(null)
  const [hintsShown, setHintsShown] = useState(0)
  const [showTutor, setShowTutor] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(Date.now())
  const answeredRef = useRef(false)

  // reset per question
  useEffect(() => {
    setPicked(null)
    setHintsShown(0)
    setElapsed(0)
    startRef.current = Date.now()
    answeredRef.current = false
  }, [question.id])

  useEffect(() => {
    const t = setInterval(() => {
      if (!answeredRef.current) setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
    return () => clearInterval(t)
  }, [question.id])

  const solved = picked !== null
  const correct = picked === question.answer
  const meta = SKILL_MAP[question.skill]

  const choiceLetters = useMemo(() => ['A', 'B', 'C', 'D', 'E'], [])

  function pick(i: number) {
    if (answeredRef.current) return
    answeredRef.current = true
    setPicked(i)
    onAnswered({
      correct: i === question.answer,
      timeSec: Math.max(1, Math.round((Date.now() - startRef.current) / 1000)),
      hintsUsed: hintsShown,
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 rise-in">
        {/* header row */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
            Question {index + 1} / {total}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
            {meta.emoji} {meta.name}
          </span>
          <span className={`rounded-full px-2.5 py-1 font-medium ${DIFF_BADGE[question.difficulty]}`}>
            {DIFFICULTY_LABELS[question.difficulty]}
          </span>
          {question.generated && (
            <span className="rounded-full bg-brand-100 px-2.5 py-1 font-medium text-brand-700">✨ AI-generated</span>
          )}
          <span className="ml-auto tabular-nums text-slate-400" aria-label="Time elapsed">
            ⏱ {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
          </span>
        </div>

        {/* prompt */}
        <p className="text-base font-medium leading-relaxed text-slate-800 sm:text-lg">{question.prompt}</p>

        {question.figure && (
          <div className="my-4 rounded-xl bg-slate-50 p-3">
            <FigureRenderer figure={question.figure} />
          </div>
        )}

        {/* choices */}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {question.choices.map((c, i) => {
            let style = 'bg-slate-50 ring-1 ring-slate-200 hover:bg-brand-50 hover:ring-brand-300'
            if (solved) {
              if (i === question.answer) style = 'bg-mint-100 ring-2 ring-mint-500'
              else if (i === picked) style = 'bg-coral-100 ring-2 ring-coral-500 shake'
              else style = 'bg-slate-50 ring-1 ring-slate-200 opacity-60'
            }
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={solved}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-800 transition sm:text-base ${style}`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                  {choiceLetters[i]}
                </span>
                {c}
                {solved && i === question.answer && <span className="ml-auto">✅</span>}
                {solved && i === picked && i !== question.answer && <span className="ml-auto">❌</span>}
              </button>
            )
          })}
        </div>

        {/* hint ladder (pre-answer) */}
        {!solved && (
          <div className="mt-4">
            {hintsShown > 0 && (
              <ol className="mb-2 space-y-1.5">
                {question.hints.slice(0, hintsShown).map((h, i) => (
                  <li key={i} className="rounded-lg bg-sun-100 px-3 py-2 text-sm text-amber-800 pop">
                    <span className="font-semibold">Hint {i + 1}:</span> {h}
                  </li>
                ))}
              </ol>
            )}
            <div className="flex flex-wrap gap-2">
              {hintsShown < 3 && (
                <button
                  onClick={() => setHintsShown((h) => h + 1)}
                  className="rounded-full bg-sun-100 px-4 py-1.5 text-sm font-semibold text-amber-700 ring-1 ring-sun-300 hover:brightness-95"
                >
                  💡 Hint {hintsShown + 1} of 3
                </button>
              )}
              <button
                onClick={() => setShowTutor((v) => !v)}
                className="rounded-full bg-brand-100 px-4 py-1.5 text-sm font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-200 lg:hidden"
              >
                🦉 {showTutor ? 'Hide tutor' : 'Ask the tutor'}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">Hints make solving easier but give a little less rating — smart trade when you're stuck!</p>
          </div>
        )}

        {/* post-answer feedback */}
        {solved && (
          <div className="mt-5 rise-in">
            <div
              className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                correct ? 'bg-mint-100 text-mint-700' : 'bg-coral-100 text-coral-500'
              }`}
            >
              {correct
                ? ['Brilliant reasoning! 🎉', 'Nailed it! 🌟', 'Exactly right! 🧠✨'][index % 3]
                : `Not this time — the answer is ${choiceLetters[question.answer]}. Mistakes are how reasoning grows! This one will come back for review.`}
            </div>

            <div className="mt-3 rounded-xl bg-slate-50 p-4">
              <div className="mb-2 text-sm font-bold text-slate-700">📖 Step-by-step solution</div>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700">
                {question.explanation.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="mt-3 rounded-xl bg-brand-50 p-4 ring-1 ring-brand-100">
              <div className="mb-1 text-sm font-bold text-brand-800">🧭 Reasoning strategy</div>
              <p className="text-sm leading-relaxed text-brand-900">{question.strategy}</p>
            </div>

            <button
              onClick={onNext}
              className="mt-4 w-full rounded-xl bg-brand-500 px-4 py-3 text-base font-bold text-white shadow-sm transition hover:bg-brand-600 sm:w-auto sm:px-8"
            >
              {index + 1 < total ? 'Next question →' : 'Finish session 🏁'}
            </button>
          </div>
        )}
      </div>

      {/* tutor: always visible on desktop, toggle on mobile */}
      <div className={`${showTutor ? '' : 'hidden'} lg:block`}>
        <TutorPanel question={question} solved={solved} />
      </div>
    </div>
  )
}
