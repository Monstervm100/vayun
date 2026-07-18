"use client";

import { Chess } from "chess.js";
import Link from "next/link";
import { use, useMemo, useState } from "react";
import Board from "@/components/board/Board";
import { Badge, Button, Card, LinkButton, ProgressBar, SectionTitle } from "@/components/ui";
import { analyzeGame } from "@/lib/analysis";
import { useHydrated, useStore, type MoveJudgment } from "@/store/useStore";
import lessonsData from "@/data/lessons.json";

const CLS_META: Record<MoveJudgment["cls"], { label: string; icon: string; tone: "green" | "blue" | "neutral" | "amber" | "red" }> = {
  best: { label: "Best", icon: "⭐", tone: "green" },
  great: { label: "Great", icon: "👍", tone: "green" },
  good: { label: "Good", icon: "✔️", tone: "neutral" },
  inaccuracy: { label: "Inaccuracy", icon: "🤔", tone: "amber" },
  mistake: { label: "Mistake", icon: "❌", tone: "amber" },
  blunder: { label: "Blunder", icon: "💥", tone: "red" },
};

export default function AnalysisPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params);
  const hydrated = useHydrated();
  const { games, setGameAnalysis, addSrsItem } = useStore();
  const game = games.find((g) => g.id === gameId);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [selectedPly, setSelectedPly] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fens = useMemo(() => {
    if (!game) return [];
    const chess = new Chess();
    const list = [chess.fen()];
    for (const m of game.moves) {
      chess.move(m);
      list.push(chess.fen());
    }
    return list;
  }, [game]);

  if (!hydrated) return null;
  if (!game) {
    return (
      <div className="pt-10 text-center">
        <p className="font-bold">Game not found.</p>
        <Link href="/dashboard" className="font-bold text-emerald-600 hover:underline">← Dashboard</Link>
      </div>
    );
  }

  const runAnalysis = async () => {
    setProgress({ done: 0, total: game.moves.length + 1 });
    setError(null);
    try {
      const analysis = await analyzeGame(game.moves, game.color, (p) => setProgress(p));
      setGameAnalysis(game.id, analysis);
      // Worst 3 moments become spaced-repetition homework
      const worst = analysis.judgments
        .filter((j) => j.cls === "blunder" || j.cls === "mistake")
        .slice(0, 3);
      for (const j of worst) {
        if (j.bestSan) {
          addSrsItem({
            id: `game-${game.id}-ply-${j.ply}`,
            kind: "game_mistake",
            fen: fens[j.ply],
            solutionSan: [j.bestSan],
            prompt: `From your game vs Level ${game.level}: find the better move you missed`,
            explanation: j.comment ?? `${j.bestSan} was the move.`,
          });
        }
      }
    } catch {
      setError("The analysis engine could not start in this browser. The game is saved — try again after a refresh.");
    }
    setProgress(null);
  };

  const a = game.analysis;
  const viewFen = selectedPly !== null ? fens[selectedPly + 1] : fens[fens.length - 1];
  const selected = a?.judgments.find((j) => j.ply === selectedPly);
  const recommendedLesson = a?.recommendedLesson
    ? (lessonsData as { id: string; title: string; emoji: string }[]).find((l) => l.id === a.recommendedLesson)
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link href="/dashboard" className="text-sm font-semibold text-black/50 hover:underline dark:text-white/50">← Dashboard</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-black">🔬 Game Review</h1>
        <Badge tone={game.result === "win" ? "green" : game.result === "loss" ? "red" : "neutral"}>{game.result}</Badge>
        <Badge>vs Level {game.level} · you were {game.color}</Badge>
      </div>

      {!a && (
        <Card className="text-center">
          {progress ? (
            <div className="py-6">
              <p className="font-bold">Stockfish is studying your game…</p>
              <ProgressBar value={progress.done} max={progress.total} className="mx-auto mt-3 max-w-sm" />
              <p className="mt-2 text-xs text-black/50 dark:text-white/50">Position {progress.done} of {progress.total}</p>
            </div>
          ) : (
            <div className="py-6">
              <div className="text-5xl">🤖</div>
              <p className="mt-2 font-bold">Ready for your full engine review</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-black/60 dark:text-white/60">
                Every move graded, your accuracy scored, the best alternatives shown, and your worst moments turned into homework.
              </p>
              {error && <p className="mt-2 text-sm font-semibold text-rose-500">{error}</p>}
              <Button onClick={runAnalysis} className="mt-4">Analyze my game</Button>
            </div>
          )}
        </Card>
      )}

      {a && (
        <>
          <div className="grid gap-4 md:grid-cols-[1fr_320px]">
            <Card>
              <Board
                fen={viewFen}
                orientation={game.color}
                highlights={selected ? { ...(selected.bestSan ? {} : {}) } : {}}
                maxWidth={440}
              />
              {selected && (
                <div className="pop-in mt-3 rounded-xl bg-black/5 p-3 text-sm dark:bg-white/5">
                  <p>
                    <b>{CLS_META[selected.cls].icon} {Math.floor(selected.ply / 2) + 1}. {selected.san}</b> — {CLS_META[selected.cls].label}
                    {selected.bestSan && <> · best was <b>{selected.bestSan}</b></>}
                  </p>
                  <p className="mt-1 text-black/60 dark:text-white/60">{selected.comment}</p>
                </div>
              )}
            </Card>

            <div className="space-y-4">
              <Card>
                <SectionTitle>🎯 Accuracy</SectionTitle>
                <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{a.accuracy}%</div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  {(Object.keys(CLS_META) as MoveJudgment["cls"][]).map((c) => (
                    <div key={c} className="rounded-lg bg-black/5 p-2 dark:bg-white/5">
                      <div>{CLS_META[c].icon}</div>
                      <div className="font-bold">{a.counts[c] ?? 0}</div>
                      <div className="opacity-60">{CLS_META[c].label}</div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <SectionTitle>📖 Phase report</SectionTitle>
                <div className="space-y-2 text-sm">
                  <p><b>Opening:</b> {a.phases.opening}</p>
                  <p><b>Middlegame:</b> {a.phases.middlegame}</p>
                  <p><b>Endgame:</b> {a.phases.endgame}</p>
                </div>
              </Card>
            </div>
          </div>

          <Card>
            <SectionTitle>♟️ Your moves — tap any to inspect</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {a.judgments.map((j) => (
                <button
                  key={j.ply}
                  onClick={() => setSelectedPly(selectedPly === j.ply ? null : j.ply)}
                  className={`rounded-lg px-2 py-1 text-xs font-bold transition ${
                    selectedPly === j.ply
                      ? "bg-emerald-600 text-white"
                      : j.cls === "blunder"
                        ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                        : j.cls === "mistake" || j.cls === "inaccuracy"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          : "bg-black/5 dark:bg-white/10"
                  }`}
                >
                  {Math.floor(j.ply / 2) + 1}. {j.san} {CLS_META[j.cls].icon}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle>🏠 Your homework</SectionTitle>
            <ul className="space-y-1.5 text-sm">
              {a.homework?.map((h, i) => <li key={i}>📌 {h}</li>)}
            </ul>
            <div className="mt-4 flex flex-wrap gap-3">
              {recommendedLesson && (
                <LinkButton href={`/learn/${recommendedLesson.id}`}>
                  {recommendedLesson.emoji} Recommended: {recommendedLesson.title}
                </LinkButton>
              )}
              <LinkButton href="/review" tone="secondary">🔁 Review your mistakes</LinkButton>
              <LinkButton href="/play" tone="secondary">⚔️ Rematch</LinkButton>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
