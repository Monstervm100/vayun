import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { accuracy, avgTime, dailySeries, skillReports, strongestAndWeakest } from '../lib/analytics'
import { competitionReadiness, readinessLabel } from '../lib/elo'
import { dailyRecommendations } from '../lib/recommend'
import { dayKey, levelFromXp, levelTitle } from '../lib/xp'
import { QUESTION_MAP } from '../data'
import { SKILL_MAP } from '../lib/skills'
import { BarsChart, ProgressRing, StatTile, TrendChart, SkillBars } from '../components/charts'

export default function Dashboard() {
  const s = useStore()
  const reports = skillReports(s.skills, s.attempts)
  const { strongest, weakest } = strongestAndWeakest(reports)
  const readiness = competitionReadiness(s.overallRating, s.attempts.length)
  const { level, into, needed } = levelFromXp(s.xp)
  const dailyDone = s.daily.date === dayKey(Date.now()) && s.daily.done >= 3
  const recs = dailyRecommendations(s.skills, s.attempts, s.srsQueue, dailyDone)
  const recentMistakes = [...s.attempts].reverse().filter((a) => !a.correct).slice(0, 4)

  // rating trend: sample the overall rating after each attempt (last 30)
  let r = 1000
  const trend = s.attempts.map((a, i) => {
    r += s.overallDeltas[i] ?? 0
    return { label: new Date(a.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), value: r }
  })
  const trendPts = [{ label: 'start', value: 1000 }, ...trend].slice(-30)

  const masteryRows = reports
    .filter((x) => x.attempts > 0)
    .sort((a, b) => b.mastery - a.mastery)
    .slice(0, 6)
    .map((x) => ({ name: x.name, emoji: x.emoji, value: x.mastery, color: SKILL_MAP[x.skill].color }))

  return (
    <div className="space-y-6">
      {/* greeting + level */}
      <section className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white shadow-md rise-in">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">
              {s.name ? `Hi ${s.name}! 👋` : 'Welcome to ReasoningLab! 👋'}
            </h1>
            <p className="mt-1 text-sm text-brand-100">
              Level {level} · {levelTitle(level)} · {s.streak.current > 0 ? `🔥 ${s.streak.current}-day streak` : 'start a streak today!'}
            </p>
            <div className="mt-3 h-2.5 w-56 max-w-full overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-sun-300" style={{ width: `${(into / needed) * 100}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-brand-100">{into} / {needed} XP to level {level + 1}</p>
          </div>
          <div className="ml-auto rounded-2xl bg-white/15 p-3 text-center backdrop-blur">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-100">Reasoning rating</div>
            <div className="text-4xl font-black tabular-nums">{s.overallRating}</div>
          </div>
        </div>
      </section>

      {/* today's plan */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-800">Today's plan 🎯</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {recs.length === 0 && (
            <Link to="/practice" className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="text-2xl">🧩</div>
              <div className="mt-1 font-bold text-slate-800">Start practising</div>
              <p className="mt-1 text-xs text-slate-500">Pick any skill to begin your journey.</p>
            </Link>
          )}
          {recs.map((rec) => (
            <Link key={rec.id} to={rec.to} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="text-2xl">{rec.emoji}</div>
              <div className="mt-1 font-bold text-slate-800">{rec.title}</div>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{rec.reason}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Accuracy" value={`${accuracy(s.attempts)}%`} sub={`${s.attempts.filter((a) => a.correct).length} of ${s.attempts.length} correct`} />
        <StatTile label="Avg solve time" value={s.attempts.length ? `${avgTime(s.attempts)}s` : '—'} sub="across all questions" />
        <StatTile label="Practice streak" value={s.streak.current > 0 ? `${s.streak.current} days` : '0'} sub={`best: ${s.streak.best} days`} />
        <StatTile label="Questions solved" value={String(s.attempts.filter((a) => a.correct).length)} sub={`${s.srsQueue.length} queued for review`} />
      </section>

      {/* trend + readiness */}
      <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h3 className="mb-2 font-bold text-slate-800">Rating journey 📈</h3>
          <TrendChart points={trendPts} />
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
          <h3 className="mb-2 font-bold text-slate-800">Competition readiness</h3>
          <ProgressRing pct={readiness} label="Kangaroo" />
          <p className="mt-2 text-sm font-medium text-slate-600">{readinessLabel(readiness)}</p>
          <p className="mt-1 text-[11px] text-slate-400">Blends your rating with practice volume</p>
        </div>
      </section>

      {/* strengths + mistakes */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h3 className="mb-3 font-bold text-slate-800">Skill mastery 🏗️</h3>
          {masteryRows.length > 0 ? (
            <>
              <SkillBars rows={masteryRows} />
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {strongest && (
                  <span className="rounded-full bg-mint-100 px-3 py-1 font-semibold text-mint-700">
                    💪 Strongest: {strongest.name} ({strongest.rating})
                  </span>
                )}
                {weakest && strongest?.skill !== weakest.skill && (
                  <span className="rounded-full bg-coral-100 px-3 py-1 font-semibold text-coral-500">
                    🌱 Focus: {weakest.name} ({weakest.rating})
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">Solve questions to grow your mastery bars 🌱</p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h3 className="mb-3 font-bold text-slate-800">Recent mistakes to learn from 🔍</h3>
          {recentMistakes.length > 0 ? (
            <ul className="space-y-2">
              {recentMistakes.map((a, i) => {
                const q = QUESTION_MAP.get(a.qid)
                if (!q) return null
                return (
                  <li key={i} className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <div className="line-clamp-2 text-sm font-medium text-slate-700">{q.prompt}</div>
                    <div className="mt-1 text-[11px] text-slate-400">
                      {SKILL_MAP[q.skill].emoji} {SKILL_MAP[q.skill].name} · scheduled for spaced review
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">No recent mistakes — or none yet. Both are fine! 😄</p>
          )}
          <Link to="/practice/review" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
            Go to review queue →
          </Link>
        </div>
      </section>

      {/* weekly activity */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h3 className="mb-2 font-bold text-slate-800">This week's activity 📅</h3>
        <WeekBars />
      </section>
    </div>
  )
}

function WeekBars() {
  const attempts = useStore((s) => s.attempts)
  const series = dailySeries(attempts, 7)
  return (
    <BarsChart
      points={series.map((d) => ({ label: d.label, value: d.count, hint: `${d.label} · ${d.minutes} min` }))}
      formatValue={(v) => `${v} questions`}
    />
  )
}
