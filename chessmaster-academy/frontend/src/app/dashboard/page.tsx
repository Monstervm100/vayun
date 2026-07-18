"use client";

import Link from "next/link";
import { Badge, Card, LinkButton, ProgressBar, SectionTitle, StatTile } from "@/components/ui";
import { levelForXp, useHydrated, useStore } from "@/store/useStore";
import { achievementById } from "@/data/achievements";
import lessons from "@/data/lessons.json";

function themeStats(puzzleLog: { theme: string; solved: boolean }[]) {
  const byTheme: Record<string, { total: number; solved: number }> = {};
  for (const p of puzzleLog) {
    byTheme[p.theme] ??= { total: 0, solved: 0 };
    byTheme[p.theme].total++;
    if (p.solved) byTheme[p.theme].solved++;
  }
  return Object.entries(byTheme)
    .filter(([, v]) => v.total >= 3)
    .map(([theme, v]) => ({ theme, pct: Math.round((v.solved / v.total) * 100), total: v.total }))
    .sort((a, b) => b.pct - a.pct);
}

export default function Dashboard() {
  const hydrated = useHydrated();
  const s = useStore();
  if (!hydrated) return null;

  if (!s.profile.onboarded) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <div className="text-4xl">🧭</div>
        <p className="mt-2 font-bold">Set up your profile first</p>
        <LinkButton href="/onboarding" className="mt-4">Start onboarding</LinkButton>
      </Card>
    );
  }

  const level = levelForXp(s.xp);
  const lessonsDone = Object.values(s.lessonProgress).filter((l) => l.status === "complete").length;
  const solved = s.puzzleLog.filter((p) => p.solved).length;
  const accuracy = s.puzzleLog.length ? Math.round((solved / s.puzzleLog.length) * 100) : null;
  const today = new Date().toISOString().slice(0, 10);
  const weekMinutes = Object.entries(s.activity)
    .filter(([d]) => Date.now() - new Date(d).getTime() < 7 * 86400000)
    .reduce((a, [, m]) => a + m, 0);
  const themes = themeStats(s.puzzleLog);
  const strongest = themes.slice(0, 3);
  const weakest = [...themes].reverse().slice(0, 3);
  const nextLesson = (lessons as { id: string; title: string; emoji: string; level: number; minutes: number }[]).find(
    (l) => s.lessonProgress[l.id]?.status !== "complete"
  );
  const skillNames = ["Newcomer", "Learner", "Improver", "Club Player", "Tactician", "Strategist", "Expert-in-training"];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">📊 Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon="♟️" label="Rating" value={s.profile.rating} sub={`goal ${s.profile.targetRating}`} />
        <StatTile icon="🧩" label="Puzzle rating" value={s.puzzleRating} sub={accuracy !== null ? `${accuracy}% accuracy` : "no puzzles yet"} />
        <StatTile icon="⭐" label="Level" value={level} sub={skillNames[Math.min(level - 1, skillNames.length - 1)]} />
        <StatTile icon="🔥" label="Streak" value={`${s.streak} days`} sub={`${s.coins} 🪙 coins`} />
        <StatTile icon="📚" label="Lessons done" value={lessonsDone} sub={`of ${(lessons as unknown[]).length}`} />
        <StatTile icon="⚔️" label="Games played" value={s.games.length} sub={`${s.games.filter((g) => g.result === "win").length} wins`} />
        <StatTile icon="🕐" label="Today" value={`${s.activity[today] ?? 0} min`} sub={`goal ${s.profile.dailyMinutes} min`} />
        <StatTile icon="📅" label="This week" value={`${weekMinutes} min`} sub={`goal ${s.profile.weeklyGoalMinutes} min`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle>💪 Strongest skills</SectionTitle>
          {strongest.length ? strongest.map((t) => (
            <div key={t.theme} className="mb-2">
              <div className="mb-1 flex justify-between text-sm"><span className="font-semibold capitalize">{t.theme}</span><span>{t.pct}%</span></div>
              <ProgressBar value={t.pct} max={100} />
            </div>
          )) : <p className="text-sm text-black/60 dark:text-white/60">Solve at least 3 puzzles per theme and your strengths appear here.</p>}
        </Card>
        <Card>
          <SectionTitle>🎯 Needs work</SectionTitle>
          {weakest.length ? weakest.map((t) => (
            <div key={t.theme} className="mb-2">
              <div className="mb-1 flex justify-between text-sm">
                <Link href={`/tactics?theme=${t.theme}`} className="font-semibold capitalize text-emerald-600 hover:underline">{t.theme} →</Link>
                <span>{t.pct}%</span>
              </div>
              <ProgressBar value={t.pct} max={100} />
            </div>
          )) : <p className="text-sm text-black/60 dark:text-white/60">Your weak spots will show up here after some puzzles — then we fix them together.</p>}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle>📖 Recommended next</SectionTitle>
          {nextLesson ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xl">{nextLesson.emoji} <b>{nextLesson.title}</b></div>
                <div className="text-xs text-black/50 dark:text-white/50">Level {nextLesson.level} · estimated {nextLesson.minutes} min</div>
              </div>
              <LinkButton href={`/learn/${nextLesson.id}`}>Start</LinkButton>
            </div>
          ) : <p className="text-sm">Path complete! Time to grind tactics and games. 🏆</p>}
        </Card>
        <Card>
          <SectionTitle>🏅 Achievements ({Object.keys(s.achievements).length})</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {Object.keys(s.achievements).slice(-8).map((id) => {
              const a = achievementById(id);
              return a ? <Badge key={id} tone="amber">{a.icon} {a.title}</Badge> : null;
            })}
            {!Object.keys(s.achievements).length && <p className="text-sm text-black/60 dark:text-white/60">Train to unlock your first badge!</p>}
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle action={<Link href="/play" className="text-xs font-bold text-emerald-600">Play →</Link>}>⚔️ Recent games</SectionTitle>
        {s.games.length ? (
          <div className="space-y-2">
            {[...s.games].reverse().slice(0, 5).map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-xl bg-black/5 px-4 py-2 text-sm dark:bg-white/5">
                <span>
                  <Badge tone={g.result === "win" ? "green" : g.result === "loss" ? "red" : "neutral"}>{g.result}</Badge>
                  <span className="ml-2">vs Level {g.level} · {g.color}</span>
                  {g.analysis && <span className="ml-2 text-black/50 dark:text-white/50">{g.analysis.accuracy}% accuracy</span>}
                </span>
                <Link href={`/analysis/${g.id}`} className="font-bold text-emerald-600 hover:underline">
                  {g.analysis ? "Review" : "Analyze"} →
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-black/60 dark:text-white/60">No games yet — play your first coached game!</p>
        )}
      </Card>
    </div>
  );
}
