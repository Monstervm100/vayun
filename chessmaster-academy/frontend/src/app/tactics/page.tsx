"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import PuzzleSolver, { PuzzleControls, type PuzzleData } from "@/components/PuzzleSolver";
import { Badge, Card, StatTile } from "@/components/ui";
import { useHydrated, useStore } from "@/store/useStore";
import puzzlesData from "@/data/puzzles.json";

const THEMES = [
  { id: "all", label: "Mixed", emoji: "🎲" },
  { id: "fork", label: "Fork", emoji: "🍴" },
  { id: "pin", label: "Pin", emoji: "📌" },
  { id: "skewer", label: "Skewer", emoji: "🍢" },
  { id: "doubleAttack", label: "Double Attack", emoji: "⚡" },
  { id: "discovered", label: "Discovered Attack", emoji: "🎭" },
  { id: "deflection", label: "Deflection", emoji: "🧲" },
  { id: "hanging", label: "Hanging Pieces", emoji: "🎁" },
  { id: "mate1", label: "Mate in 1", emoji: "♔" },
  { id: "mate2", label: "Mate in 2", emoji: "👑" },
];

/** Adaptive pick: prefer puzzles near the user's rating (±200 window, widening), not just solved. */
function pickPuzzle(all: PuzzleData[], theme: string, userRating: number, solvedIds: Set<string>, excludeId?: string): PuzzleData | null {
  const pool = all.filter((p) => (theme === "all" || p.theme === theme) && p.id !== excludeId);
  if (!pool.length) return null;
  const fresh = pool.filter((p) => !solvedIds.has(p.id));
  const candidates = fresh.length ? fresh : pool;
  for (const window of [150, 300, 600, 9999]) {
    const near = candidates.filter((p) => Math.abs(p.rating - userRating) <= window);
    if (near.length) return near[Math.floor(Math.random() * near.length)];
  }
  return candidates[0];
}

function TacticsInner() {
  const params = useSearchParams();
  const isSession = params.get("session") === "1";
  const initialTheme = params.get("theme") ?? "all";
  const hydrated = useHydrated();
  const s = useStore();

  const [theme, setTheme] = useState(initialTheme);
  const [solvedNow, setSolvedNow] = useState(0);
  const [attemptedNow, setAttemptedNow] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);

  const all = puzzlesData as PuzzleData[];
  const solvedIds = useMemo(() => new Set(s.puzzleLog.filter((p) => p.solved).map((p) => p.id)), [s.puzzleLog]);

  // pick first puzzle once hydrated
  if (hydrated && !puzzle) {
    const p = pickPuzzle(all, theme, s.puzzleRating, solvedIds);
    if (p) setPuzzle(p);
  }

  const next = (newTheme = theme) => {
    setAnswered(false);
    setPuzzle(pickPuzzle(all, newTheme, s.puzzleRating, solvedIds, puzzle?.id));
  };

  const handleResult = (solved: boolean) => {
    if (!puzzle || answered) return;
    setAnswered(true);
    setAttemptedNow((a) => a + 1);
    if (solved) setSolvedNow((v) => v + 1);
    s.recordPuzzle({
      puzzleId: puzzle.id,
      theme: puzzle.theme,
      solved,
      puzzleRating: puzzle.rating,
      fen: puzzle.fen,
      solutionSan: puzzle.line,
      explanation: puzzle.explanation,
    });
    if (isSession && attemptedNow + 1 >= 5) {
      const idx = s.session?.steps.findIndex((st) => st.type === "puzzles") ?? -1;
      if (idx >= 0) s.completeSessionStep(idx);
    }
  };

  if (!hydrated) return null;

  const sessionDone = isSession && attemptedNow >= 5;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black">🧩 Tactics Trainer</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            {isSession ? `Coach session: solve 5 puzzles (${attemptedNow}/5)` : "Adaptive puzzles — the difficulty follows your rating."}
          </p>
        </div>
        <StatTile icon="⚡" label="Puzzle rating" value={s.puzzleRating} />
      </div>

      <div className="flex flex-wrap gap-2">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTheme(t.id); next(t.id); }}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              theme === t.id ? "bg-emerald-600 text-white" : "bg-black/8 hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/20"
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      <Card>
        {sessionDone ? (
          <div className="py-6 text-center">
            <div className="pop-in text-6xl">🎯</div>
            <h2 className="mt-3 text-xl font-black">Puzzle set complete: {solvedNow}/5 solved!</h2>
            <p className="mt-1 text-sm text-black/60 dark:text-white/60">
              {solvedNow >= 4 ? "Outstanding accuracy!" : solvedNow >= 3 ? "Solid work — the misses joined your review queue." : "Tough set! Review the misses and they'll become strengths."}
            </p>
            <Link href="/coach" className="mt-4 inline-block font-bold text-emerald-600 hover:underline">← Back to your session</Link>
          </div>
        ) : puzzle ? (
          <>
            <div className="mb-2 flex gap-2">
              <Badge tone="violet">{THEMES.find((t) => t.id === puzzle.theme)?.label ?? puzzle.theme}</Badge>
              {isSession && <Badge tone="blue">Puzzle {attemptedNow + (answered ? 0 : 1)} of 5</Badge>}
            </div>
            <PuzzleSolver puzzle={puzzle} onResult={handleResult} />
            {answered && <PuzzleControls onNext={() => next()} label={isSession && attemptedNow >= 5 ? "Finish set" : "Next puzzle →"} />}
          </>
        ) : (
          <p className="py-8 text-center text-sm">No puzzles found for this theme yet — try another!</p>
        )}
      </Card>

      <p className="text-center text-xs text-black/40 dark:text-white/40">
        Miss a puzzle? It automatically enters your <Link href="/review" className="font-bold text-emerald-600">spaced-repetition queue</Link> until you master it.
      </p>
    </div>
  );
}

export default function Tactics() {
  return (
    <Suspense>
      <TacticsInner />
    </Suspense>
  );
}
