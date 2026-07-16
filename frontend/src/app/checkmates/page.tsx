"use client";

import { useState } from "react";
import PuzzleSolver, { PuzzleControls, type PuzzleData } from "@/components/PuzzleSolver";
import { Badge, Card, ProgressBar, SectionTitle } from "@/components/ui";
import { useHydrated, useStore } from "@/store/useStore";
import puzzlesData from "@/data/puzzles.json";

interface MatePuzzle extends PuzzleData {
  pattern?: string;
}

const PATTERNS = [
  { id: "mate1", label: "Mate in 1", emoji: "♔", byTheme: true },
  { id: "mate2", label: "Mate in 2", emoji: "👑", byTheme: true },
  { id: "back-rank", label: "Back Rank Mate", emoji: "🏰" },
  { id: "smothered", label: "Smothered Mate", emoji: "🐴" },
  { id: "arabian", label: "Arabian Mate", emoji: "🐫" },
  { id: "anastasia", label: "Anastasia Mate", emoji: "💃" },
  { id: "hook", label: "Hook Mate", emoji: "🪝" },
  { id: "lolli", label: "Lolli Mate", emoji: "🍭" },
  { id: "boden", label: "Boden Mate", emoji: "✂️" },
  { id: "ladder", label: "Ladder Mate", emoji: "🪜" },
];

const MASTERY_TARGET = 3;

export default function CheckmateLab() {
  const hydrated = useHydrated();
  const { patternMastery, recordPattern } = useStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [puzzle, setPuzzle] = useState<MatePuzzle | null>(null);
  const [answered, setAnswered] = useState(false);

  const all = puzzlesData as MatePuzzle[];
  const poolFor = (id: string) => {
    const def = PATTERNS.find((p) => p.id === id)!;
    return def.byTheme ? all.filter((p) => p.theme === id) : all.filter((p) => p.pattern === id);
  };

  const start = (id: string) => {
    setSelected(id);
    setAnswered(false);
    const pool = poolFor(id);
    setPuzzle(pool[Math.floor(Math.random() * pool.length)] ?? null);
  };

  const again = () => {
    if (!selected) return;
    setAnswered(false);
    const pool = poolFor(selected);
    const others = pool.filter((p) => p.id !== puzzle?.id);
    setPuzzle((others.length ? others : pool)[Math.floor(Math.random() * (others.length ? others.length : pool.length))] ?? null);
  };

  if (!hydrated) return null;

  if (selected && puzzle) {
    const streak = patternMastery[selected] ?? 0;
    const mastered = streak >= MASTERY_TARGET;
    const def = PATTERNS.find((p) => p.id === selected)!;
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <button onClick={() => setSelected(null)} className="text-sm font-semibold text-black/50 hover:underline dark:text-white/50">← All patterns</button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black">{def.emoji} {def.label}</h1>
          <Badge tone={mastered ? "green" : "blue"}>{mastered ? "🌟 Mastered!" : `Streak ${streak}/${MASTERY_TARGET}`}</Badge>
        </div>
        <ProgressBar value={Math.min(streak, MASTERY_TARGET)} max={MASTERY_TARGET} />
        <Card>
          <PuzzleSolver
            puzzle={puzzle}
            onResult={(solved) => {
              setAnswered(true);
              recordPattern(selected, solved);
            }}
          />
          {answered && <PuzzleControls onNext={again} label="Drill again →" />}
        </Card>
        <p className="text-center text-xs text-black/40 dark:text-white/40">Solve {MASTERY_TARGET} in a row to master this pattern. A miss resets the streak — that&apos;s how real mastery works!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">♔ Checkmate Lab</h1>
        <p className="text-sm text-black/60 dark:text-white/60">Drill the classic mating patterns until they are automatic. {MASTERY_TARGET} correct in a row = mastery.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PATTERNS.map((p) => {
          const pool = poolFor(p.id);
          const streak = patternMastery[p.id] ?? 0;
          const mastered = streak >= MASTERY_TARGET;
          return (
            <button key={p.id} onClick={() => pool.length && start(p.id)} disabled={!pool.length} className="text-left">
              <Card className={`h-full transition hover:-translate-y-0.5 hover:shadow-md ${!pool.length ? "opacity-40" : ""}`}>
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{p.emoji}</span>
                  {mastered ? <Badge tone="green">🌟 Mastered</Badge> : streak > 0 ? <Badge tone="blue">{streak}/{MASTERY_TARGET}</Badge> : null}
                </div>
                <div className="mt-2 font-bold">{p.label}</div>
                <div className="text-xs text-black/50 dark:text-white/50">{pool.length ? `${pool.length} position${pool.length > 1 ? "s" : ""}` : "Coming soon"}</div>
              </Card>
            </button>
          );
        })}
      </div>
      <Card>
        <SectionTitle>🎓 Why patterns?</SectionTitle>
        <p className="text-sm text-black/60 dark:text-white/60">
          Strong players don&apos;t calculate mates from scratch — they RECOGNIZE them. Every pattern you master here is one you&apos;ll spot instantly in your own games, sometimes many moves ahead.
        </p>
      </Card>
    </div>
  );
}
