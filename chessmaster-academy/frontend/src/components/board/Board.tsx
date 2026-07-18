"use client";

import { useEffect, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import type { Square } from "chess.js";

export interface BoardProps {
  fen: string;
  orientation?: "white" | "black";
  /** Return true if the move was accepted. Omit for a static board. */
  onMove?: (from: Square, to: Square, promotion?: string) => boolean;
  /** Squares to tint, e.g. { e4: "hint" }. */
  highlights?: Record<string, "hint" | "good" | "bad" | "last">;
  arrows?: [Square, Square][];
  maxWidth?: number;
  animate?: boolean;
}

const HIGHLIGHT_COLORS: Record<string, string> = {
  hint: "rgba(56, 189, 248, 0.55)",
  good: "rgba(16, 185, 129, 0.55)",
  bad: "rgba(244, 63, 94, 0.55)",
  last: "rgba(250, 204, 21, 0.45)",
};

export default function Board({ fen, orientation = "white", onMove, highlights = {}, arrows = [], maxWidth = 520, animate = true }: BoardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const [selected, setSelected] = useState<Square | null>(null);

  // Click-to-move (accessibility + touch): tap a piece, then tap its destination.
  const handleSquareClick = (square: Square) => {
    if (!onMove) return;
    if (selected && selected !== square) {
      const promotion = square[1] === "8" || square[1] === "1" ? "q" : undefined;
      const ok = onMove(selected, square, promotion);
      setSelected(ok ? null : square);
      return;
    }
    setSelected(selected === square ? null : square);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(Math.min(maxWidth, Math.floor(el.clientWidth)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxWidth]);

  const squareStyles: Record<string, React.CSSProperties> = {};
  for (const [sq, kind] of Object.entries(highlights)) {
    squareStyles[sq] = { boxShadow: `inset 0 0 0 999px ${HIGHLIGHT_COLORS[kind]}` };
  }
  if (selected && onMove) {
    squareStyles[selected] = { boxShadow: "inset 0 0 0 4px rgba(16, 185, 129, 0.9)" };
  }

  return (
    <div ref={ref} className="mx-auto w-full" style={{ maxWidth }}>
      <Chessboard
        position={fen}
        boardWidth={width}
        boardOrientation={orientation}
        arePiecesDraggable={!!onMove}
        animationDuration={animate ? 200 : 0}
        onPieceDrop={(from, to, piece) => {
          if (!onMove) return false;
          setSelected(null);
          const promotion = piece[1] === "P" && (to[1] === "8" || to[1] === "1") ? "q" : undefined;
          return onMove(from as Square, to as Square, promotion);
        }}
        onSquareClick={(square) => handleSquareClick(square as Square)}
        customSquareStyles={squareStyles}
        customArrows={arrows}
        customBoardStyle={{ borderRadius: "12px", boxShadow: "0 6px 24px rgba(0,0,0,0.18)" }}
        customDarkSquareStyle={{ backgroundColor: "#7c9a5a" }}
        customLightSquareStyle={{ backgroundColor: "#eef0d4" }}
      />
    </div>
  );
}
