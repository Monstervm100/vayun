import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

/**
 * Lightweight, privacy-friendly visit tracking.
 * Stores only anonymous random visitor ids — no names, no IPs, no PII (kid-safe).
 *
 * Storage backends (auto-selected):
 *  - Redis-compatible REST store (Upstash / Vercel KV) when KV_REST_API_URL +
 *    KV_REST_API_TOKEN are set — required for serverless hosts like Vercel.
 *  - Local JSON file (frontend/.data/analytics.json) otherwise — for self-hosting.
 */

export const runtime = "nodejs";

// ---------- KV backend (Upstash / Vercel KV REST protocol) ----------

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const kvConfigured = !!(KV_URL && KV_TOKEN);

async function kvPipeline(commands: (string | number)[][]): Promise<{ result: unknown }[]> {
  const res = await fetch(`${KV_URL}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`KV request failed: ${res.status}`);
  return res.json();
}

// ---------- File backend (self-hosted) ----------

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "analytics.json");

interface FileAnalytics {
  totalVisits: number;
  visitors: Record<string, { firstSeen: string; lastSeen: string; visits: number }>;
  byDay: Record<string, number>;
}

async function fileLoad(): Promise<FileAnalytics> {
  try {
    return JSON.parse(await readFile(FILE, "utf8"));
  } catch {
    return { totalVisits: 0, visitors: {}, byDay: {} };
  }
}

async function fileSave(data: FileAnalytics) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(FILE, JSON.stringify(data, null, 2));
}

// ---------- Handlers ----------

export async function POST(req: Request) {
  let visitorId: string | null = null;
  try {
    const body = await req.json();
    if (typeof body.visitorId === "string" && body.visitorId.length > 0 && body.visitorId.length <= 64) {
      visitorId = body.visitorId;
    }
  } catch {
    // no body — still count the visit
  }

  const day = new Date().toISOString().slice(0, 10);

  try {
    if (kvConfigured) {
      const commands: (string | number)[][] = [
        ["INCR", "cma:total"],
        ["HINCRBY", "cma:byday", day, 1],
      ];
      if (visitorId) commands.push(["HINCRBY", "cma:visitors", visitorId, 1]);
      await kvPipeline(commands);
    } else {
      const data = await fileLoad();
      const now = new Date().toISOString();
      data.totalVisits += 1;
      data.byDay[day] = (data.byDay[day] ?? 0) + 1;
      if (visitorId) {
        const v = data.visitors[visitorId];
        data.visitors[visitorId] = v
          ? { ...v, lastSeen: now, visits: v.visits + 1 }
          : { firstSeen: now, lastSeen: now, visits: 1 };
      }
      await fileSave(data);
    }
    return NextResponse.json({ ok: true });
  } catch {
    // Tracking must never break the app for a visitor
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

export async function GET() {
  try {
    if (kvConfigured) {
      const [total, unique, byday] = await kvPipeline([
        ["GET", "cma:total"],
        ["HLEN", "cma:visitors"],
        ["HGETALL", "cma:byday"],
      ]);
      const flat = (byday.result as string[]) ?? [];
      const byDay: Record<string, number> = {};
      for (let i = 0; i < flat.length; i += 2) byDay[flat[i]] = Number(flat[i + 1]);
      const days = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0])).slice(-14);
      return NextResponse.json({
        totalVisits: Number(total.result ?? 0),
        uniqueVisitors: Number(unique.result ?? 0),
        last14Days: days.map(([date, visits]) => ({ date, visits })),
      });
    }
    const data = await fileLoad();
    const days = Object.entries(data.byDay).sort((a, b) => a[0].localeCompare(b[0])).slice(-14);
    return NextResponse.json({
      totalVisits: data.totalVisits,
      uniqueVisitors: Object.keys(data.visitors).length,
      last14Days: days.map(([date, visits]) => ({ date, visits })),
    });
  } catch {
    return NextResponse.json({ totalVisits: 0, uniqueVisitors: 0, last14Days: [] });
  }
}
