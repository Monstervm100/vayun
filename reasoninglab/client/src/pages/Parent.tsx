import { useStore } from '../store/useStore'
import {
  accuracy, avgTime, dailySeries, detectErrorPatterns, skillReports,
  totalMinutes, weeklyReport,
} from '../lib/analytics'
import { competitionReadiness, readinessLabel } from '../lib/elo'
import { SKILL_MAP } from '../lib/skills'
import { BarsChart, SkillBars, StatTile, TrendChart } from '../components/charts'

export default function Parent() {
  const s = useStore()
  const reports = skillReports(s.skills, s.attempts)
  const week = weeklyReport(s.attempts, s.overallDeltas, reports)
  const patterns = detectErrorPatterns(s.attempts)
  const series = dailySeries(s.attempts, 14)
  const readiness = competitionReadiness(s.overallRating, s.attempts.length)

  // 14-day accuracy trend (only days with activity)
  const accSeries = series
    .map((d) => ({ label: d.label, value: d.count > 0 ? Math.round((d.correct / d.count) * 100) : null }))
    .filter((d): d is { label: string; value: number } => d.value !== null)

  const growthRows = reports
    .filter((r) => r.attempts > 0)
    .sort((a, b) => b.rating - a.rating)
    .map((r) => ({
      name: r.name, emoji: r.emoji,
      value: Math.round(((r.rating - 400) / 1600) * 100),
      color: SKILL_MAP[r.skill].color,
      sub: String(r.rating),
    }))

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-slate-800">Parent dashboard 👪</h1>
        <p className="mt-1 text-sm text-slate-500">
          A calm, honest view of {s.name || 'your child'}'s reasoning journey — what's growing, what needs support, and how to help at home.
        </p>
      </header>

      {/* weekly report */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="font-bold text-slate-800">This week's report 📋</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile label="Questions" value={String(week.questions)} sub="attempted this week" />
          <StatTile label="Accuracy" value={week.questions ? `${week.accuracy}%` : '—'} sub="this week" />
          <StatTile label="Time practising" value={`${week.minutes} min`} sub={`${week.activeDays} active day${week.activeDays === 1 ? '' : 's'}`} />
          <StatTile
            label="Rating change"
            value={`${week.ratingChange >= 0 ? '+' : ''}${week.ratingChange}`}
            sub={`now ${s.overallRating}`}
            accent={week.ratingChange >= 0 ? 'var(--viz-good-text)' : 'var(--viz-critical)'}
          />
          <StatTile label="Readiness" value={`${readiness}%`} sub={readinessLabel(readiness)} />
        </div>
      </section>

      {/* trends */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h3 className="mb-2 font-bold text-slate-800">Daily practice, last 14 days</h3>
          <BarsChart
            points={series.map((d) => ({ label: d.label, value: d.minutes, hint: `${d.label} · ${d.count} questions` }))}
            formatValue={(v) => `${v} min`}
          />
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h3 className="mb-2 font-bold text-slate-800">Accuracy on active days</h3>
          <TrendChart points={accSeries} formatValue={(v) => `${v}%`} />
        </div>
      </section>

      {/* skill growth + lifetime stats */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h3 className="mb-3 font-bold text-slate-800">Skill ratings</h3>
          {growthRows.length > 0 ? (
            <SkillBars rows={growthRows} />
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">No practice data yet.</p>
          )}
          {week.bestSkill && (
            <p className="mt-3 text-xs text-slate-500">
              💪 Strongest: <span className="font-semibold">{week.bestSkill}</span>
              {week.focusSkill && week.focusSkill !== week.bestSkill && (
                <> · 🌱 Needs focus: <span className="font-semibold">{week.focusSkill}</span></>
              )}
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h3 className="mb-3 font-bold text-slate-800">Learning patterns 🔍</h3>
          {patterns.length > 0 ? (
            <ul className="space-y-2.5">
              {patterns.map((p) => (
                <li key={p.id} className="rounded-xl bg-slate-50 p-3">
                  <div className="text-sm font-bold text-slate-700">{p.title}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{p.detail}</div>
                  <div className="mt-1.5 rounded-lg bg-mint-100 px-2.5 py-1.5 text-xs font-medium text-mint-700">
                    💡 {p.suggestion}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">
              No recurring error patterns detected {s.attempts.length < 5 ? '(needs a little more practice data)' : '— great sign!'}
            </p>
          )}
        </div>
      </section>

      {/* suggestions */}
      <section className="rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-100">
        <h3 className="font-bold text-brand-900">How to support learning at home 🏡</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-brand-900">
          {week.suggestions.map((sg, i) => (
            <li key={i}>{sg}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-brand-700/70">
          Lifetime: {s.attempts.length} questions · {totalMinutes(s.attempts)} minutes · {accuracy(s.attempts)}% accuracy · {avgTime(s.attempts)}s average solve time.
        </p>
      </section>
    </div>
  )
}
