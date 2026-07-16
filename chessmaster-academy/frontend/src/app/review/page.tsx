"use client";

import { Chess, type Square } from "chess.js";
import Link from "next/link";
import { useState } from "react";
import Board from "@/components/board/Board";
import { Badge, Button, Card } from "@/components/ui";
import { dueItems } from "@/lib/srs";
import { useHydrated, useStore, type SrsItem } from "@/store/useStore";

function ReviewCard({ item, onGraded }: { item: SrsItem; onGraded: (q: 0 | 3 | 4 | 5) => void }) {
  const [fen, setFen] = useState(item.fen ?? "");
  const [state, setState] = useState<"trying" | "wrong" | "solved">("trying");
  const [tries, setTries] = useState(0);

  const onMove = (from: Square, to: Square, promotion?: string): boolean => {
    if (!item.fen || !item.solutionSan || state === "solved") return false;
    const chess = new Chess(item.fen);
    let move;
    try {
      move = chess.move({ from, to, promotion: (promotion ?? "q") as "q" });
    } catch {
      return false;
    }
    const expected = item.solutionSan[0];
    if (move.san === expected || chess.isCheckmate()) {
      setFen(chess.fen());
      setState("solved");
      return true;
    }
    setTries((t) => t + 1);
    setState("wrong");
    setTimeout(() => setState((s) => (s === "wrong" ? "trying" : s)), 1200);
    return false;
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-bold">🔁 {item.prompt}</span>
        <Badge tone={item.kind === "game_mistake" ? "amber" : "violet"}>{item.kind === "game_mistake" ? "from your game" : "puzzle"}</Badge>
      </div>
      {item.fen ? (
        <Board fen={fen} orientation={new Chess(item.fen).turn() === "w" ? "white" : "black"} onMove={state !== "solved" ? onMove : undefined} maxWidth={420} />
      ) : (
        <p className="rounded-xl bg-black/5 p-4 text-sm dark:bg-white/5">{item.explanation}</p>
      )}
      <div className="mt-3 text-center text-sm">
        {state === "wrong" && <p className="font-bold text-rose-500">Not quite — remember: {item.explanation}</p>}
        {state === "solved" && (
          <div className="pop-in">
            <p className="font-bold text-emerald-600 dark:text-emerald-400">✅ You remembered it!</p>
            <p className="mb-3 mt-1 text-black/60 dark:text-white/60">How hard was that?</p>
            <div className="flex justify-center gap-2">
              <Button tone="secondary" onClick={() => onGraded(tries > 0 ? 3 : 3)}>😅 Hard</Button>
              <Button tone="secondary" onClick={() => onGraded(4)}>🙂 Good</Button>
              <Button onClick={() => onGraded(5)}>😎 Easy</Button>
            </div>
          </div>
        )}
        {state === "trying" && item.fen && (
          <button onClick={() => onGraded(0)} className="text-xs font-semibold text-black/40 hover:underline dark:text-white/40">
            I don&apos;t remember — show me again tomorrow
          </button>
        )}
      </div>
    </div>
  );
}

export default function Review() {
  const hydrated = useHydrated();
  const { srs, reviewSrs } = useStore();
  const [reviewedNow, setReviewedNow] = useState(0);

  if (!hydrated) return null;

  const due = dueItems(srs);
  const current = due[0];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-black">🔁 Review Queue</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Spaced repetition: your past mistakes return right before you&apos;d forget them. Beat them enough times and they graduate for good.
        </p>
      </div>

      <div className="flex gap-3 text-sm">
        <Badge tone="blue">{due.length} due now</Badge>
        <Badge>{srs.length} in the queue</Badge>
        {reviewedNow > 0 && <Badge tone="green">{reviewedNow} reviewed today</Badge>}
      </div>

      <Card>
        {current ? (
          <ReviewCard
            key={current.id}
            item={current}
            onGraded={(q) => {
              reviewSrs(current.id, q);
              if (q > 0) setReviewedNow((r) => r + 1);
            }}
          />
        ) : (
          <div className="py-8 text-center">
            <div className="text-5xl">🌈</div>
            <p className="mt-2 font-bold">{srs.length ? "All caught up!" : "Your queue is empty!"}</p>
            <p className="mt-1 text-sm text-black/60 dark:text-white/60">
              {srs.length
                ? "Nothing due right now — items will return when it's time to strengthen the memory."
                : "Miss a puzzle or blunder in a game and it will appear here for scheduled review."}
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Link href="/tactics" className="font-bold text-emerald-600 hover:underline">Solve puzzles →</Link>
              <Link href="/play" className="font-bold text-emerald-600 hover:underline">Play a game →</Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
