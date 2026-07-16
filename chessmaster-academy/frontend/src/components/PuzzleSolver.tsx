"use client";

import { Chess, type Square } from "chess.js";
import { useEffect, useRef, useState } from "react";
import Board from "@/components/board/Board";
import { Button } from "@/components/ui";

export interface PuzzleData {
  id: string;
  fen: string;
  line: string[];
  prompt: string;
  explanation: string;
  theme: string;
  rating: number;
}

/**
 * Plays one puzzle: the user must find each user-move in the line;
 * scripted opponent replies are played automatically.
 * Mate-in-1 puzzles accept ANY checkmating move.
 */
export default function PuzzleSolver({
  puzzle,
  onResult,
}: {
  puzzle: PuzzleData;
  onResult: (solved: boolean) => void;
}) {
  const [chess] = useState(() => new Chess(puzzle.fen));
  const [fen, setFen] = useState(puzzle.fen);
  const [plyIdx, setPlyIdx] = useState(0);
  const [status, setStatus] = useState<"solving" | "wrong" | "solved" | "failed">("solving");
  const [wrongTries, setWrongTries] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [highlights, setHighlights] = useState<Record<string, "hint" | "good" | "bad" | "last">>({});
  const reported = useRef(false);
  const orientation = new Chess(puzzle.fen).turn() === "w" ? "white" : "black";

  // reset when puzzle changes
  useEffect(() => {
    chess.load(puzzle.fen);
    setFen(puzzle.fen);
    setPlyIdx(0);
    setStatus("solving");
    setWrongTries(0);
    setShowHint(false);
    setHighlights({});
    reported.current = false;
  }, [puzzle.id, puzzle.fen, chess]);

  const finish = (solved: boolean) => {
    if (reported.current) return;
    reported.current = true;
    setStatus(solved ? "solved" : "failed");
    onResult(solved);
  };

  const hintSquare = () => {
    const t = new Chess(chess.fen());
    try {
      const mv = t.move(puzzle.line[plyIdx]);
      return mv.from;
    } catch {
      return null;
    }
  };

  const onMove = (from: Square, to: Square, promotion?: string): boolean => {
    if (status === "solved" || status === "failed") return false;
    let move;
    try {
      move = chess.move({ from, to, promotion: (promotion ?? "q") as "q" });
    } catch {
      return false;
    }

    const expected = puzzle.line[plyIdx];
    const isMate1 = puzzle.theme === "mate1" && chess.isCheckmate();
    if (move.san !== expected && !isMate1) {
      chess.undo();
      setWrongTries((w) => w + 1);
      setStatus("wrong");
      setHighlights({ [to]: "bad" });
      setTimeout(() => {
        setStatus((s) => (s === "wrong" ? "solving" : s));
        setHighlights({});
      }, 1200);
      if (wrongTries + 1 >= 3) finish(false);
      return false;
    }

    // Correct user move
    setFen(chess.fen());
    setHighlights({ [to]: "good" });
    const nextPly = plyIdx + 1;

    if (nextPly >= puzzle.line.length || isMate1) {
      finish(true);
      return true;
    }

    // Play scripted opponent reply after a beat
    setTimeout(() => {
      try {
        const reply = chess.move(puzzle.line[nextPly]);
        setFen(chess.fen());
        setHighlights({ [reply.to]: "last" });
        setPlyIdx(nextPly + 1);
      } catch {
        finish(true); // scripted reply impossible — count as solved
      }
    }, 450);
    setPlyIdx(nextPly); // block input until reply lands? plyIdx parity handles it
    return true;
  };

  const userToMove = plyIdx % 2 === 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-bold">{puzzle.prompt}</span>
        <span className="rounded-full bg-black/8 px-2 py-0.5 text-xs font-semibold dark:bg-white/10">⚡ {puzzle.rating}</span>
      </div>
      <Board
        fen={fen}
        orientation={orientation}
        onMove={status !== "solved" && status !== "failed" && userToMove ? onMove : undefined}
        highlights={showHint && status === "solving" ? { ...highlights, [hintSquare() ?? ""]: "hint" } : highlights}
        maxWidth={440}
      />
      <div className="mt-3 min-h-14 text-center text-sm">
        {status === "solving" && (
          <button onClick={() => setShowHint(true)} className="font-semibold text-sky-600 hover:underline">
            {showHint ? "💡 The glowing piece wants to move…" : `Need a hint? (${3 - wrongTries} tries left)`}
          </button>
        )}
        {status === "wrong" && <p className="font-bold text-rose-500">Not that one — look again! ({3 - wrongTries} tries left)</p>}
        {status === "solved" && (
          <div className="pop-in">
            <p className="font-bold text-emerald-600 dark:text-emerald-400">✅ Solved! +15 XP</p>
            <p className="mt-1 text-black/60 dark:text-white/60">{puzzle.explanation}</p>
          </div>
        )}
        {status === "failed" && (
          <div className="pop-in">
            <p className="font-bold text-rose-500">The answer was {puzzle.line.filter((_, i) => i % 2 === 0).join(", ")}.</p>
            <p className="mt-1 text-black/60 dark:text-white/60">{puzzle.explanation} Don&apos;t worry — this puzzle joins your review queue.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function PuzzleControls({ onNext, label = "Next puzzle →" }: { onNext: () => void; label?: string }) {
  return (
    <div className="flex justify-center">
      <Button onClick={onNext}>{label}</Button>
    </div>
  );
}
