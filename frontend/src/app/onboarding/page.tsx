"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, ProgressBar } from "@/components/ui";
import { useStore, type Experience, type LearningStyle } from "@/store/useStore";
import openings from "@/data/openings.json";

const STEPS = ["Name", "Age", "Experience", "Rating", "Opening", "Goals", "Time", "Style"] as const;

export default function Onboarding() {
  const router = useRouter();
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    age: 10,
    experience: "new" as Experience,
    rating: 400,
    favoriteOpening: "italian",
    targetRating: 1200,
    weeklyGoalMinutes: 90,
    dailyMinutes: 15,
    learningStyle: "practice" as LearningStyle,
  });
  const [done, setDone] = useState(false);

  const next = () => (step < STEPS.length - 1 ? setStep(step + 1) : finish());
  const back = () => setStep(Math.max(0, step - 1));
  const finish = () => {
    completeOnboarding(form);
    setDone(true);
  };

  const Choice = ({ options, value, onPick }: { options: { v: string | number; label: string; sub?: string }[]; value: string | number; onPick: (v: never) => void }) => (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => (
        <button
          key={String(o.v)}
          onClick={() => onPick(o.v as never)}
          className={`rounded-xl border-2 p-3 text-left text-sm font-semibold transition ${
            value === o.v ? "border-emerald-500 bg-emerald-500/10" : "border-black/10 hover:border-emerald-400/50 dark:border-white/15"
          }`}
        >
          {o.label}
          {o.sub && <span className="block text-xs font-normal opacity-60">{o.sub}</span>}
        </button>
      ))}
    </div>
  );

  if (done) {
    return (
      <div className="mx-auto max-w-lg pt-10 text-center">
        <div className="pop-in text-7xl">🎉</div>
        <h1 className="mt-4 text-3xl font-black">Your journey to {form.targetRating} starts now, {form.name}!</h1>
        <p className="mt-3 text-black/60 dark:text-white/60">
          I&apos;ve built your personal roadmap: {form.dailyMinutes} minutes a day, focused on taking you from ~{form.rating} to {form.targetRating} Elo through the five levels — Fundamentals, Openings, Tactics, Positional play and Endgames.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => router.push("/coach")}>🤖 Start first session</Button>
          <Button tone="secondary" onClick={() => router.push("/dashboard")}>See my dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-black">Let&apos;s set up your training 🧭</h1>
      <p className="mb-4 mt-1 text-sm text-black/60 dark:text-white/60">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
      <ProgressBar value={step + 1} max={STEPS.length} className="mb-6" />

      <Card>
        {step === 0 && (
          <div>
            <h2 className="mb-3 font-bold">What should I call you?</h2>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
              className="w-full rounded-xl border-2 border-black/10 bg-transparent p-3 font-semibold outline-none focus:border-emerald-500 dark:border-white/15"
            />
          </div>
        )}
        {step === 1 && (
          <div>
            <h2 className="mb-3 font-bold">How old are you?</h2>
            <Choice
              value={form.age}
              onPick={(v) => setForm({ ...form, age: v })}
              options={[
                { v: 8, label: "Under 10" },
                { v: 12, label: "10 – 13" },
                { v: 15, label: "14 – 16" },
                { v: 20, label: "17+" },
              ]}
            />
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 className="mb-3 font-bold">How much chess have you played?</h2>
            <Choice
              value={form.experience}
              onPick={(v) => setForm({ ...form, experience: v })}
              options={[
                { v: "new", label: "🌱 Brand new", sub: "Still learning the rules" },
                { v: "casual", label: "🙂 Casual", sub: "I play with friends/family" },
                { v: "club", label: "♟️ Club player", sub: "School club or online regularly" },
                { v: "tournament", label: "🏆 Tournament", sub: "I've played rated events" },
              ]}
            />
          </div>
        )}
        {step === 3 && (
          <div>
            <h2 className="mb-3 font-bold">What&apos;s your current rating (roughly)?</h2>
            <Choice
              value={form.rating}
              onPick={(v) => setForm({ ...form, rating: v })}
              options={[
                { v: 400, label: "~400", sub: "New / unrated" },
                { v: 600, label: "~600", sub: "I know some tactics" },
                { v: 800, label: "~800", sub: "Solid beginner" },
                { v: 1000, label: "1000+", sub: "Intermediate" },
              ]}
            />
          </div>
        )}
        {step === 4 && (
          <div>
            <h2 className="mb-3 font-bold">Pick a favorite opening (you can change later)</h2>
            <Choice
              value={form.favoriteOpening}
              onPick={(v) => setForm({ ...form, favoriteOpening: v })}
              options={(openings as { id: string; name: string; emoji: string }[]).slice(0, 6).map((o) => ({ v: o.id, label: `${o.emoji} ${o.name}` }))}
            />
          </div>
        )}
        {step === 5 && (
          <div>
            <h2 className="mb-3 font-bold">What rating do you want to reach?</h2>
            <Choice
              value={form.targetRating}
              onPick={(v) => setForm({ ...form, targetRating: v })}
              options={[
                { v: 800, label: "🎯 800", sub: "Beat my friends" },
                { v: 1200, label: "🚀 1200", sub: "Strong club player" },
                { v: 1500, label: "🔥 1500", sub: "Tournament ready" },
                { v: 1800, label: "👑 1800", sub: "Expert path" },
              ]}
            />
          </div>
        )}
        {step === 6 && (
          <div>
            <h2 className="mb-3 font-bold">How much time can you train?</h2>
            <Choice
              value={form.dailyMinutes}
              onPick={(v) => setForm({ ...form, dailyMinutes: v, weeklyGoalMinutes: (v as number) * 6 })}
              options={[
                { v: 10, label: "10 min/day", sub: "Quick daily workout" },
                { v: 15, label: "15 min/day", sub: "The sweet spot" },
                { v: 20, label: "20 min/day", sub: "Serious improvement" },
                { v: 30, label: "30+ min/day", sub: "Future master" },
              ]}
            />
          </div>
        )}
        {step === 7 && (
          <div>
            <h2 className="mb-3 font-bold">How do you learn best?</h2>
            <Choice
              value={form.learningStyle}
              onPick={(v) => setForm({ ...form, learningStyle: v })}
              options={[
                { v: "visual", label: "👀 Watching", sub: "Show me examples and animations" },
                { v: "practice", label: "🖐️ Doing", sub: "Let me try it on the board" },
                { v: "reading", label: "📖 Reading", sub: "Explain it clearly first" },
              ]}
            />
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <Button tone="ghost" onClick={back} disabled={step === 0}>← Back</Button>
          <Button onClick={next} disabled={step === 0 && !form.name.trim()}>
            {step === STEPS.length - 1 ? "Create my roadmap 🎉" : "Next →"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
