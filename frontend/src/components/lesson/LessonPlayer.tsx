"use client";

import { Chess, type Square } from "chess.js";
import Link from "next/link";
import { useEffect, useState } from "react";
import Board from "@/components/board/Board";
import { Button, Card, ProgressBar } from "@/components/ui";
import { useStore } from "@/store/useStore";

export interface LessonStep {
  type: "explain" | "example" | "practice" | "quiz" | "summary";
  title?: string;
  text?: string | string[];
  fen?: string;
  arrows?: [string, string][];
  highlights?: Record<string, "hint" | "good" | "bad" | "last">;
  task?: string;
  accept?: "exact" | "check" | "mate" | "castle" | "capture" | "promote";
  correct?: string[];
  success?: string;
  hint?: string;
  questions?: { q: string; options: string[]; answer: number; why: string }[];
  points?: string[];
}

export interface Lesson {
  id: string;
  level: number;
  title: string;
  emoji: string;
  minutes: number;
  steps: LessonStep[];
}

function Practice({ step, onSolved }: { step: LessonStep; onSolved: () => void }) {
  const [fen, setFen] = useState(step.fen!);
  const [state, setState] = useState<"trying" | "wrong" | "solved">("trying");
  const [showHint, setShowHint] = useState(false);
  const [lastMove, setLastMove] = useState<Record<string, "last">>({});

  const tryMove = (from: Square, to: Square, promotion?: string): boolean => {
    if (state === "solved") return false;
    const chess = new Chess(step.fen!);
    let move;
    try {
      move = chess.move({ from, to, promotion: (promotion ?? "q") as "q" });
    } catch {
      return false;
    }
    let ok = false;
    switch (step.accept) {
      case "exact": ok = step.correct!.includes(move.san); break;
      case "check": ok = chess.inCheck(); break;
      case "mate": ok = chess.isCheckmate(); break;
      case "castle": ok = move.san.startsWith("O-O"); break;
      case "capture": ok = !!move.captured; break;
      case "promote": ok = !!move.promotion; break;
    }
    if (ok) {
      setFen(chess.fen());
      setLastMove({ [to]: "last" });
      setState("solved");
      onSolved();
      return true;
    }
    setState("wrong");
    setTimeout(() => setState("trying"), 1500);
    return false;
  };

  return (
    <div>
      <p className="mb-3 font-semibold">🖐️ {step.task}</p>
      <Board fen={fen} onMove={state !== "solved" ? tryMove : undefined} highlights={lastMove} maxWidth={420} />
      <div className="mt-3 min-h-12 text-center">
        {state === "solved" && <p className="pop-in font-bold text-emerald-600 dark:text-emerald-400">✅ {step.success}</p>}
        {state === "wrong" && <p className="font-bold text-rose-500">Not quite — try again! {showHint ? "" : ""}</p>}
        {state === "trying" && (
          <button onClick={() => setShowHint(true)} className="text-sm font-semibold text-sky-600 hover:underline">
            {showHint ? `💡 ${step.hint}` : "Need a hint?"}
          </button>
        )}
      </div>
    </div>
  );
}

function Quiz({ step, onDone }: { step: LessonStep; onDone: (score: number) => void }) {
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const q = step.questions![qi];

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) setScore((v) => v + 1);
  };
  const nextQ = () => {
    if (qi + 1 < step.questions!.length) {
      setQi(qi + 1);
      setPicked(null);
    } else {
      onDone(score);
    }
  };

  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-black/50 dark:text-white/50">Quiz · question {qi + 1} of {step.questions!.length}</p>
      <p className="mb-4 font-bold">{q.q}</p>
      <div className="space-y-2">
        {q.options.map((o, i) => {
          let cls = "border-black/10 hover:border-emerald-400/60 dark:border-white/15";
          if (picked !== null) {
            if (i === q.answer) cls = "border-emerald-500 bg-emerald-500/10";
            else if (i === picked) cls = "border-rose-500 bg-rose-500/10";
            else cls = "border-black/10 opacity-50 dark:border-white/15";
          }
          return (
            <button key={i} onClick={() => pick(i)} className={`block w-full rounded-xl border-2 p-3 text-left text-sm font-semibold transition ${cls}`}>
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="pop-in mt-4">
          <p className="text-sm"><b>{picked === q.answer ? "✅ Correct!" : "❌ Not this time."}</b> {q.why}</p>
          <Button onClick={nextQ} className="mt-3">{qi + 1 < step.questions!.length ? "Next question →" : "Finish quiz"}</Button>
        </div>
      )}
    </div>
  );
}

export default function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const { startLesson, completeLesson, lessonProgress } = useStore();
  const [stepIdx, setStepIdx] = useState(0);
  const [stepDone, setStepDone] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const alreadyComplete = lessonProgress[lesson.id]?.status === "complete";

  useEffect(() => startLesson(lesson.id), [lesson.id, startLesson]);

  const step = lesson.steps[stepIdx];
  const isLast = stepIdx === lesson.steps.length - 1;
  const needsAction = (step.type === "practice" || step.type === "quiz") && !stepDone;

  const advance = () => {
    if (isLast) {
      if (!alreadyComplete) completeLesson(lesson.id, quizScore);
      setFinished(true);
    } else {
      setStepIdx(stepIdx + 1);
      setStepDone(false);
    }
  };

  if (finished) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <div className="pop-in text-6xl">🎓</div>
        <h2 className="mt-3 text-2xl font-black">Lesson complete!</h2>
        <p className="mt-2 text-sm text-black/60 dark:text-white/60">
          {lesson.emoji} <b>{lesson.title}</b> — {alreadyComplete ? "reviewed" : "+40 XP, +10 coins"}
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link href="/learn" className="font-bold text-emerald-600 hover:underline">← Back to path</Link>
          <Link href="/tactics" className="font-bold text-emerald-600 hover:underline">Practice puzzles →</Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <Link href="/learn" className="text-sm font-semibold text-black/50 hover:underline dark:text-white/50">← Learning path</Link>
        <h1 className="mt-1 text-2xl font-black">{lesson.emoji} {lesson.title}</h1>
        <ProgressBar value={stepIdx + 1} max={lesson.steps.length} className="mt-3" />
        <p className="mt-1 text-xs text-black/50 dark:text-white/50">Step {stepIdx + 1} of {lesson.steps.length}</p>
      </div>

      <Card>
        {step.title && <h2 className="mb-3 text-lg font-bold">{step.title}</h2>}

        {(step.type === "explain" || step.type === "example") && (
          <div className="space-y-3">
            {(Array.isArray(step.text) ? step.text : step.text ? [step.text] : []).map((t, i) => (
              <p key={i} className="leading-relaxed">{t}</p>
            ))}
            {step.fen && (
              <Board
                fen={step.fen}
                highlights={step.highlights}
                arrows={step.arrows as [Square, Square][] | undefined}
                maxWidth={400}
              />
            )}
          </div>
        )}

        {step.type === "practice" && <Practice key={stepIdx} step={step} onSolved={() => setStepDone(true)} />}

        {step.type === "quiz" && (
          <Quiz
            key={stepIdx}
            step={step}
            onDone={(score) => {
              setQuizScore(score);
              setStepDone(true);
            }}
          />
        )}

        {step.type === "summary" && (
          <ul className="space-y-2">
            {step.points!.map((p, i) => (
              <li key={i} className="flex gap-2"><span>✅</span><span>{p}</span></li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex justify-between">
          <Button tone="ghost" onClick={() => { setStepIdx(Math.max(0, stepIdx - 1)); setStepDone(false); }} disabled={stepIdx === 0}>← Back</Button>
          <Button onClick={advance} disabled={needsAction}>
            {isLast ? "Complete lesson 🎉" : needsAction ? (step.type === "quiz" ? "Finish the quiz first" : "Solve it on the board!") : "Continue →"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
