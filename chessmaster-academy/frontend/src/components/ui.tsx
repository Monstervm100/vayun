"use client";

import Link from "next/link";
import { type ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-black/8 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#171923] ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-bold tracking-tight">{children}</h2>
      {action}
    </div>
  );
}

export function StatTile({ label, value, sub, icon }: { label: string; value: ReactNode; sub?: string; icon?: string }) {
  return (
    <Card className="flex items-center gap-3 !p-4">
      {icon && <span className="text-2xl" aria-hidden>{icon}</span>}
      <div className="min-w-0">
        <div className="truncate text-xs font-medium uppercase tracking-wide text-black/50 dark:text-white/50">{label}</div>
        <div className="text-xl font-extrabold">{value}</div>
        {sub && <div className="text-xs text-black/50 dark:text-white/50">{sub}</div>}
      </div>
    </Card>
  );
}

export function ProgressBar({ value, max, className = "" }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10 ${className}`} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "green" | "amber" | "red" | "blue" | "violet" }) {
  const tones = {
    neutral: "bg-black/8 text-black/70 dark:bg-white/10 dark:text-white/70",
    green: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    red: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    blue: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    violet: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none";
const btnTones = {
  primary: "bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm",
  secondary: "bg-black/8 hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/20",
  ghost: "hover:bg-black/8 dark:hover:bg-white/10",
  danger: "bg-rose-600 text-white hover:bg-rose-500",
};

export function Button({
  children, onClick, tone = "primary", type = "button", disabled, className = "",
}: {
  children: ReactNode; onClick?: () => void; tone?: keyof typeof btnTones; type?: "button" | "submit"; disabled?: boolean; className?: string;
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${btnBase} ${btnTones[tone]} ${className}`}>
      {children}
    </button>
  );
}

export function LinkButton({ href, children, tone = "primary", className = "" }: { href: string; children: ReactNode; tone?: keyof typeof btnTones; className?: string }) {
  return (
    <Link href={href} className={`${btnBase} ${btnTones[tone]} ${className}`}>
      {children}
    </Link>
  );
}
