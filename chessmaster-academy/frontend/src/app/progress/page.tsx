"use client";

import { Card, ProgressBar, SectionTitle, StatTile } from "@/components/ui";
import { useHydrated, useStore } from "@/store/useStore";
import { ACHIEVEMENTS } from "@/data/achievements";

function Sparkline({ values, height = 48 }: { values: number[]; height?: number }) {
  if (values.length < 2) return <p className="text-xs text-black/40 dark:text-white/40">Not enough data yet — keep training!</p>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 280;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${height - ((v - min) / range) * (height - 6) - 3}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="h-12 w-full" preserveAspectRatio="none" role="img" aria-label="trend chart">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ActivityCalendar({ activity }: { activity: Record<string, number> }) {
  const days: { date: string; min: number }[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    days.push({ date: d, min: activity[d] ?? 0 });
  }
  const shade = (m: number) =>
    m === 0 ? "bg-black/8 dark:bg-white/8" : m < 10 ? "bg-emerald-300" : m < 20 ? "bg-emerald-500" : "bg-emerald-700";
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((d) => (
        <div key={d.date} title={`${d.date}: ${d.min} min`} className={`h-6 rounded ${shade(d.min)}`} />
      ))}
    </div>
  );
}

export default function Progress() {
  const hydrated = useHydrated();
  const s = useStore();
  if (!hydrated) return null;

  const ratingTrend = s.puzzleLog.map((p) => p.ratingAfter);
  const solved = s.puzzleLog.filter((p) => p.solved).length;
  const accuracy = s.puzzleLog.length ? Math.round((solved / s.puzzleLog.length) * 100) : 0;
  const analyzed = s.games.filter((g) => g.analysis);
  const gameAccTrend = analyzed.map((g) => g.analysis!.accuracy);
  const blunders = analyzed.reduce((n, g) => n + (g.analysis!.counts.blunder ?? 0), 0);
  const totalMinutes = Object.values(s.activity).reduce((a, b) => a + b, 0);
  const openingsDrilled = Object.values(s.openingProgress).filter((o) => o.drilled).length;
  const endgamesPassed = Object.values(s.endgameProgress).filter(Boolean).length;

  const byTheme: Record<string, { t: number; s: number }> = {};
  for (const p of s.puzzleLog) {
    byTheme[p.theme] ??= { t: 0, s: 0 };
    byTheme[p.theme].t++;
    if (p.solved) byTheme[p.theme].s++;
  }
  const themes = Object.entries(byTheme)
    .filter(([, v]) => v.t >= 2)
    .map(([k, v]) => ({ theme: k, pct: Math.round((v.s / v.t) * 100) }))
    .sort((a, b) => b.pct - a.pct);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">📈 Analytics</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon="🧩" label="Puzzle rating" value={s.puzzleRating} sub={`${accuracy}% accuracy`} />
        <StatTile icon="💥" label="Blunders / game" value={analyzed.length ? (blunders / analyzed.length).toFixed(1) : "—"} sub={`${analyzed.length} analyzed`} />
        <StatTile icon="⏱️" label="Total learning" value={`${totalMinutes} min`} sub={`${s.streak}-day streak`} />
        <StatTile icon="🎯" label="Drills done" value={openingsDrilled + endgamesPassed} sub={`${openingsDrilled} openings · ${endgamesPassed} endgames`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle>🧩 Puzzle rating trend</SectionTitle>
          <Sparkline values={ratingTrend} />
          {ratingTrend.length >= 2 && (
            <p className="mt-1 text-xs text-black/50 dark:text-white/50">
              {ratingTrend[ratingTrend.length - 1] >= ratingTrend[0] ? "📈 Improving" : "📉 Dipping"} · {ratingTrend[0]} → {ratingTrend[ratingTrend.length - 1]} over {ratingTrend.length} puzzles
            </p>
          )}
        </Card>
        <Card>
          <SectionTitle>🎯 Game accuracy trend</SectionTitle>
          <Sparkline values={gameAccTrend} />
          {gameAccTrend.length === 0 && <p className="text-xs text-black/40 dark:text-white/40">Analyze your games after playing to see this trend.</p>}
        </Card>
      </div>

      <Card>
        <SectionTitle>🗓️ Last 28 days</SectionTitle>
        <ActivityCalendar activity={s.activity} />
        <p className="mt-2 text-xs text-black/50 dark:text-white/50">Consistency beats intensity — a little every day is the grandmaster way.</p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle>💪 Strength map</SectionTitle>
          {themes.slice(0, 5).map((t) => (
            <div key={t.theme} className="mb-2">
              <div className="mb-1 flex justify-between text-sm"><span className="font-semibold capitalize">{t.theme}</span><span>{t.pct}%</span></div>
              <ProgressBar value={t.pct} max={100} />
            </div>
          ))}
          {!themes.length && <p className="text-sm text-black/40 dark:text-white/40">Solve puzzles to reveal your strengths.</p>}
        </Card>
        <Card>
          <SectionTitle>🩹 Weakness map</SectionTitle>
          {[...themes].reverse().slice(0, 5).map((t) => (
            <div key={t.theme} className="mb-2">
              <div className="mb-1 flex justify-between text-sm"><span className="font-semibold capitalize">{t.theme}</span><span>{t.pct}%</span></div>
              <ProgressBar value={t.pct} max={100} />
            </div>
          ))}
          {!themes.length && <p className="text-sm text-black/40 dark:text-white/40">Your weak themes will appear here — then the coach targets them.</p>}
        </Card>
      </div>

      <Card>
        <SectionTitle>🏅 Achievement collection ({Object.keys(s.achievements).length}/{ACHIEVEMENTS.length})</SectionTitle>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = !!s.achievements[a.id];
            return (
              <div key={a.id} className={`rounded-xl p-3 text-center ${unlocked ? "bg-amber-500/10" : "bg-black/5 opacity-40 dark:bg-white/5"}`}>
                <div className="text-2xl">{unlocked ? a.icon : "🔒"}</div>
                <div className="mt-1 text-xs font-bold">{a.title}</div>
                <div className="text-[10px] opacity-60">{a.description}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <SectionTitle>🛣️ Road to {s.profile.targetRating}</SectionTitle>
        <ProgressBar value={Math.max(0, s.puzzleRating - 400)} max={Math.max(1, s.profile.targetRating - 400)} />
        <p className="mt-2 text-sm text-black/60 dark:text-white/60">
          Puzzle rating {s.puzzleRating} — {s.puzzleRating >= s.profile.targetRating ? "target reached! Set a new one in your next onboarding." : `${s.profile.targetRating - s.puzzleRating} points to your ${s.profile.targetRating} goal. Keep the loop going: Learn → Practice → Play → Analyze → Improve.`}
        </p>
      </Card>
    </div>
  );
}
