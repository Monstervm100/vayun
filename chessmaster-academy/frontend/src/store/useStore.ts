"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";
import { ACHIEVEMENTS } from "@/data/achievements";
import { nextReview, type ReviewQuality } from "@/lib/srs";

export type Experience = "new" | "casual" | "club" | "tournament";
export type LearningStyle = "visual" | "practice" | "reading";

export interface Profile {
  name: string;
  age: number;
  experience: Experience;
  rating: number;
  targetRating: number;
  favoriteOpening: string;
  weeklyGoalMinutes: number;
  dailyMinutes: number;
  learningStyle: LearningStyle;
  onboarded: boolean;
}

export interface SrsItem {
  id: string;
  kind: "puzzle" | "game_mistake" | "concept";
  fen?: string;
  solutionSan?: string[];
  prompt: string;
  explanation: string;
  due: string; // ISO date
  intervalDays: number;
  ease: number;
  lapses: number;
  reps: number;
}

export interface MoveJudgment {
  ply: number;
  san: string;
  cpBefore: number;
  cpAfter: number;
  cls: "best" | "great" | "good" | "inaccuracy" | "mistake" | "blunder";
  bestSan?: string;
  comment?: string;
}

export interface GameAnalysis {
  accuracy: number;
  counts: Record<string, number>;
  judgments: MoveJudgment[];
  phases: { opening: string; middlegame: string; endgame: string };
  recommendedLesson?: string;
  homework?: string[];
}

export interface GameRecord {
  id: string;
  date: string;
  pgn: string;
  moves: string[];
  result: "win" | "loss" | "draw";
  color: "white" | "black";
  level: number;
  timeControl: string;
  analysis?: GameAnalysis;
}

export interface PuzzleLog {
  id: string;
  theme: string;
  solved: boolean;
  date: string;
  ratingAfter: number;
}

export interface SessionStep {
  type: "lesson" | "puzzles" | "opening" | "endgame" | "play" | "review";
  label: string;
  href: string;
  minutes: number;
  done: boolean;
}

export interface CoachSession {
  id: string;
  createdAt: string;
  focus: string;
  steps: SessionStep[];
}

interface State {
  profile: Profile;
  xp: number;
  coins: number;
  streak: number;
  lastActiveDate: string;
  achievements: Record<string, string>; // id -> unlocked ISO date
  activity: Record<string, number>; // yyyy-mm-dd -> minutes
  puzzleRating: number;
  puzzleLog: PuzzleLog[];
  lessonProgress: Record<string, { status: "in_progress" | "complete"; quizScore?: number }>;
  patternMastery: Record<string, number>; // checkmate pattern id -> consecutive solves
  openingProgress: Record<string, { studied: boolean; quizScore?: number; drilled: boolean }>;
  endgameProgress: Record<string, boolean>;
  srs: SrsItem[];
  games: GameRecord[];
  session: CoachSession | null;
  newAchievements: string[]; // queue for toasts

  completeOnboarding: (p: Omit<Profile, "onboarded">) => void;
  logActivity: (minutes: number) => void;
  awardXp: (xp: number, coins?: number) => void;
  recordPuzzle: (a: { puzzleId: string; theme: string; solved: boolean; puzzleRating: number; fen?: string; solutionSan?: string[]; explanation?: string }) => void;
  completeLesson: (lessonId: string, quizScore: number) => void;
  startLesson: (lessonId: string) => void;
  recordPattern: (patternId: string, solved: boolean) => void;
  completeOpeningStudy: (id: string) => void;
  recordOpeningQuiz: (id: string, score: number) => void;
  recordOpeningDrill: (id: string) => void;
  passEndgameDrill: (id: string) => void;
  addSrsItem: (item: Omit<SrsItem, "due" | "intervalDays" | "ease" | "lapses" | "reps">) => void;
  reviewSrs: (id: string, quality: ReviewQuality) => void;
  addGame: (g: Omit<GameRecord, "id" | "date">) => string;
  setGameAnalysis: (id: string, analysis: GameAnalysis) => void;
  setSession: (s: CoachSession | null) => void;
  completeSessionStep: (index: number) => void;
  popAchievements: () => string[];
  resetAll: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10);

export const levelForXp = (xp: number) => Math.floor(Math.sqrt(xp / 60)) + 1;
export const xpForLevel = (level: number) => (level - 1) ** 2 * 60;

const defaultProfile: Profile = {
  name: "",
  age: 10,
  experience: "new",
  rating: 400,
  targetRating: 1200,
  favoriteOpening: "italian",
  weeklyGoalMinutes: 90,
  dailyMinutes: 15,
  learningStyle: "practice",
  onboarded: false,
};

const initial = {
  profile: defaultProfile,
  xp: 0,
  coins: 0,
  streak: 0,
  lastActiveDate: "",
  achievements: {},
  activity: {},
  puzzleRating: 600,
  puzzleLog: [],
  lessonProgress: {},
  patternMastery: {},
  openingProgress: {},
  endgameProgress: {},
  srs: [],
  games: [],
  session: null,
  newAchievements: [],
};

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const checkAchievements = () => {
        const s = get();
        const fresh: string[] = [];
        for (const a of ACHIEVEMENTS) {
          if (!s.achievements[a.id] && a.check(s)) fresh.push(a.id);
        }
        if (fresh.length) {
          set((st) => ({
            achievements: {
              ...st.achievements,
              ...Object.fromEntries(fresh.map((id) => [id, new Date().toISOString()])),
            },
            newAchievements: [...st.newAchievements, ...fresh],
          }));
        }
      };

      return {
        ...initial,

        completeOnboarding: (p) => {
          set({ profile: { ...p, onboarded: true }, puzzleRating: Math.max(400, p.rating) });
          get().logActivity(2);
          checkAchievements();
        },

        logActivity: (minutes) => {
          const d = today();
          set((s) => {
            const last = s.lastActiveDate;
            let streak = s.streak;
            if (last !== d) {
              const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
              streak = last === yesterday ? streak + 1 : 1;
            }
            return {
              activity: { ...s.activity, [d]: (s.activity[d] ?? 0) + minutes },
              lastActiveDate: d,
              streak,
            };
          });
          checkAchievements();
        },

        awardXp: (xp, coins = 0) => {
          set((s) => ({ xp: s.xp + xp, coins: s.coins + coins }));
          checkAchievements();
        },

        recordPuzzle: ({ puzzleId, theme, solved, puzzleRating, fen, solutionSan, explanation }) => {
          const s = get();
          const expected = 1 / (1 + 10 ** ((puzzleRating - s.puzzleRating) / 400));
          const newRating = Math.round(s.puzzleRating + 24 * ((solved ? 1 : 0) - expected));
          set((st) => ({
            puzzleRating: newRating,
            puzzleLog: [
              ...st.puzzleLog.slice(-499),
              { id: puzzleId, theme, solved, date: new Date().toISOString(), ratingAfter: newRating },
            ],
          }));
          if (solved) get().awardXp(15, 5);
          else if (fen && solutionSan) {
            get().addSrsItem({
              id: `puzzle-${puzzleId}`,
              kind: "puzzle",
              fen,
              solutionSan,
              prompt: `Retry this ${theme} puzzle`,
              explanation: explanation ?? `Look for the ${theme} pattern.`,
            });
          }
          get().logActivity(1);
        },

        startLesson: (lessonId) =>
          set((s) => ({
            lessonProgress: s.lessonProgress[lessonId]?.status === "complete"
              ? s.lessonProgress
              : { ...s.lessonProgress, [lessonId]: { status: "in_progress" } },
          })),

        completeLesson: (lessonId, quizScore) => {
          set((s) => ({
            lessonProgress: { ...s.lessonProgress, [lessonId]: { status: "complete", quizScore } },
          }));
          get().awardXp(40, 10);
          get().logActivity(5);
        },

        recordPattern: (patternId, solved) => {
          set((s) => ({
            patternMastery: {
              ...s.patternMastery,
              [patternId]: solved ? (s.patternMastery[patternId] ?? 0) + 1 : 0,
            },
          }));
          if (solved) get().awardXp(12, 3);
          get().logActivity(1);
        },

        completeOpeningStudy: (id) => {
          set((s) => ({
            openingProgress: { ...s.openingProgress, [id]: { ...s.openingProgress[id], studied: true, drilled: s.openingProgress[id]?.drilled ?? false } },
          }));
          get().awardXp(25, 5);
          get().logActivity(4);
        },

        recordOpeningQuiz: (id, score) => {
          set((s) => ({
            openingProgress: {
              ...s.openingProgress,
              [id]: { studied: s.openingProgress[id]?.studied ?? true, drilled: s.openingProgress[id]?.drilled ?? false, quizScore: score },
            },
          }));
          get().awardXp(15, 5);
        },

        recordOpeningDrill: (id) => {
          set((s) => ({
            openingProgress: {
              ...s.openingProgress,
              [id]: { studied: s.openingProgress[id]?.studied ?? false, quizScore: s.openingProgress[id]?.quizScore, drilled: true },
            },
          }));
          get().awardXp(20, 5);
          get().logActivity(3);
        },

        passEndgameDrill: (id) => {
          set((s) => ({ endgameProgress: { ...s.endgameProgress, [id]: true } }));
          get().awardXp(30, 8);
          get().logActivity(4);
        },

        addSrsItem: (item) => {
          set((s) => {
            if (s.srs.some((i) => i.id === item.id)) return s;
            return {
              srs: [
                ...s.srs,
                { ...item, due: new Date().toISOString(), intervalDays: 0, ease: 2.5, lapses: 0, reps: 0 },
              ],
            };
          });
        },

        reviewSrs: (id, quality) => {
          set((s) => ({
            srs: s.srs
              .map((i) => (i.id === id ? nextReview(i, quality) : i))
              .filter((i) => !(i.id === id && i.reps >= 4 && quality >= 4)), // graduated
          }));
          get().awardXp(10, 2);
          get().logActivity(1);
        },

        addGame: (g) => {
          const id = uid();
          set((s) => ({ games: [...s.games.slice(-99), { ...g, id, date: new Date().toISOString() }] }));
          get().awardXp(g.result === "win" ? 50 : 20, g.result === "win" ? 15 : 5);
          get().logActivity(8);
          checkAchievements();
          return id;
        },

        setGameAnalysis: (id, analysis) => {
          set((s) => ({ games: s.games.map((g) => (g.id === id ? { ...g, analysis } : g)) }));
          checkAchievements();
        },

        setSession: (session) => set({ session }),

        completeSessionStep: (index) => {
          set((s) => {
            if (!s.session) return s;
            const steps = s.session.steps.map((st, i) => (i === index ? { ...st, done: true } : st));
            return { session: { ...s.session, steps } };
          });
          checkAchievements();
        },

        popAchievements: () => {
          const q = get().newAchievements;
          if (q.length) set({ newAchievements: [] });
          return q;
        },

        resetAll: () => set({ ...initial }),
      };
    },
    { name: "chessmaster-academy-v1" }
  )
);

/** Avoid hydration mismatch: render placeholders until the persisted store loads. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
