"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { levelForXp, useHydrated, useStore } from "@/store/useStore";
import { achievementById } from "@/data/achievements";

const NAV = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/coach", label: "Coach", icon: "🤖" },
  { href: "/learn", label: "Learn", icon: "📚" },
  { href: "/tactics", label: "Tactics", icon: "🧩" },
  { href: "/checkmates", label: "Checkmate Lab", icon: "♔" },
  { href: "/openings", label: "Openings", icon: "🗺️" },
  { href: "/endgames", label: "Endgames", icon: "🏰" },
  { href: "/play", label: "Play", icon: "⚔️" },
  { href: "/review", label: "Review", icon: "🔁" },
  { href: "/progress", label: "Progress", icon: "📈" },
  { href: "/parents", label: "Parents", icon: "👪" },
  { href: "/admin", label: "Admin", icon: "🛠️" },
];

const MOBILE_NAV = NAV.filter((n) => ["/", "/coach", "/learn", "/tactics", "/play"].includes(n.href));

/** Anonymous visit ping: random id, once per browser session, no PII. */
function useVisitTracking() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("cma-tracked")) return;
      sessionStorage.setItem("cma-tracked", "1");
      let visitorId = localStorage.getItem("cma-visitor-id");
      if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem("cma-visitor-id", visitorId);
      }
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId }),
      }).catch(() => {});
    } catch {
      // storage unavailable — skip tracking
    }
  }, []);
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("cma-theme", next ? "dark" : "light");
  };
  return (
    <button onClick={toggle} aria-label="Toggle dark mode" className="rounded-lg p-2 text-lg hover:bg-black/8 dark:hover:bg-white/10">
      {dark ? "🌙" : "☀️"}
    </button>
  );
}

function AchievementToasts() {
  const newAchievements = useStore((s) => s.newAchievements);
  const popAchievements = useStore((s) => s.popAchievements);
  const [toasts, setToasts] = useState<string[]>([]);

  useEffect(() => {
    if (newAchievements.length === 0) return;
    const ids = popAchievements();
    setToasts((t) => [...t, ...ids]);
    // Each toast removes itself after exactly 3 seconds
    for (const id of ids) {
      setTimeout(() => setToasts((t) => t.filter((x) => x !== id)), 3000);
    }
  }, [newAchievements, popAchievements]);

  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-20 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 md:bottom-6">
      {toasts.map((id) => {
        const a = achievementById(id);
        if (!a) return null;
        return (
          <div key={id} className="pop-in rounded-2xl border border-amber-400/40 bg-amber-50 p-3 text-center shadow-lg dark:bg-amber-950/80">
            <div className="text-2xl">{a.icon}</div>
            <div className="font-extrabold text-amber-800 dark:text-amber-200">Achievement unlocked: {a.title}!</div>
            <div className="text-xs text-amber-700/80 dark:text-amber-300/80">{a.description}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  useVisitTracking();
  const { xp, coins, streak, profile } = useStore();
  const level = levelForXp(xp);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="no-print sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-black/8 bg-white p-4 dark:border-white/10 dark:bg-[#12131c] md:flex">
        <Link href="/" className="mb-6 flex items-center gap-2 px-2">
          <span className="text-2xl" aria-hidden>♞</span>
          <span className="text-lg font-black tracking-tight">
            ChessMaster<span className="text-emerald-500">Academy</span>
          </span>
        </Link>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                isActive(n.href)
                  ? "bg-emerald-600/12 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"
                  : "text-black/70 hover:bg-black/6 dark:text-white/70 dark:hover:bg-white/8"
              }`}
            >
              <span aria-hidden>{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 rounded-xl bg-black/5 p-3 text-sm dark:bg-white/5">
          {hydrated && profile.onboarded ? (
            <>
              <div className="font-bold">{profile.name || "Player"}</div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-black/60 dark:text-white/60">
                <span>⭐ Lv {level}</span>
                <span>⚡ {xp} XP</span>
                <span>🪙 {coins}</span>
                <span>🔥 {streak}d</span>
              </div>
            </>
          ) : (
            <Link href="/onboarding" className="font-bold text-emerald-600 dark:text-emerald-400">
              Start your journey →
            </Link>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="no-print sticky top-0 z-40 flex items-center justify-between border-b border-black/8 bg-white/80 px-4 py-2 backdrop-blur dark:border-white/10 dark:bg-[#12131c]/80">
          <Link href="/" className="flex items-center gap-2 font-black md:hidden">
            <span aria-hidden>♞</span> ChessMaster
          </Link>
          <div className="hidden text-sm font-semibold text-black/50 dark:text-white/50 md:block">
            {hydrated && profile.onboarded ? `Welcome back, ${profile.name || "Player"}! Ready to train?` : "Your personal chess coach"}
          </div>
          <div className="flex items-center gap-1">
            {hydrated && profile.onboarded && (
              <span className="mr-1 hidden rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 sm:block">
                🔥 {streak}-day streak
              </span>
            )}
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 md:pb-8">{children}</main>

        <footer className="no-print mx-auto w-full max-w-6xl px-4 pb-24 pt-2 text-center text-xs text-black/40 dark:text-white/40 md:pb-6">
          ♟️ Created by <span className="font-bold">Mithil Bhansali</span> · For — <span className="font-bold">Vayun Bro</span> ❤️
        </footer>

        {/* Mobile bottom nav */}
        <nav className="no-print fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-black/8 bg-white/95 py-1.5 backdrop-blur dark:border-white/10 dark:bg-[#12131c]/95 md:hidden">
          {MOBILE_NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex flex-col items-center rounded-lg px-3 py-1 text-[11px] font-semibold ${
                isActive(n.href) ? "text-emerald-600 dark:text-emerald-400" : "text-black/60 dark:text-white/60"
              }`}
            >
              <span className="text-lg" aria-hidden>{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
      <AchievementToasts />
    </div>
  );
}
