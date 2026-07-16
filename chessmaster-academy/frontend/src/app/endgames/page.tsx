"use client";

import { Chess, type Square } from "chess.js";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import Board from "@/components/board/Board";
import { Badge, Button, Card, SectionTitle } from "@/components/ui";
import { getEngine } from "@/engine/stockfish";
import { useHydrated, useStore } from "@/store/useStore";
import endgamesData from "@/data/endgames.json";

interface Drill {
  id: string;
  name: string;
  emoji: string;
  difficulty: number;
  fen: string;
  playerColor: "white" | "black";
  goal: "win" | "draw";
  maxMoves: number;
  description: string;
  hints: string[];
}

function DrillPlayer({ drill, onExit }: { drill: Drill; onExit: () => void }) {
  const passEndgameDrill = useStore((s) => s.passEndgameDrill);
  const { session, completeSessionStep } = useStore();
  const chessRef = useRef(new Chess(drill.fen));
  const [fen, setFen] = useState(drill.fen);
  const [thinking, setThinking] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [hintIdx, setHintIdx] = useState(-1);
  const [outcome, setOutcome] = useState<"playing" | "passed" | "failed">("playing");
  const reported = useRef(false);

  const finish = (passed: boolean) => {
    if (reported.current) return;
    reported.current = true;
    setOutcome(passed ? "passed" : "failed");
    if (passed) {
      passEndgameDrill(drill.id);
      const idx = session?.steps.findIndex((st) => st.type === "endgame" && !st.done) ?? -1;
      if (idx >= 0) completeSessionStep(idx);
    }
  };

  const checkGameOver = (chess: Chess): boolean => {
    if (chess.isCheckmate()) {
      const winnerIsPlayer = (chess.turn() === "w" ? "black" : "white") === drill.playerColor;
      finish(drill.goal === "win" ? winnerIsPlayer : false);
      return true;
    }
    if (chess.isDraw()) {
      finish(drill.goal === "draw");
      return true;
    }
    return false;
  };

  const engineMove = async (chess: Chess) => {
    setThinking(true);
    try {
      const engine = getEngine();
      await engine.setSkill(20);
      const best = await engine.bestMove(chess.fen(), { movetimeMs: 300 });
      if (best) {
        chess.move({ from: best.slice(0, 2), to: best.slice(2, 4), promotion: (best[4] ?? "q") as "q" });
        setFen(chess.fen());
      }
    } catch {
      // engine unavailable: play first legal move so the drill still works
      const moves = chess.moves();
      if (moves.length) {
        chess.move(moves[0]);
        setFen(chess.fen());
      }
    }
    setThinking(false);
    checkGameOver(chess);
  };

  // If the engine moves first (e.g. opposition drill starts with black to move)
  const engineStarts = new Chess(drill.fen).turn() !== drill.playerColor[0];
  useEffect(() => {
    if (engineStarts) engineMove(chessRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMove = (from: Square, to: Square, promotion?: string): boolean => {
    const chess = chessRef.current;
    if (outcome !== "playing" || thinking) return false;
    try {
      chess.move({ from, to, promotion: (promotion ?? "q") as "q" });
    } catch {
      return false;
    }
    setFen(chess.fen());
    const n = moveCount + 1;
    setMoveCount(n);
    if (checkGameOver(chess)) return true;
    if (n >= drill.maxMoves) {
      finish(false);
      return true;
    }
    engineMove(chess);
    return true;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <button onClick={onExit} className="text-sm font-semibold text-black/50 hover:underline dark:text-white/50">← All drills</button>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-black">{drill.emoji} {drill.name}</h1>
        <Badge tone={drill.goal === "win" ? "green" : "blue"}>Goal: {drill.goal === "win" ? "WIN" : "HOLD THE DRAW"} · {drill.maxMoves - moveCount} moves left</Badge>
      </div>
      <p className="text-sm text-black/60 dark:text-white/60">{drill.description}</p>
      <Card>
        <Board fen={fen} orientation={drill.playerColor} onMove={outcome === "playing" ? onMove : undefined} maxWidth={440} />
        <div className="mt-3 min-h-16 text-center text-sm">
          {outcome === "passed" && (
            <div className="pop-in">
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">🏆 Drill passed! +30 XP</p>
              <Button className="mt-2" tone="secondary" onClick={onExit}>Back to the lab</Button>
            </div>
          )}
          {outcome === "failed" && (
            <div className="pop-in">
              <p className="font-bold text-rose-500">{drill.goal === "win" ? "The win slipped away — that happens to everyone learning this." : "The draw slipped away."} Try again with the hints!</p>
              <Button className="mt-2" onClick={() => { chessRef.current = new Chess(drill.fen); setFen(drill.fen); setMoveCount(0); setOutcome("playing"); reported.current = false; if (engineStarts) engineMove(chessRef.current); }}>Retry drill</Button>
            </div>
          )}
          {outcome === "playing" && (thinking ? (
            <p className="text-black/50 dark:text-white/50">Stockfish is defending…</p>
          ) : (
            <button onClick={() => setHintIdx((h) => Math.min(h + 1, drill.hints.length - 1))} className="font-semibold text-sky-600 hover:underline">
              {hintIdx >= 0 ? `💡 ${drill.hints[hintIdx]}` : "Need a hint?"}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function EndgamesInner() {
  const hydrated = useHydrated();
  const progress = useStore((s) => s.endgameProgress);
  const params = useSearchParams();
  const drills = endgamesData as Drill[];
  const [active, setActive] = useState<Drill | null>(null);

  useEffect(() => {
    const id = params.get("drill");
    if (id) setActive(drills.find((d) => d.id === id) ?? null);
  }, [params, drills]);

  if (!hydrated) return null;
  if (active) return <DrillPlayer key={active.id} drill={active} onExit={() => setActive(null)} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">🏰 Endgame Lab</h1>
        <p className="text-sm text-black/60 dark:text-white/60">Play the must-know endgames against Stockfish at full strength — if your technique is right, it cannot save itself.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {drills.map((d) => (
          <button key={d.id} onClick={() => setActive(d)} className="text-left">
            <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between">
                <span className="text-3xl">{d.emoji}</span>
                <div className="flex gap-1">
                  <Badge>{"★".repeat(d.difficulty)}</Badge>
                  {progress[d.id] && <Badge tone="green">✓ Passed</Badge>}
                </div>
              </div>
              <div className="mt-2 font-bold">{d.name}</div>
              <p className="mt-1 line-clamp-2 text-xs text-black/50 dark:text-white/50">{d.description}</p>
              <Badge tone={d.goal === "win" ? "green" : "blue"}>{d.goal === "win" ? "Win it" : "Draw it"}</Badge>
            </Card>
          </button>
        ))}
      </div>
      <Card>
        <SectionTitle>🎓 Why endgames first?</SectionTitle>
        <p className="text-sm text-black/60 dark:text-white/60">
          Capablanca said to study endgames before openings: with few pieces, the true powers of each piece become clear — and every won middlegame still has to be converted here.
        </p>
      </Card>
    </div>
  );
}

export default function Endgames() {
  return (
    <Suspense>
      <EndgamesInner />
    </Suspense>
  );
}
