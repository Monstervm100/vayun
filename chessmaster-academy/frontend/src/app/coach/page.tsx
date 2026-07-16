"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import Board from "@/components/board/Board";
import { Badge, Button, Card, ProgressBar, SectionTitle } from "@/components/ui";
import { answerQuestion, generateSession, STRUGGLES, type CoachAnswer } from "@/lib/coach";
import { useHydrated, useStore } from "@/store/useStore";

interface ChatMsg {
  role: "coach" | "user";
  text: string;
  fen?: string;
  highlights?: CoachAnswer["highlights"];
  followUp?: string[];
}

export default function Coach() {
  const hydrated = useHydrated();
  const s = useStore();
  const [tab, setTab] = useState<"session" | "chat">("session");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const chatEnd = useRef<HTMLDivElement>(null);

  if (!hydrated) return null;

  const stats = (() => {
    const byTheme: Record<string, { t: number; s: number }> = {};
    for (const p of s.puzzleLog) {
      byTheme[p.theme] ??= { t: 0, s: 0 };
      byTheme[p.theme].t++;
      if (p.solved) byTheme[p.theme].s++;
    }
    const themes = Object.entries(byTheme).filter(([, v]) => v.t >= 3);
    const weakest = themes.length ? themes.sort((a, b) => a[1].s / a[1].t - b[1].s / b[1].t)[0][0] : null;
    const analyzed = s.games.filter((g) => g.analysis);
    const blunders = analyzed.reduce((n, g) => n + (g.analysis!.counts.blunder ?? 0), 0);
    return {
      puzzleRating: s.puzzleRating,
      weakestTheme: weakest,
      blunderRate: analyzed.length ? blunders / analyzed.length : null,
      streak: s.streak,
      lessonsDone: Object.values(s.lessonProgress).filter((l) => l.status === "complete").length,
      games: s.games.length,
    };
  })();

  const ask = (q: string) => {
    if (!q.trim()) return;
    const answer = answerQuestion(q, stats);
    setMessages((m) => [
      ...m,
      { role: "user", text: q },
      { role: "coach", text: answer.text, fen: answer.fen, highlights: answer.highlights, followUp: answer.followUp },
    ]);
    setInput("");
    setTimeout(() => chatEnd.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const startSession = (struggleId: string) => {
    const struggle = STRUGGLES.find(function (x) { return x.id === struggleId; })!;
    s.setSession(generateSession(struggle, s.profile.dailyMinutes));
  };

  const sess = s.session;
  const doneSteps = sess?.steps.filter((st) => st.done).length ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-black">🤖 Your Coach</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          {s.profile.onboarded ? `Hi ${s.profile.name}! ` : ""}I build your training and answer your chess questions.
        </p>
      </div>

      <div className="flex gap-2">
        {([["session", "🎯 Today's session"], ["chat", "💬 Ask the coach"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${tab === id ? "bg-emerald-600 text-white" : "bg-black/8 hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/20"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "session" && (
        <>
          {!sess || doneSteps === sess.steps.length ? (
            <Card>
              <SectionTitle>{sess ? "🎉 Session complete! What's next?" : "What do you struggle with today?"}</SectionTitle>
              {sess && <p className="mb-3 text-sm text-emerald-600 dark:text-emerald-400">You finished &quot;{sess.focus}&quot; — brilliant work! Pick tomorrow&apos;s focus or keep training.</p>}
              <div className="grid gap-2 sm:grid-cols-2">
                {STRUGGLES.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => startSession(st.id)}
                    className="rounded-xl border-2 border-black/10 p-3 text-left text-sm font-semibold transition hover:border-emerald-400/60 hover:bg-emerald-500/5 dark:border-white/15"
                  >
                    {st.emoji} {st.label}
                    <span className="block text-xs font-normal opacity-60">Focus: {st.focus}</span>
                  </button>
                ))}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="mb-1 flex items-center justify-between">
                <SectionTitle>🎯 {sess.focus}</SectionTitle>
                <Badge tone="blue">{doneSteps}/{sess.steps.length} done</Badge>
              </div>
              <ProgressBar value={doneSteps} max={sess.steps.length} className="mb-4" />
              <div className="space-y-2">
                {sess.steps.map((st, i) => {
                  const icons = { lesson: "📚", puzzles: "🧩", opening: "🗺️", endgame: "🏰", play: "⚔️", review: "🔁" };
                  const isNext = !st.done && sess.steps.slice(0, i).every((p) => p.done);
                  return (
                    <div key={i} className={`flex items-center justify-between rounded-xl p-3 ${st.done ? "bg-emerald-500/10" : isNext ? "bg-sky-500/10 ring-2 ring-sky-400/40" : "bg-black/5 dark:bg-white/5"}`}>
                      <div className="text-sm">
                        <span className="mr-2">{st.done ? "✅" : icons[st.type]}</span>
                        <span className={`font-semibold ${st.done ? "line-through opacity-60" : ""}`}>{st.label}</span>
                        <span className="ml-2 text-xs opacity-50">~{st.minutes} min</span>
                      </div>
                      {!st.done && (
                        <div className="flex gap-2">
                          <Link href={st.href} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500">
                            {isNext ? "Start →" : "Open"}
                          </Link>
                          <button onClick={() => s.completeSessionStep(i)} className="rounded-lg bg-black/10 px-2 py-1.5 text-xs font-bold hover:bg-black/20 dark:bg-white/10" title="Mark done">✓</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button onClick={() => s.setSession(null)} className="mt-3 text-xs font-semibold text-black/40 hover:underline dark:text-white/40">Choose a different focus</button>
            </Card>
          )}
          <p className="text-center text-xs text-black/40 dark:text-white/40">Every session: one lesson, five puzzles, an opening drill, an endgame drill, and a coached game — 10 to 20 minutes.</p>
        </>
      )}

      {tab === "chat" && (
        <Card>
          <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1">
            {messages.length === 0 && (
              <div className="py-4 text-center text-sm text-black/60 dark:text-white/60">
                <div className="text-4xl">🤖</div>
                <p className="mt-2">Ask me anything about your chess! Try one of these:</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {["What should I study next?", "Why do I keep losing?", "Explain forks simply", "What was the best move?"].map((q) => (
                    <button key={q} onClick={() => ask(q)} className="rounded-full bg-black/8 px-3 py-1.5 text-xs font-bold hover:bg-black/15 dark:bg-white/10">{q}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${m.role === "user" ? "bg-emerald-600 text-white" : "bg-black/5 dark:bg-white/8"}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text.replace(/\*\*/g, "")}</p>
                  {m.fen && (
                    <div className="mt-3">
                      <Board fen={m.fen} highlights={m.highlights} maxWidth={300} />
                    </div>
                  )}
                  {m.followUp && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.followUp.map((f) => (
                        <button key={f} onClick={() => ask(f)} className="rounded-full bg-black/10 px-2.5 py-1 text-xs font-bold hover:bg-black/20 dark:bg-white/15">{f}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEnd} />
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); ask(input); }}
            className="mt-4 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your coach…"
              className="flex-1 rounded-xl border-2 border-black/10 bg-transparent px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 dark:border-white/15"
            />
            <Button type="submit">Send</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
