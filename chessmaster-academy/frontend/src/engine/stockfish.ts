"use client";

/**
 * Promise-based client for the Stockfish engine running in a Web Worker.
 * Uses the WASM build when available, falling back to asm.js.
 */

export interface EngineEval {
  /** Centipawns from the side-to-move's perspective; mate scores mapped to ±10000-ish. */
  cp: number;
  mate: number | null;
  bestMove: string | null; // UCI, e.g. "e2e4"
  pv: string[];
}

const wasmSupported =
  typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function";

export class StockfishEngine {
  private worker: Worker | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  private ready: Promise<void> | null = null;

  private send(cmd: string) {
    this.worker?.postMessage(cmd);
  }

  init(): Promise<void> {
    if (this.ready) return this.ready;
    this.ready = new Promise<void>((resolve, reject) => {
      try {
        this.worker = new Worker(wasmSupported ? "/engine/stockfish.wasm.js" : "/engine/stockfish.js");
      } catch (e) {
        reject(e);
        return;
      }
      const onMsg = (e: MessageEvent) => {
        if (String(e.data) === "uciok") {
          this.worker?.removeEventListener("message", onMsg);
          resolve();
        }
      };
      this.worker.addEventListener("message", onMsg);
      this.worker.addEventListener("error", (e) => reject(e));
      this.send("uci");
    });
    return this.ready;
  }

  /** 0..20 — maps to Stockfish "Skill Level". */
  async setSkill(skill: number) {
    await this.init();
    this.send(`setoption name Skill Level value ${Math.max(0, Math.min(20, skill))}`);
  }

  /**
   * Evaluate a position. Returns score from the side-to-move's perspective.
   * Serialized: concurrent calls are queued.
   */
  evaluate(fen: string, opts: { depth?: number; movetimeMs?: number } = {}): Promise<EngineEval> {
    const run = async (): Promise<EngineEval> => {
      await this.init();
      return new Promise<EngineEval>((resolve) => {
        const result: EngineEval = { cp: 0, mate: null, bestMove: null, pv: [] };
        const onMsg = (e: MessageEvent) => {
          const line = String(e.data);
          if (line.startsWith("info ") && line.includes(" score ")) {
            const mateMatch = line.match(/score mate (-?\d+)/);
            const cpMatch = line.match(/score cp (-?\d+)/);
            if (mateMatch) {
              result.mate = parseInt(mateMatch[1], 10);
              result.cp = Math.sign(result.mate) * (10000 - Math.abs(result.mate) * 10);
            } else if (cpMatch) {
              result.mate = null;
              result.cp = parseInt(cpMatch[1], 10);
            }
            const pvMatch = line.match(/ pv (.+)$/);
            if (pvMatch) result.pv = pvMatch[1].trim().split(/\s+/);
          } else if (line.startsWith("bestmove")) {
            const mv = line.split(/\s+/)[1];
            result.bestMove = mv && mv !== "(none)" ? mv : null;
            this.worker?.removeEventListener("message", onMsg);
            resolve(result);
          }
        };
        this.worker!.addEventListener("message", onMsg);
        this.send("ucinewgame");
        this.send(`position fen ${fen}`);
        if (opts.movetimeMs) this.send(`go movetime ${opts.movetimeMs}`);
        else this.send(`go depth ${opts.depth ?? 12}`);
      });
    };
    const p = this.queue.then(run, run);
    this.queue = p.catch(() => undefined);
    return p;
  }

  async bestMove(fen: string, opts: { depth?: number; movetimeMs?: number } = {}): Promise<string | null> {
    return (await this.evaluate(fen, opts)).bestMove;
  }

  dispose() {
    this.worker?.terminate();
    this.worker = null;
    this.ready = null;
  }
}

/** Difficulty presets for Play mode. */
export const DIFFICULTY_LEVELS = [
  { id: 1, name: "Beginner", emoji: "🐣", skill: 0, movetimeMs: 120, blunderChance: 0.35, approxElo: 450 },
  { id: 2, name: "Easy", emoji: "🙂", skill: 2, movetimeMs: 200, blunderChance: 0.18, approxElo: 700 },
  { id: 3, name: "Intermediate", emoji: "🧠", skill: 6, movetimeMs: 350, blunderChance: 0.06, approxElo: 1000 },
  { id: 4, name: "Advanced", emoji: "🔥", skill: 12, movetimeMs: 600, blunderChance: 0, approxElo: 1500 },
  { id: 5, name: "Master", emoji: "👑", skill: 20, movetimeMs: 1000, blunderChance: 0, approxElo: 2200 },
] as const;

let shared: StockfishEngine | null = null;
export function getEngine(): StockfishEngine {
  if (!shared) shared = new StockfishEngine();
  return shared;
}
