"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, SectionTitle, StatTile } from "@/components/ui";
import { useHydrated, useStore } from "@/store/useStore";
import lessons from "@/data/lessons.json";
import puzzles from "@/data/puzzles.json";
import openings from "@/data/openings.json";
import endgames from "@/data/endgames.json";
import { ACHIEVEMENTS } from "@/data/achievements";

interface VisitStats {
  totalVisits: number;
  uniqueVisitors: number;
  last14Days: { date: string; visits: number }[];
}

function VisitStatsCard() {
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/track")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setFailed(true));
  }, []);

  return (
    <Card>
      <SectionTitle>📊 Site visits</SectionTitle>
      {failed && <p className="text-sm text-black/50 dark:text-white/50">Visit tracking needs the app served by its server (not a static export).</p>}
      {!stats && !failed && <p className="text-sm text-black/50 dark:text-white/50">Loading…</p>}
      {stats && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <StatTile icon="👀" label="Total visits" value={stats.totalVisits} />
            <StatTile icon="🧑‍🤝‍🧑" label="Unique visitors" value={stats.uniqueVisitors} />
          </div>
          {stats.last14Days.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-black/50 dark:text-white/50">Last 14 days</p>
              <div className="flex items-end gap-1" style={{ height: 60 }}>
                {stats.last14Days.map((d) => {
                  const max = Math.max(...stats.last14Days.map((x) => x.visits));
                  return (
                    <div key={d.date} title={`${d.date}: ${d.visits} visit${d.visits === 1 ? "" : "s"}`} className="flex-1 rounded-t bg-emerald-500" style={{ height: `${(d.visits / max) * 100}%`, minHeight: 4 }} />
                  );
                })}
              </div>
            </div>
          )}
          <p className="mt-3 text-xs text-black/50 dark:text-white/50">
            Privacy-friendly: visitors are counted with an anonymous random id stored in their browser — no names, no IP addresses, no personal data.
          </p>
        </>
      )}
    </Card>
  );
}

export default function Admin() {
  const hydrated = useHydrated();
  const resetAll = useStore((s) => s.resetAll);
  const [confirming, setConfirming] = useState(false);
  if (!hydrated) return null;

  const puzzleThemes = [...new Set((puzzles as { theme: string }[]).map((p) => p.theme))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">🛠️ Admin Panel</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Content inventory and management. In production this panel is restricted to the <Badge>admin</Badge> role via the API&apos;s role-based access control; full CRUD editing ships with the CMS milestone.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatTile icon="📚" label="Lessons" value={(lessons as unknown[]).length} sub="5 levels" />
        <StatTile icon="🧩" label="Puzzles" value={(puzzles as unknown[]).length} sub={`${puzzleThemes.length} themes`} />
        <StatTile icon="🗺️" label="Openings" value={(openings as unknown[]).length} />
        <StatTile icon="🏰" label="Endgame drills" value={(endgames as unknown[]).length} />
        <StatTile icon="🏅" label="Achievements" value={ACHIEVEMENTS.length} />
      </div>

      <VisitStatsCard />

      <Card>
        <SectionTitle>🧩 Puzzle library</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-black/50 dark:border-white/10 dark:text-white/50">
                <th className="py-2 pr-4">ID</th><th className="py-2 pr-4">Theme</th><th className="py-2 pr-4">Rating</th><th className="py-2">Solution</th>
              </tr>
            </thead>
            <tbody>
              {(puzzles as { id: string; theme: string; rating: number; line: string[] }[]).map((p) => (
                <tr key={p.id} className="border-b border-black/5 dark:border-white/5">
                  <td className="py-1.5 pr-4 font-mono text-xs">{p.id}</td>
                  <td className="py-1.5 pr-4"><Badge tone="violet">{p.theme}</Badge></td>
                  <td className="py-1.5 pr-4">{p.rating}</td>
                  <td className="py-1.5 font-mono text-xs">{p.line.join(" ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-black/50 dark:text-white/50">
          Every puzzle is machine-verified: legal FEN, legal solution line, brute-force-confirmed forced mates, and net material gain — see <code>scripts/verify-content.mjs</code>.
        </p>
      </Card>

      <Card>
        <SectionTitle>⚙️ Danger zone (local data)</SectionTitle>
        <p className="mb-3 text-sm text-black/60 dark:text-white/60">Reset all locally-stored learner progress on this device (profile, XP, games, review queue).</p>
        {confirming ? (
          <div className="flex gap-2">
            <Button tone="danger" onClick={() => { resetAll(); setConfirming(false); }}>Yes, wipe local progress</Button>
            <Button tone="secondary" onClick={() => setConfirming(false)}>Cancel</Button>
          </div>
        ) : (
          <Button tone="danger" onClick={() => setConfirming(true)}>Reset local data…</Button>
        )}
      </Card>
    </div>
  );
}
