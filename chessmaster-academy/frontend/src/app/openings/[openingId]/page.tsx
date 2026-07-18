"use client";

import { Chess, type Square } from "chess.js";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import Board from "@/components/board/Board";
import { Badge, Button, Card, LinkButton, SectionTitle } from "@/components/ui";
import { useStore } from "@/store/useStore";
import openingsData from "@/data/openings.json";

interface Opening {
  id: string;
  name: string;
  emoji: string;
  color: "white" | "black";
  history: string;
  ideas: string[];
  mainLine: string[];
  plans: string[];
  mistakes: string[];
  quiz: { q: string; options: string[]; answer: number; why: string }[];
}

/** Interactive move-order trainer: the student plays their side's moves; the other side auto-replies. */
function MoveTrainer({ opening, onDone }: { opening: Opening; onDone: () => void }) {
  const userIsWhite = opening.color === "white";
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [ply, setPly] = useState(0);
  const [wrong, setWrong] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [finished, setFinished] = useState(false);

  const userTurn = (ply % 2 === 0) === userIsWhite;

  // If it's the scripted side's turn (e.g., Black openings start with White's move), auto-play.
  useEffect(() => {
    if (finished || userTurn || ply >= opening.mainLine.length) return;
    const timer = setTimeout(() => {
      try {
        chess.move(opening.mainLine[ply]);
        setFen(chess.fen());
        setPly((p) => p + 1);
      } catch {
        setFinished(true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [ply, userTurn, finished, chess, opening.mainLine]);

  const onMove = (from: Square, to: Square, promotion?: string): boolean => {
    if (finished || !userTurn) return false;
    let move;
    try {
      move = chess.move({ from, to, promotion: (promotion ?? "q") as "q" });
    } catch {
      return false;
    }
    if (move.san !== opening.mainLine[ply]) {
      chess.undo();
      setWrong(true);
      setTimeout(() => setWrong(false), 1400);
      return false;
    }
    setFen(chess.fen());
    setShowHint(false);
    const nextPly = ply + 1;
    setPly(nextPly);
    if (nextPly >= opening.mainLine.length) {
      setFinished(true);
      onDone();
    }
    return true;
  };

  const moveNo = Math.floor(ply / 2) + 1;

  return (
    <div>
      <Board fen={fen} orientation={opening.color} onMove={onMove} maxWidth={420} />
      <div className="mt-3 min-h-12 text-center text-sm">
        {finished ? (
          <p className="pop-in font-bold text-emerald-600 dark:text-emerald-400">✅ Main line complete! You know the move order — now try it in a real game.</p>
        ) : wrong ? (
          <p className="font-bold text-rose-500">That&apos;s a playable move, but not the main line. Try again!</p>
        ) : userTurn ? (
          <button onClick={() => setShowHint(true)} className="font-semibold text-sky-600 hover:underline">
            {showHint ? `💡 Play ${opening.mainLine[ply]}` : `Your move (move ${moveNo}) — need a hint?`}
          </button>
        ) : (
          <p className="text-black/50 dark:text-white/50">Opponent is replying…</p>
        )}
      </div>
    </div>
  );
}

function OpeningQuiz({ opening, onDone }: { opening: Opening; onDone: (score: number) => void }) {
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const q = opening.quiz[qi];

  return (
    <div>
      <p className="mb-3 font-bold">{q.q}</p>
      <div className="space-y-2">
        {q.options.map((o, i) => {
          let cls = "border-black/10 hover:border-emerald-400/60 dark:border-white/15";
          if (picked !== null) {
            if (i === q.answer) cls = "border-emerald-500 bg-emerald-500/10";
            else if (i === picked) cls = "border-rose-500 bg-rose-500/10";
            else cls = "border-black/10 opacity-50 dark:border-white/15";
          }
          return (
            <button
              key={i}
              onClick={() => {
                if (picked !== null) return;
                setPicked(i);
                if (i === q.answer) setScore((v) => v + 1);
              }}
              className={`block w-full rounded-xl border-2 p-3 text-left text-sm font-semibold transition ${cls}`}
            >
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="pop-in mt-3">
          <p className="text-sm">{q.why}</p>
          <Button
            className="mt-3"
            onClick={() => {
              if (qi + 1 < opening.quiz.length) {
                setQi(qi + 1);
                setPicked(null);
              } else onDone(score);
            }}
          >
            {qi + 1 < opening.quiz.length ? "Next →" : "Finish quiz"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function OpeningPage({ params }: { params: Promise<{ openingId: string }> }) {
  const { openingId } = use(params);
  const opening = (openingsData as Opening[]).find((o) => o.id === openingId);
  const { completeOpeningStudy, recordOpeningQuiz, recordOpeningDrill, openingProgress, session, completeSessionStep } = useStore();
  const [tab, setTab] = useState<"study" | "drill" | "quiz">("study");
  const [quizResult, setQuizResult] = useState<number | null>(null);

  if (!opening) {
    return (
      <div className="pt-10 text-center">
        <p className="font-bold">Opening not found.</p>
        <Link href="/openings" className="font-bold text-emerald-600 hover:underline">← Opening Academy</Link>
      </div>
    );
  }

  const prog = openingProgress[opening.id];
  const markSessionOpeningDone = () => {
    const idx = session?.steps.findIndex((st) => st.type === "opening" && !st.done) ?? -1;
    if (idx >= 0) completeSessionStep(idx);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/openings" className="text-sm font-semibold text-black/50 hover:underline dark:text-white/50">← Opening Academy</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-black">{opening.emoji} {opening.name}</h1>
        <Badge tone={opening.color === "white" ? "neutral" : "violet"}>you play {opening.color}</Badge>
        {prog?.drilled && <Badge tone="green">✓ Drilled</Badge>}
        {typeof prog?.quizScore === "number" && <Badge tone="amber">Quiz {prog.quizScore}/{opening.quiz.length}</Badge>}
      </div>

      <div className="flex gap-2">
        {([["study", "📖 Study"], ["drill", "🎯 Move Trainer"], ["quiz", "❓ Quiz"]] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${tab === id ? "bg-emerald-600 text-white" : "bg-black/8 hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/20"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "study" && (
        <div className="space-y-4">
          <Card>
            <SectionTitle>📜 History</SectionTitle>
            <p className="text-sm leading-relaxed">{opening.history}</p>
          </Card>
          <Card>
            <SectionTitle>💡 Strategic ideas</SectionTitle>
            <ul className="space-y-1.5 text-sm">{opening.ideas.map((i, k) => <li key={k}>• {i}</li>)}</ul>
          </Card>
          <Card>
            <SectionTitle>🧭 Typical plans</SectionTitle>
            <ul className="space-y-1.5 text-sm">{opening.plans.map((p, k) => <li key={k}>• {p}</li>)}</ul>
          </Card>
          <Card>
            <SectionTitle>⚠️ Common mistakes</SectionTitle>
            <ul className="space-y-1.5 text-sm">{opening.mistakes.map((m, k) => <li key={k}>• {m}</li>)}</ul>
          </Card>
          <div className="flex justify-end">
            <Button onClick={() => { completeOpeningStudy(opening.id); setTab("drill"); }}>I&apos;ve studied it — to the Move Trainer →</Button>
          </div>
        </div>
      )}

      {tab === "drill" && (
        <Card>
          <SectionTitle>🎯 Play the main line from memory</SectionTitle>
          <p className="mb-3 text-sm text-black/60 dark:text-white/60">
            Main line: <span className="font-mono text-xs">{opening.mainLine.join(" ")}</span>
          </p>
          <MoveTrainer
            opening={opening}
            onDone={() => {
              recordOpeningDrill(opening.id);
              markSessionOpeningDone();
            }}
          />
          <div className="mt-4 flex justify-center">
            <LinkButton href="/play" tone="secondary">⚔️ Practice this opening vs the engine</LinkButton>
          </div>
        </Card>
      )}

      {tab === "quiz" && (
        <Card>
          {quizResult === null ? (
            <OpeningQuiz
              opening={opening}
              onDone={(score) => {
                setQuizResult(score);
                recordOpeningQuiz(opening.id, score);
              }}
            />
          ) : (
            <div className="py-4 text-center">
              <div className="pop-in text-5xl">{quizResult === opening.quiz.length ? "🌟" : "👍"}</div>
              <p className="mt-2 font-bold">Quiz done: {quizResult}/{opening.quiz.length}</p>
              <div className="mt-4 flex justify-center gap-3">
                <Button tone="secondary" onClick={() => setQuizResult(null)}>Retry</Button>
                <LinkButton href="/play">Play it vs the engine →</LinkButton>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
