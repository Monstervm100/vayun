"use client";

import { Chess, type Square } from "chess.js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Board from "@/components/board/Board";
import { Badge, Button, Card } from "@/components/ui";
import { DIFFICULTY_LEVELS, getEngine } from "@/engine/stockfish";
import { useHydrated, useStore } from "@/store/useStore";

type TimeControl = { id: string; label: string; seconds: number | null; increment: number };
const TIME_CONTROLS: TimeControl[] = [
  { id: "none", label: "♾️ No clock", seconds: null, increment: 0 },
  { id: "5+0", label: "⚡ 5 min", seconds: 300, increment: 0 },
  { id: "10+0", label: "🕐 10 min", seconds: 600, increment: 0 },
  { id: "15+10", label: "🐢 15|10", seconds: 900, increment: 10 },
];

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default function Play() {
  const hydrated = useHydrated();
  const router = useRouter();
  const { addGame, session, completeSessionStep } = useStore();

  const [phase, setPhase] = useState<"setup" | "playing" | "over">("setup");
  const [level, setLevel] = useState(2);
  const [color, setColor] = useState<"white" | "black">("white");
  const [tc, setTc] = useState<TimeControl>(TIME_CONTROLS[0]);

  const chessRef = useRef(new Chess());
  const [fen, setFen] = useState(chessRef.current.fen());
  const [thinking, setThinking] = useState(false);
  const [hint, setHint] = useState<Record<string, "hint">>({});
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [result, setResult] = useState<{ outcome: "win" | "loss" | "draw"; reason: string } | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [clocks, setClocks] = useState<{ w: number; h: number } | null>(null); // w = player, h = engine ("house")
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const overRef = useRef(false);

  const lvl = DIFFICULTY_LEVELS[level - 1];

  const stopClock = () => {
    if (clockRef.current) clearInterval(clockRef.current);
    clockRef.current = null;
  };

  const endGame = (outcome: "win" | "loss" | "draw", reason: string) => {
    if (overRef.current) return;
    overRef.current = true;
    stopClock();
    setResult({ outcome, reason });
    setPhase("over");
    const chess = chessRef.current;
    const id = addGame({
      pgn: chess.pgn(),
      moves: chess.history(),
      result: outcome,
      color,
      level,
      timeControl: tc.id,
    });
    setGameId(id);
    const idx = session?.steps.findIndex((st) => st.type === "play" && !st.done) ?? -1;
    if (idx >= 0) completeSessionStep(idx);
  };

  const checkOver = (chess: Chess): boolean => {
    if (chess.isCheckmate()) {
      const winner = chess.turn() === "w" ? "black" : "white";
      endGame(winner === color ? "win" : "loss", "checkmate");
      return true;
    }
    if (chess.isStalemate()) { endGame("draw", "stalemate"); return true; }
    if (chess.isDraw()) { endGame("draw", "draw"); return true; }
    return false;
  };

  const engineTurn = async () => {
    const chess = chessRef.current;
    if (overRef.current || chess.isGameOver()) return;
    setThinking(true);
    try {
      let moved = false;
      if (Math.random() < lvl.blunderChance) {
        const moves = chess.moves({ verbose: true });
        const quiet = moves.filter((m) => !m.captured);
        const pick = (quiet.length ? quiet : moves)[Math.floor(Math.random() * (quiet.length ? quiet.length : moves.length))];
        chess.move(pick.san);
        moved = true;
      }
      if (!moved) {
        const engine = getEngine();
        await engine.setSkill(lvl.skill);
        const best = await engine.bestMove(chess.fen(), { movetimeMs: lvl.movetimeMs });
        if (best) chess.move({ from: best.slice(0, 2), to: best.slice(2, 4), promotion: (best[4] ?? "q") as "q" });
        else {
          const moves = chess.moves();
          if (moves.length) chess.move(moves[Math.floor(Math.random() * moves.length)]);
        }
      }
    } catch {
      const moves = chess.moves();
      if (moves.length) chess.move(moves[Math.floor(Math.random() * moves.length)]);
    }
    setFen(chess.fen());
    setThinking(false);
    if (tc.seconds) setClocks((c) => (c ? { ...c, h: c.h + tc.increment } : c));
    checkOver(chess);
  };

  const start = () => {
    chessRef.current = new Chess();
    overRef.current = false;
    setFen(chessRef.current.fen());
    setResult(null);
    setGameId(null);
    setHint({});
    setSuggestion(null);
    setPhase("playing");
    if (tc.seconds) {
      setClocks({ w: tc.seconds, h: tc.seconds });
      stopClock();
      clockRef.current = setInterval(() => {
        setClocks((c) => {
          if (!c || overRef.current) return c;
          const chess = chessRef.current;
          const playerTurn = chess.turn() === color[0];
          const next = playerTurn ? { ...c, w: c.w - 1 } : { ...c, h: c.h - 1 };
          if (next.w <= 0) { endGame("loss", "time out"); return { ...next, w: 0 }; }
          if (next.h <= 0) { endGame("win", "engine flagged"); return { ...next, h: 0 }; }
          return next;
        });
      }, 1000);
    } else setClocks(null);
    if (color === "black") setTimeout(engineTurn, 400);
  };

  useEffect(() => () => stopClock(), []);

  const onMove = (from: Square, to: Square, promotion?: string): boolean => {
    const chess = chessRef.current;
    if (phase !== "playing" || thinking || chess.turn() !== color[0]) return false;
    try {
      chess.move({ from, to, promotion: (promotion ?? "q") as "q" });
    } catch {
      return false;
    }
    setFen(chess.fen());
    setHint({});
    setSuggestion(null);
    if (tc.seconds) setClocks((c) => (c ? { ...c, w: c.w + tc.increment } : c));
    if (!checkOver(chess)) setTimeout(engineTurn, 250);
    return true;
  };

  const undo = () => {
    const chess = chessRef.current;
    if (phase !== "playing" || thinking) return;
    chess.undo();
    if (chess.turn() !== color[0]) chess.undo(); // also take back the engine's reply
    setFen(chess.fen());
  };

  const getHint = async () => {
    try {
      const engine = getEngine();
      await engine.setSkill(20);
      const best = await engine.bestMove(chessRef.current.fen(), { depth: 12 });
      if (best) setHint({ [best.slice(0, 2)]: "hint" });
    } catch { /* engine unavailable */ }
  };

  const getSuggestion = async () => {
    try {
      const engine = getEngine();
      await engine.setSkill(20);
      const chess = chessRef.current;
      const best = await engine.bestMove(chess.fen(), { depth: 12 });
      if (!best) return;
      const t = new Chess(chess.fen());
      const mv = t.move({ from: best.slice(0, 2), to: best.slice(2, 4), promotion: (best[4] ?? "q") as "q" });
      let why = "it improves your position";
      if (mv.san.includes("#")) why = "it is checkmate!";
      else if (mv.captured) why = `it wins the ${({ p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" } as Record<string, string>)[mv.captured]} on ${mv.to}`;
      else if (mv.san.includes("+")) why = "the check forces your opponent to react";
      else if (mv.san.startsWith("O-O")) why = "it brings your king to safety";
      setSuggestion(`I suggest ${mv.san} — ${why}.`);
      setHint({ [best.slice(0, 2)]: "hint" });
    } catch { /* engine unavailable */ }
  };

  if (!hydrated) return null;

  if (phase === "setup") {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <h1 className="text-2xl font-black">⚔️ Play a coached game</h1>
        <Card>
          <h2 className="mb-3 font-bold">Choose your opponent</h2>
          <div className="grid gap-2 sm:grid-cols-5">
            {DIFFICULTY_LEVELS.map((l) => (
              <button
                key={l.id}
                onClick={() => setLevel(l.id)}
                className={`rounded-xl border-2 p-3 text-center transition ${level === l.id ? "border-emerald-500 bg-emerald-500/10" : "border-black/10 hover:border-emerald-400/50 dark:border-white/15"}`}
              >
                <div className="text-2xl">{l.emoji}</div>
                <div className="text-sm font-bold">{l.name}</div>
                <div className="text-xs opacity-60">~{l.approxElo}</div>
              </button>
            ))}
          </div>
          <h2 className="mb-3 mt-6 font-bold">Your color</h2>
          <div className="flex gap-2">
            {(["white", "black"] as const).map((c) => (
              <button key={c} onClick={() => setColor(c)} className={`rounded-xl border-2 px-5 py-2 font-bold transition ${color === c ? "border-emerald-500 bg-emerald-500/10" : "border-black/10 dark:border-white/15"}`}>
                {c === "white" ? "⚪ White" : "⚫ Black"}
              </button>
            ))}
          </div>
          <h2 className="mb-3 mt-6 font-bold">Time control</h2>
          <div className="flex flex-wrap gap-2">
            {TIME_CONTROLS.map((t) => (
              <button key={t.id} onClick={() => setTc(t)} className={`rounded-xl border-2 px-4 py-2 text-sm font-bold transition ${tc.id === t.id ? "border-emerald-500 bg-emerald-500/10" : "border-black/10 dark:border-white/15"}`}>
                {t.label}
              </button>
            ))}
          </div>
          <Button onClick={start} className="mt-6 w-full">Start game vs {lvl.emoji} {lvl.name}</Button>
        </Card>
        <p className="text-center text-xs text-black/40 dark:text-white/40">Playing friends and online players arrives in the next milestone — for now Stockfish never sleeps.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-black">You vs {lvl.emoji} {lvl.name}</h1>
        <div className="flex items-center gap-2">
          {clocks && (
            <>
              <Badge tone={clocks.h < 30 ? "red" : "neutral"}>🤖 {fmt(clocks.h)}</Badge>
              <Badge tone={clocks.w < 30 ? "red" : "green"}>🧑 {fmt(clocks.w)}</Badge>
            </>
          )}
          {thinking && <Badge tone="blue">thinking…</Badge>}
        </div>
      </div>

      <Card>
        <Board fen={fen} orientation={color} onMove={onMove} highlights={hint} maxWidth={480} />
        {suggestion && <p className="pop-in mt-3 rounded-xl bg-sky-500/10 p-3 text-center text-sm font-semibold text-sky-700 dark:text-sky-300">🤖 {suggestion}</p>}

        {phase === "playing" && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button tone="secondary" onClick={getHint}>💡 Hint</Button>
            <Button tone="secondary" onClick={getSuggestion}>🧭 Suggest a move</Button>
            <Button tone="secondary" onClick={undo}>↩️ Undo</Button>
            <Button tone="danger" onClick={() => endGame("loss", "resigned")}>🏳️ Resign</Button>
          </div>
        )}

        {phase === "over" && result && (
          <div className="pop-in mt-4 text-center">
            <div className="text-5xl">{result.outcome === "win" ? "🏆" : result.outcome === "draw" ? "🤝" : "💪"}</div>
            <h2 className="mt-2 text-xl font-black">
              {result.outcome === "win" ? "You won!" : result.outcome === "draw" ? "A draw!" : "You lost this one"} <span className="text-sm font-semibold opacity-60">({result.reason})</span>
            </h2>
            <p className="mt-1 text-sm text-black/60 dark:text-white/60">
              {result.outcome === "win" ? "+50 XP! Now let's see WHY you won —" : "Every loss is a lesson in disguise —"} the analysis makes you stronger.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              {gameId && <Button onClick={() => router.push(`/analysis/${gameId}`)}>🔬 Analyze this game</Button>}
              <Button tone="secondary" onClick={() => setPhase("setup")}>Play again</Button>
            </div>
          </div>
        )}
      </Card>

      <p className="text-center text-xs text-black/40 dark:text-white/40">
        Hints and suggestions are training wheels — use them to learn, then try a game without them. <Link href="/coach" className="font-bold text-emerald-600">Ask the coach</Link> if a move confuses you.
      </p>
    </div>
  );
}
