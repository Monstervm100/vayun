"use client";

import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { useHydrated, useStore } from "@/store/useStore";
import openings from "@/data/openings.json";

interface OpeningMeta { id: string; name: string; emoji: string; color: string; history: string }

export default function Openings() {
  const hydrated = useHydrated();
  const progress = useStore((s) => s.openingProgress);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">🗺️ Opening Academy</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Learn one opening at a time: the ideas, the move order, the plans — then drill it and play it against the engine.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(openings as OpeningMeta[]).map((o) => {
          const p = hydrated ? progress[o.id] : undefined;
          return (
            <Link key={o.id} href={`/openings/${o.id}`}>
              <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{o.emoji}</span>
                  <div className="flex gap-1">
                    <Badge tone={o.color === "white" ? "neutral" : "violet"}>{o.color === "white" ? "for White" : "for Black"}</Badge>
                    {p?.drilled && <Badge tone="green">✓ Drilled</Badge>}
                  </div>
                </div>
                <div className="mt-2 font-bold">{o.name}</div>
                <p className="mt-1 line-clamp-2 text-xs text-black/50 dark:text-white/50">{o.history}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
