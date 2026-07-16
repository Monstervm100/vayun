"use client";

import { Chess } from "chess.js";
import { getEngine } from "@/engine/stockfish";
import type { GameAnalysis, MoveJudgment } from "@/store/useStore";

/** Lichess-style win probability from a centipawn score (side to move). */
const winPercent = (cp: number) => 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);

function classify(drop: number): MoveJudgment["cls"] {
  if (drop <= 2) return "best";
  if (drop <= 5) return "great";
  if (drop <= 10) return "good";
  if (drop <= 18) return "inaccuracy";
  if (drop <= 30) return "mistake";
  return "blunder";
}

const PIECE_NAMES: Record<string, string> = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };

function comment(j: MoveJudgment, san: string, bestSan: string | undefined, capturedPiece?: string): string {
  switch (j.cls) {
    case "best":
      return `Excellent — ${san} was the strongest move here.`;
    case "great":
      return `Very good move.`;
    case "good":
      return `A solid choice.`;
    case "inaccuracy":
      return bestSan
        ? `Not bad, but ${bestSan} was more accurate. Ask yourself: what does my opponent threaten, and what is my best square?`
        : `Slightly imprecise.`;
    case "mistake":
      return bestSan
        ? `This gives away some of your advantage. ${bestSan} was much better — always check for checks, captures and threats first.`
        : `This move loses ground.`;
    case "blunder":
      return capturedPiece
        ? `Ouch — this loses your ${capturedPiece}! Before moving, scan the whole board: is the piece you are touching defended where it lands?${bestSan ? ` ${bestSan} kept you safe.` : ""}`
        : `A big slip — the evaluation swung heavily.${bestSan ? ` ${bestSan} was the move.` : ""} Slow down and look for your opponent's best reply before committing.`;
  }
}

/** Detect if the mover left a piece en prise that got (or could get) captured. */
function hangingPieceAfter(fenAfter: string): string | undefined {
  const chess = new Chess(fenAfter);
  // Opponent to move: find best capture of an undefended piece (cheap heuristic).
  for (const m of chess.moves({ verbose: true })) {
    if (m.captured && m.captured !== "p") {
      const test = new Chess(fenAfter);
      test.move(m.san);
      // Is the capture safe (no immediate recapture of equal/greater value)?
      const recaptures = test.moves({ verbose: true }).filter((r) => r.to === m.to && r.captured);
      if (recaptures.length === 0) return PIECE_NAMES[m.captured];
    }
  }
  return undefined;
}

export interface AnalysisProgress {
  done: number;
  total: number;
}

/**
 * Analyze a full game client-side with Stockfish.
 * `userColor` — judgments/accuracy are computed for this side only (the student).
 */
export async function analyzeGame(
  moves: string[],
  userColor: "white" | "black",
  onProgress?: (p: AnalysisProgress) => void,
  depth = 10
): Promise<GameAnalysis> {
  const engine = getEngine();
  const chess = new Chess();

  // Evaluate every position (from White's perspective, normalized).
  const fens: string[] = [chess.fen()];
  const sans: string[] = [];
  for (const san of moves) {
    chess.move(san);
    sans.push(san);
    fens.push(chess.fen());
  }

  const evals: number[] = []; // cp from White's perspective
  const bestMoves: (string | null)[] = [];
  for (let i = 0; i < fens.length; i++) {
    const sideToMove = fens[i].split(" ")[1];
    const r = await engine.evaluate(fens[i], { depth });
    const cpWhite = sideToMove === "w" ? r.cp : -r.cp;
    evals.push(cpWhite);
    bestMoves.push(r.bestMove);
    onProgress?.({ done: i + 1, total: fens.length });
  }

  const judgments: MoveJudgment[] = [];
  const counts = { best: 0, great: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
  const accuracies: number[] = [];

  const replay = new Chess();
  for (let ply = 0; ply < sans.length; ply++) {
    const isWhiteMove = ply % 2 === 0;
    const isUserMove = (userColor === "white") === isWhiteMove;
    const before = evals[ply];
    const after = evals[ply + 1];

    // best move in SAN for the position before the move
    let bestSan: string | undefined;
    const uci = bestMoves[ply];
    if (uci) {
      try {
        const t = new Chess(replay.fen());
        const mv = t.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] as "q" | undefined });
        bestSan = mv?.san;
      } catch {
        bestSan = undefined;
      }
    }

    replay.move(sans[ply]);

    if (isUserMove) {
      const wpBefore = isWhiteMove ? winPercent(before) : 100 - winPercent(before);
      const wpAfter = isWhiteMove ? winPercent(after) : 100 - winPercent(after);
      const drop = Math.max(0, wpBefore - wpAfter);
      const cls = classify(drop);
      counts[cls] += 1;
      accuracies.push(Math.max(0, 100 - drop * 2.2));

      const j: MoveJudgment = {
        ply,
        san: sans[ply],
        cpBefore: before,
        cpAfter: after,
        cls,
        bestSan: cls === "best" ? undefined : bestSan,
      };
      j.comment = comment(
        j,
        sans[ply],
        bestSan,
        cls === "blunder" ? hangingPieceAfter(replay.fen()) : undefined
      );
      judgments.push(j);
    }
  }

  const accuracy = accuracies.length
    ? Math.round((accuracies.reduce((a, b) => a + b, 0) / accuracies.length) * 10) / 10
    : 100;

  // Phase summaries (simple, kid-legible heuristics)
  const openingJ = judgments.filter((j) => j.ply < 20);
  const endStart = Math.max(20, sans.length - 16);
  const middleJ = judgments.filter((j) => j.ply >= 20 && j.ply < endStart);
  const endJ = judgments.filter((j) => j.ply >= endStart);
  const phaseText = (js: MoveJudgment[], phase: string) => {
    if (!js.length) return `The game didn't really reach a ${phase} phase.`;
    const bad = js.filter((j) => j.cls === "mistake" || j.cls === "blunder").length;
    if (bad === 0) return `Strong ${phase} play — no serious errors.`;
    if (bad === 1) return `One serious error in the ${phase}. Review it below and add it to your homework.`;
    return `${bad} serious errors in the ${phase} — this is your biggest improvement area right now.`;
  };

  // Recommend a lesson based on the dominant error source
  const blunders = judgments.filter((j) => j.cls === "blunder").length;
  const openingBad = openingJ.filter((j) => j.cls !== "best" && j.cls !== "great" && j.cls !== "good").length;
  const endBad = endJ.filter((j) => j.cls === "mistake" || j.cls === "blunder").length;
  let recommendedLesson: string | undefined;
  if (blunders >= 2) recommendedLesson = "l3-board-safety";
  else if (openingBad >= 2) recommendedLesson = "l2-opening-principles";
  else if (endBad >= 1) recommendedLesson = "l5-king-activity";
  else recommendedLesson = "l3-fork";

  const homework: string[] = [];
  if (blunders > 0) homework.push(`Solve 5 "hanging piece" puzzles in the Tactics Trainer.`);
  if (openingBad >= 2) homework.push("Replay the first 10 moves of this game and find where development stopped.");
  if (endBad >= 1) homework.push("Do one King & Pawn drill in the Endgame Lab.");
  if (homework.length === 0) homework.push("Great game! Try the next difficulty level or a new opening line.");

  return {
    accuracy,
    counts,
    judgments,
    phases: {
      opening: phaseText(openingJ, "opening"),
      middlegame: phaseText(middleJ, "middlegame"),
      endgame: phaseText(endJ, "endgame"),
    },
    recommendedLesson,
    homework,
  };
}
