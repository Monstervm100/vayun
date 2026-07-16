import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Question, SkillId } from '../types'
import { QUESTION_BANK, QUESTION_MAP } from '../data'
import { pickSessionQuestions, dailyChallengeQuestions } from '../lib/recommend'
import { dueItems } from '../lib/srs'
import { SKILL_MAP } from '../lib/skills'
import { useStore } from '../store/useStore'
import { dayKey, xpForAttempt } from '../lib/xp'
import QuestionPlayer, { type AttemptResult } from '../components/QuestionPlayer'

type Mode = 'skill' | 'daily' | 'review' | 'quick'

export default function Session({ mode }: { mode: Mode }) {
  const { skillId } = useParams<{ skillId: SkillId }>()
  const store = useStore()
  const recordAttempt = useStore((s) => s.recordAttempt)

  // freeze the question list for the whole session
  const questions = useMemo<Question[]>(() => {
    const recent = new Set(store.recentIds)
    if (mode === 'daily') {
      return dailyChallengeQuestions(QUESTION_BANK, dayKey(Date.now()))
    }
    if (mode === 'review') {
      return dueItems(store.srsQueue)
        .slice(0, 8)
        .map((i) => QUESTION_MAP.get(i.qid))
        .filter((q): q is Question => Boolean(q))
    }
    if (mode === 'skill' && skillId && SKILL_MAP[skillId]) {
      return pickSessionQuestions(QUESTION_BANK, skillId, store.skills[skillId], recent, 5)
    }
    // quick mix: adaptive across all skills, based on overall level
    const pseudoState = { ...store.skills.mixed, rating: store.overallRating }
    return pickSessionQuestions(QUESTION_BANK, 'any', pseudoState, recent, 5)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, skillId])

  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState(false)
  const resultsRef = useRef<{ q: Question; r: AttemptResult }[]>([])

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
        <div className="text-4xl">🎉</div>
        <h1 className="mt-2 text-xl font-bold text-slate-800">
          {mode === 'review' ? 'Nothing to review!' : 'No questions found'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {mode === 'review'
            ? 'Your review queue is empty. Miss a question and it will come back here at just the right time.'
            : 'Try another practice mode.'}
        </p>
        <Link to="/practice" className="mt-4 inline-block rounded-xl bg-brand-500 px-6 py-2.5 font-semibold text-white hover:bg-brand-600">
          Back to practice
        </Link>
      </div>
    )
  }

  if (done) {
    const results = resultsRef.current
    const correct = results.filter((x) => x.r.correct).length
    const xp = results.reduce((s, x) => s + xpForAttempt(x.q.difficulty, x.r.correct, x.r.hintsUsed), 0)
    const totalTime = results.reduce((s, x) => s + x.r.timeSec, 0)
    return (
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5 rise-in">
        <div className="text-5xl">{correct === results.length ? '🏆' : correct >= results.length / 2 ? '🌟' : '💪'}</div>
        <h1 className="mt-3 text-2xl font-extrabold text-slate-800">Session complete!</h1>
        <p className="mt-1 text-sm text-slate-500">
          {correct === results.length
            ? 'Perfect round — outstanding reasoning!'
            : correct >= results.length / 2
              ? 'Solid work. Every solved problem levels up your brain.'
              : 'Tough round — that means you were training at the right edge. The misses will return for review.'}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-2xl font-black text-slate-800">{correct}/{results.length}</div>
            <div className="text-[11px] font-medium text-slate-400">correct</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-2xl font-black text-brand-600">+{xp}</div>
            <div className="text-[11px] font-medium text-slate-400">XP earned</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-2xl font-black text-slate-800">{Math.round(totalTime / results.length)}s</div>
            <div className="text-[11px] font-medium text-slate-400">avg time</div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/practice" className="rounded-xl bg-brand-500 px-6 py-2.5 font-semibold text-white hover:bg-brand-600">
            Practise more
          </Link>
          <Link to="/" className="rounded-xl bg-slate-100 px-6 py-2.5 font-semibold text-slate-700 hover:bg-slate-200">
            Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const q = questions[idx]
  const title =
    mode === 'daily' ? '🌞 Daily Challenge'
    : mode === 'review' ? '🔁 Spaced review'
    : mode === 'skill' && skillId ? `${SKILL_MAP[skillId].emoji} ${SKILL_MAP[skillId].name}`
    : '⚡ Quick mix'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-extrabold text-slate-800">{title}</h1>
        <div className="ml-auto flex gap-1" aria-label={`Progress: question ${idx + 1} of ${questions.length}`}>
          {questions.map((_, i) => (
            <span
              key={i}
              className={`h-2 w-6 rounded-full ${
                i < idx ? 'bg-mint-500' : i === idx ? 'bg-brand-500' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {store.skills[q.skill]?.remediation && mode === 'skill' && (
        <div className="rounded-xl bg-sun-100 px-4 py-2.5 text-sm font-medium text-amber-800">
          💪 Rebuild mode: we've stepped the difficulty down a notch. Two correct answers in a row and you're back on track!
        </div>
      )}

      <QuestionPlayer
        key={q.id}
        question={q}
        index={idx}
        total={questions.length}
        onAnswered={(r) => {
          resultsRef.current = [...resultsRef.current, { q, r }]
          recordAttempt(q, r.correct, r.timeSec, r.hintsUsed, {
            review: mode === 'review',
            daily: mode === 'daily',
          })
        }}
        onNext={() => {
          if (idx + 1 < questions.length) setIdx(idx + 1)
          else setDone(true)
        }}
      />
    </div>
  )
}
