"use client";

import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { useHydrated, useStore } from "@/store/useStore";
import lessons from "@/data/lessons.json";

const LEVELS = [
  { n: 1, name: "Chess Fundamentals", emoji: "🌱", blurb: "The board, the pieces, and every rule of the game" },
  { n: 2, name: "Opening Principles", emoji: "🎯", blurb: "Center, development, king safety — start every game right" },
  { n: 3, name: "Tactical Mastery", emoji: "⚡", blurb: "Forks, pins, skewers and the art of winning material" },
  { n: 4, name: "Positional Chess", emoji: "🧠", blurb: "Plans, pawn structure, files and squares" },
  { n: 5, name: "Endgames", emoji: "🏰", blurb: "Convert your advantages into wins" },
];

export default function Learn() {
  const hydrated = useHydrated();
  const progress = useStore((s) => s.lessonProgress);
  const all = lessons as { id: string; level: number; title: string; emoji: string; minutes: number }[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">📚 Learning Path</h1>
        <p className="text-sm text-black/60 dark:text-white/60">Five levels from the rules to real mastery. Complete lessons in order — each one ends with practice on a live board.</p>
      </div>

      {LEVELS.map((lvl) => {
        const list = all.filter((l) => l.level === lvl.n);
        const done = hydrated ? list.filter((l) => progress[l.id]?.status === "complete").length : 0;
        return (
          <div key={lvl.n}>
            <div className="mb-2 flex items-center gap-3">
              <span className="text-2xl">{lvl.emoji}</span>
              <div>
                <h2 className="font-black">Level {lvl.n}: {lvl.name}</h2>
                <p className="text-xs text-black/50 dark:text-white/50">{lvl.blurb} · {done}/{list.length} complete</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((l) => {
                const st = hydrated ? progress[l.id]?.status : undefined;
                return (
                  <Link key={l.id} href={`/learn/${l.id}`}>
                    <Card className={`h-full transition hover:-translate-y-0.5 hover:shadow-md ${st === "complete" ? "opacity-80" : ""}`}>
                      <div className="flex items-start justify-between">
                        <span className="text-2xl">{l.emoji}</span>
                        {st === "complete" && <Badge tone="green">✓ Done</Badge>}
                        {st === "in_progress" && <Badge tone="blue">In progress</Badge>}
                      </div>
                      <div className="mt-2 font-bold leading-tight">{l.title}</div>
                      <div className="mt-1 text-xs text-black/50 dark:text-white/50">~{l.minutes} min</div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
