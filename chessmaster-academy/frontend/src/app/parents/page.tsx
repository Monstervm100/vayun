"use client";

import { Badge, Button, Card, ProgressBar, SectionTitle, StatTile } from "@/components/ui";
import { useHydrated, useStore } from "@/store/useStore";
import { achievementById } from "@/data/achievements";

export default function Parents() {
  const hydrated = useHydrated();
  const s = useStore();
  if (!hydrated) return null;

  const week = [...Array(7)].map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    return { day: d.toLocaleDateString(undefined, { weekday: "short" }), date: key, min: s.activity[key] ?? 0 };
  });
  const weekMinutes = week.reduce((a, b) => a + b.min, 0);
  const activeDays = week.filter((d) => d.min > 0).length;
  const solved = s.puzzleLog.filter((p) => p.solved).length;
  const accuracy = s.puzzleLog.length ? Math.round((solved / s.puzzleLog.length) * 100) : null;
  const lessonsDone = Object.values(s.lessonProgress).filter((l) => l.status === "complete").length;
  const analyzed = s.games.filter((g) => g.analysis);
  const ratingChange = s.puzzleLog.length >= 2 ? s.puzzleLog[s.puzzleLog.length - 1].ratingAfter - s.puzzleLog[0].ratingAfter : 0;

  const byTheme: Record<string, { t: number; s: number }> = {};
  for (const p of s.puzzleLog) {
    byTheme[p.theme] ??= { t: 0, s: 0 };
    byTheme[p.theme].t++;
    if (p.solved) byTheme[p.theme].s++;
  }
  const weakAreas = Object.entries(byTheme)
    .filter(([, v]) => v.t >= 3 && v.s / v.t < 0.6)
    .map(([k]) => k);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="no-print flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">👪 Parent Dashboard</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            A clear view of {s.profile.name || "your child"}&apos;s practice — no chess knowledge required.
          </p>
        </div>
        <Button tone="secondary" onClick={() => window.print()}>🖨️ Print weekly report</Button>
      </div>

      <div className="hidden print:block">
        <h1 className="text-xl font-black">ChessMaster Academy — Weekly Report</h1>
        <p className="text-sm">Student: {s.profile.name || "—"} · Week ending {new Date().toLocaleDateString()}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon="⏱️" label="Practice this week" value={`${weekMinutes} min`} sub={`goal ${s.profile.weeklyGoalMinutes} min`} />
        <StatTile icon="📆" label="Active days" value={`${activeDays}/7`} sub={`${s.streak}-day streak`} />
        <StatTile icon="🧩" label="Puzzle accuracy" value={accuracy !== null ? `${accuracy}%` : "—"} sub={`${s.puzzleLog.length} attempts`} />
        <StatTile icon="📈" label="Rating change" value={`${ratingChange >= 0 ? "+" : ""}${ratingChange}`} sub={`now ${s.puzzleRating}`} />
      </div>

      <Card>
        <SectionTitle>📆 Daily activity</SectionTitle>
        <div className="flex items-end justify-between gap-2" style={{ height: 110 }}>
          {week.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center justify-end gap-1 self-stretch">
              <span className="text-[10px] font-bold opacity-60">{d.min > 0 ? `${d.min}m` : ""}</span>
              <div className="w-full rounded-t-lg bg-emerald-500" style={{ height: `${Math.min(100, (d.min / Math.max(20, s.profile.dailyMinutes)) * 100)}%`, minHeight: d.min > 0 ? 6 : 2, opacity: d.min > 0 ? 1 : 0.15 }} />
              <span className="text-[10px] font-semibold opacity-60">{d.day}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <SectionTitle>📚 Learning summary</SectionTitle>
          <ul className="space-y-1.5 text-sm">
            <li>✅ <b>{lessonsDone}</b> lessons completed</li>
            <li>🧩 <b>{solved}</b> puzzles solved</li>
            <li>⚔️ <b>{s.games.length}</b> games played ({s.games.filter((g) => g.result === "win").length} wins)</li>
            <li>🔬 <b>{analyzed.length}</b> games reviewed with the engine</li>
            <li>🔁 <b>{s.srs.length}</b> mistakes in the review system</li>
          </ul>
        </Card>
        <Card>
          <SectionTitle>🩹 Areas needing improvement</SectionTitle>
          {weakAreas.length ? (
            <div className="space-y-1.5 text-sm">
              {weakAreas.map((w) => (
                <p key={w}>• <b className="capitalize">{w}</b> patterns — the coach has scheduled targeted practice.</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-black/60 dark:text-white/60">No standout weak areas this week{s.puzzleLog.length < 10 ? " (more practice data needed)" : " — nicely balanced!"}.</p>
          )}
        </Card>
      </div>

      <Card>
        <SectionTitle>🎯 Weekly goal</SectionTitle>
        <ProgressBar value={weekMinutes} max={s.profile.weeklyGoalMinutes} />
        <p className="mt-2 text-sm text-black/60 dark:text-white/60">
          {weekMinutes >= s.profile.weeklyGoalMinutes
            ? "🎉 Weekly goal reached! Consistent practice like this is exactly how ratings grow."
            : `${s.profile.weeklyGoalMinutes - weekMinutes} minutes left to hit this week's goal. Short daily sessions beat weekend marathons.`}
        </p>
      </Card>

      <Card>
        <SectionTitle>🏅 Recent achievements</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {Object.keys(s.achievements).slice(-6).map((id) => {
            const a = achievementById(id);
            return a ? <Badge key={id} tone="amber">{a.icon} {a.title}</Badge> : null;
          })}
          {!Object.keys(s.achievements).length && <p className="text-sm text-black/60 dark:text-white/60">Achievements will appear as practice begins.</p>}
        </div>
      </Card>

      <p className="no-print text-center text-xs text-black/40 dark:text-white/40">
        With an account, parents link via a family code and see this dashboard from their own device — including the printable weekly report.
      </p>
    </div>
  );
}
