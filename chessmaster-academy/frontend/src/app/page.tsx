"use client";

import Link from "next/link";
import { Badge, Card, LinkButton, ProgressBar, SectionTitle } from "@/components/ui";
import { levelForXp, useHydrated, useStore } from "@/store/useStore";
import { achievementById } from "@/data/achievements";
import lessons from "@/data/lessons.json";
import { STRUGGLES } from "@/lib/coach";

const PIECES = ["♞", "♝", "♜", "♛", "♚", "♟"];

function Hero() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-sky-700 p-8 text-white md:p-12">
      <div className="pointer-events-none absolute inset-0 opacity-20" aria-hidden>
        {PIECES.map((p, i) => (
          <span key={i} className="float-piece absolute text-6xl" style={{ left: `${8 + i * 16}%`, top: `${(i % 3) * 30 + 5}%`, animationDelay: `${i * 0.7}s` }}>
            {p}
          </span>
        ))}
      </div>
      <div className="relative">
        <h1 className="max-w-xl text-3xl font-black leading-tight md:text-5xl">Become a Better Chess Player Every Day</h1>
        <p className="mt-3 max-w-lg text-white/85 md:text-lg">
          Your personal AI chess coach: short lessons, smart puzzles, real games, and analysis that actually teaches you how to think.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <LinkButton href="/onboarding" tone="secondary" className="!bg-white !text-emerald-700 hover:!bg-emerald-50">Start your journey →</LinkButton>
          <LinkButton href="/coach" tone="ghost" className="!text-white ring-1 ring-white/40 hover:!bg-white/10">Meet your coach</LinkButton>
        </div>
        <p className="mt-4 text-sm text-white/70">Learn → Practice → Play → Analyze → Improve → Repeat</p>
      </div>
    </div>
  );
}

export default function Home() {
  const hydrated = useHydrated();
  const s = useStore();

  if (!hydrated) return <Hero />;

  if (!s.profile.onboarded) {
    return (
      <div className="space-y-8">
        <Hero />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: "🤖", title: "A coach, not a menu", text: "Tell the coach what you struggle with — it builds your 15-minute training session automatically." },
            { icon: "🧩", title: "Puzzles that adapt", text: "Every puzzle is verified and picked for your level. Miss one? It comes back until you own the pattern." },
            { icon: "📈", title: "Analysis kids understand", text: "After every game: your accuracy, your mistakes explained in plain language, and homework that fixes them." },
          ].map((f) => (
            <Card key={f.title}>
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-2 font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-black/60 dark:text-white/60">{f.text}</p>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const minutesToday = s.activity[today] ?? 0;
  const level = levelForXp(s.xp);
  const weekMinutes = Object.entries(s.activity)
    .filter(([d]) => Date.now() - new Date(d).getTime() < 7 * 86400000)
    .reduce((a, [, m]) => a + m, 0);

  const nextLesson = (lessons as { id: string; title: string; emoji: string; level: number; minutes: number }[]).find(
    (l) => s.lessonProgress[l.id]?.status !== "complete"
  );
  const recentAch = Object.entries(s.achievements)
    .sort((a, b) => b[1].localeCompare(a[1]))
    .slice(0, 4);
  const dueReviews = s.srs.filter((i) => new Date(i.due) <= new Date()).length;
  const dailyStruggle = STRUGGLES[new Date().getDate() % STRUGGLES.length];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-sky-700 p-6 text-white md:p-8">
        <span className="float-piece absolute right-6 top-4 text-6xl opacity-25" aria-hidden>♞</span>
        <h1 className="text-2xl font-black md:text-3xl">Welcome back, {s.profile.name}! 🔥 {s.streak}-day streak</h1>
        <p className="mt-1 text-white/85">Level {level} · {s.xp} XP · Rating goal: {s.profile.rating} → {s.profile.targetRating}</p>
        <div className="mt-4 max-w-md">
          <div className="mb-1 flex justify-between text-xs text-white/80">
            <span>Today: {minutesToday}/{s.profile.dailyMinutes} min</span>
            <span>Level {level} → {level + 1}</span>
          </div>
          <ProgressBar value={minutesToday} max={s.profile.dailyMinutes} className="!bg-white/20" />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <LinkButton href="/coach" tone="secondary" className="!bg-white !text-emerald-700 hover:!bg-emerald-50">🤖 Start today&apos;s session</LinkButton>
          {nextLesson && <LinkButton href={`/learn/${nextLesson.id}`} tone="ghost" className="!text-white ring-1 ring-white/40 hover:!bg-white/10">Continue learning</LinkButton>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <SectionTitle>📚 Recommended lesson</SectionTitle>
          {nextLesson ? (
            <Link href={`/learn/${nextLesson.id}`} className="block rounded-xl bg-black/5 p-4 transition hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10">
              <div className="text-2xl">{nextLesson.emoji}</div>
              <div className="mt-1 font-bold">{nextLesson.title}</div>
              <div className="text-xs text-black/50 dark:text-white/50">Level {nextLesson.level} · ~{nextLesson.minutes} min</div>
            </Link>
          ) : (
            <p className="text-sm">All lessons complete — legendary! 🏆</p>
          )}
        </Card>

        <Card>
          <SectionTitle>🎯 Today&apos;s challenge</SectionTitle>
          <p className="text-sm text-black/60 dark:text-white/60">{dailyStruggle.emoji} Focus: <b>{dailyStruggle.focus}</b></p>
          <p className="mt-1 text-sm">Solve 5 puzzles on today&apos;s theme to earn bonus XP.</p>
          <LinkButton href={`/tactics?theme=${dailyStruggle.tacticsTheme}`} className="mt-3">Take the challenge</LinkButton>
        </Card>

        <Card>
          <SectionTitle>🔁 Review queue</SectionTitle>
          {dueReviews > 0 ? (
            <>
              <p className="text-sm"><b>{dueReviews}</b> mistake{dueReviews > 1 ? "s" : ""} ready for review. Beat them before they beat you again!</p>
              <LinkButton href="/review" className="mt-3">Review now</LinkButton>
            </>
          ) : (
            <p className="text-sm text-black/60 dark:text-white/60">Nothing due — your mistake queue is clear. 🎉</p>
          )}
        </Card>

        <Card>
          <SectionTitle>📅 Weekly goal</SectionTitle>
          <ProgressBar value={weekMinutes} max={s.profile.weeklyGoalMinutes} />
          <p className="mt-2 text-sm text-black/60 dark:text-white/60">{weekMinutes} of {s.profile.weeklyGoalMinutes} minutes this week</p>
        </Card>

        <Card>
          <SectionTitle action={<Link href="/progress" className="text-xs font-bold text-emerald-600">See all →</Link>}>🏅 Recent achievements</SectionTitle>
          {recentAch.length ? (
            <div className="flex flex-wrap gap-2">
              {recentAch.map(([id]) => {
                const a = achievementById(id);
                return a ? <Badge key={id} tone="amber">{a.icon} {a.title}</Badge> : null;
              })}
            </div>
          ) : (
            <p className="text-sm text-black/60 dark:text-white/60">Complete activities to earn achievements!</p>
          )}
        </Card>

        <Card>
          <SectionTitle>🏆 Leaderboard (this week)</SectionTitle>
          <ol className="space-y-1 text-sm">
            {[
              { name: "Aarav", xp: 460 },
              { name: s.profile.name || "You", xp: s.xp, you: true },
              { name: "Mia", xp: 320 },
              { name: "Kenji", xp: 180 },
            ]
              .sort((a, b) => b.xp - a.xp)
              .map((r, i) => (
                <li key={r.name + i} className={`flex justify-between rounded-lg px-3 py-1.5 ${r.you ? "bg-emerald-600/10 font-bold" : ""}`}>
                  <span>{["🥇", "🥈", "🥉", "4."][i]} {r.name} {r.you && "(you)"}</span>
                  <span>{r.xp} XP</span>
                </li>
              ))}
          </ol>
        </Card>
      </div>

      <Card>
        <SectionTitle action={<Link href="/learn" className="text-xs font-bold text-emerald-600">Open the path →</Link>}>🗺️ Your learning roadmap</SectionTitle>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {[1, 2, 3, 4, 5].map((lvl) => {
            const levelLessons = (lessons as { id: string; level: number }[]).filter((l) => l.level === lvl);
            const done = levelLessons.filter((l) => s.lessonProgress[l.id]?.status === "complete").length;
            const names = ["Fundamentals", "Openings", "Tactics", "Positional", "Endgames"];
            return (
              <div key={lvl} className="flex items-center gap-2">
                <div className={`rounded-xl px-3 py-2 text-center ${done === levelLessons.length ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-300" : "bg-black/5 dark:bg-white/10"}`}>
                  <div className="font-bold">L{lvl} · {names[lvl - 1]}</div>
                  <div className="text-xs opacity-70">{done}/{levelLessons.length} lessons</div>
                </div>
                {lvl < 5 && <span className="text-black/30 dark:text-white/30">→</span>}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
