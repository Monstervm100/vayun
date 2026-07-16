import { Link } from 'react-router-dom'
import { SKILLS } from '../lib/skills'
import { useStore } from '../store/useStore'
import { questionsForSkill } from '../data'
import { dueItems } from '../lib/srs'
import { DIFFICULTY_LABELS } from '../types'
import { ratingToDifficulty } from '../lib/elo'
import { dayKey } from '../lib/xp'

export default function PracticeHub() {
  const skills = useStore((s) => s.skills)
  const srsQueue = useStore((s) => s.srsQueue)
  const daily = useStore((s) => s.daily)
  const due = dueItems(srsQueue).length
  const dailyDone = daily.date === dayKey(Date.now()) && daily.done >= 3

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-slate-800">Practice 🧩</h1>
        <p className="mt-1 text-sm text-slate-500">
          Questions are organised by <span className="font-semibold text-slate-700">thinking skill</span>, not textbook chapter —
          and the difficulty adapts to your rating as you play.
        </p>
      </header>

      {/* quick modes */}
      <section className="grid gap-3 sm:grid-cols-3">
        <Link to="/practice/daily" className={`rounded-2xl p-4 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${dailyDone ? 'bg-mint-100 ring-mint-500/30' : 'bg-sun-100 ring-sun-300'}`}>
          <div className="text-2xl">🌞</div>
          <div className="mt-1 font-bold text-slate-800">Daily Challenge</div>
          <p className="mt-0.5 text-xs text-slate-600">
            {dailyDone ? 'Completed today — streak safe! ✅' : `3 questions · ${daily.date === dayKey(Date.now()) ? 3 - daily.done : 3} to go`}
          </p>
        </Link>
        <Link to="/practice/review" className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="text-2xl">🔁</div>
          <div className="mt-1 font-bold text-slate-800">Review queue</div>
          <p className="mt-0.5 text-xs text-slate-600">
            {due > 0 ? `${due} question${due > 1 ? 's' : ''} due — spaced repetition time!` : 'Nothing due. Misses come back here later.'}
          </p>
        </Link>
        <Link to="/practice/quick" className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="text-2xl">⚡</div>
          <div className="mt-1 font-bold text-slate-800">Quick mix</div>
          <p className="mt-0.5 text-xs text-slate-600">5 adaptive questions across all skills.</p>
        </Link>
      </section>

      {/* skill grid */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-800">Reasoning skills</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SKILLS.map((meta) => {
            const st = skills[meta.id]
            const count = questionsForSkill(meta.id).length
            const band = st ? ratingToDifficulty(st.rating) : 1
            return (
              <Link
                key={meta.id}
                to={`/practice/skill/${meta.id}`}
                className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl"
                    style={{ background: 'color-mix(in srgb, ' + meta.color + ' 14%, white)' }}
                  >
                    {meta.emoji}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 group-hover:text-brand-600">{meta.name}</div>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">{meta.blurb}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px] font-medium">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">{count} questions</span>
                  {st && st.attempts > 0 ? (
                    <>
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-brand-700">rating {st.rating}</span>
                      {st.remediation ? (
                        <span className="rounded-full bg-sun-100 px-2 py-0.5 text-amber-700">💪 rebuild mode</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">{DIFFICULTY_LABELS[band]}</span>
                      )}
                    </>
                  ) : (
                    <span className="rounded-full bg-mint-100 px-2 py-0.5 text-mint-700">new! ✨</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
