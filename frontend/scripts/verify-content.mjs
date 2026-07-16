/**
 * Content verification: every puzzle FEN must be legal, every solution move legal,
 * mate puzzles must actually be forced mates (brute-force checked), and
 * material puzzles must win material. Openings and lesson positions are checked too.
 * Run: node scripts/verify-content.mjs
 */
import { Chess } from "chess.js";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const load = (f) => JSON.parse(readFileSync(join(root, "src", "data", f), "utf8"));

let errors = 0;
const fail = (msg) => { errors++; console.error("  ❌ " + msg); };
const MATERIAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function materialFor(chess, color) {
  let total = 0;
  for (const row of chess.board()) {
    for (const sq of row) {
      if (sq && sq.color === color) total += MATERIAL[sq.type];
    }
  }
  return total;
}

/** Does `color` (side to move) have a forced mate in `n` full moves? Exhaustive. */
function mateIn(chess, n) {
  if (n <= 0) return false;
  for (const move of chess.moves()) {
    chess.move(move);
    if (chess.isCheckmate()) {
      chess.undo();
      return true;
    }
    let allRepliesLose = false;
    if (n > 1 && chess.inCheck() === chess.inCheck()) {
      const replies = chess.moves();
      allRepliesLose = replies.length > 0;
      for (const reply of replies) {
        chess.move(reply);
        const stillMates = mateIn(chess, n - 1);
        chess.undo();
        if (!stillMates) { allRepliesLose = false; break; }
      }
    }
    chess.undo();
    if (allRepliesLose) return true;
  }
  return false;
}

console.log("Verifying puzzles.json …");
const puzzles = load("puzzles.json");
for (const p of puzzles) {
  let chess;
  try {
    chess = new Chess(p.fen);
  } catch (e) {
    fail(`${p.id}: bad FEN — ${e.message}`);
    continue;
  }
  const userColor = chess.turn();
  const matBefore = materialFor(chess, userColor === "w" ? "b" : "w"); // opponent material

  let lineOk = true;
  for (const [i, san] of p.line.entries()) {
    try {
      chess.move(san);
    } catch {
      fail(`${p.id}: move ${i + 1} (${san}) is illegal`);
      lineOk = false;
      break;
    }
  }
  if (!lineOk) continue;

  const endsInMate = p.line[p.line.length - 1].endsWith("#");
  if (endsInMate && !chess.isCheckmate()) fail(`${p.id}: line claims mate but final position is not checkmate`);
  if (!endsInMate && chess.isCheckmate()) console.log(`  ⚠ ${p.id}: unexpected mate at line end (fine, but retag?)`);

  if (p.theme === "mate1") {
    const t = new Chess(p.fen);
    if (!mateIn(t, 1)) fail(`${p.id}: no mate-in-1 exists`);
  } else if (p.theme === "mate2") {
    const t = new Chess(p.fen);
    t.move(p.line[0]);
    if (t.isCheckmate()) fail(`${p.id}: tagged mate2 but first move already mates`);
    else {
      // After the key move every black defense must allow mate next move.
      const replies = t.moves();
      for (const reply of replies) {
        t.move(reply);
        if (!mateIn(t, 1)) fail(`${p.id}: after ${p.line[0]} ${reply}, no mate-in-1 — not a forced mate in 2`);
        t.undo();
      }
      if (replies.length === 0) fail(`${p.id}: stalemate after key move`);
    }
  } else if (!endsInMate) {
    // Material puzzle: opponent must have lost material over the scripted line,
    // accounting for anything the user gave up.
    const matAfterOpp = materialFor(chess, userColor === "w" ? "b" : "w");
    const t2 = new Chess(p.fen);
    const userBefore = materialFor(t2, userColor);
    const userAfter = materialFor(chess, userColor);
    const net = (matBefore - matAfterOpp) - (userBefore - userAfter);
    if (net < 2) fail(`${p.id}: line only nets ${net} material — not a convincing win`);
  }

  // Sanity: user moves are at even indices (user always moves first)
  if (p.line.length % 2 === 0) fail(`${p.id}: line must end on a user move (odd length)`);
}
console.log(`  ${puzzles.length} puzzles checked`);

console.log("Verifying openings.json …");
if (existsSync(join(root, "src", "data", "openings.json"))) {
  const openings = load("openings.json");
  for (const o of openings) {
    const chess = new Chess();
    for (const [i, san] of o.mainLine.entries()) {
      try {
        chess.move(san);
      } catch {
        fail(`${o.id}: main line move ${i + 1} (${san}) is illegal`);
        break;
      }
    }
  }
  console.log(`  ${openings.length} openings checked`);
}

console.log("Verifying endgames.json …");
if (existsSync(join(root, "src", "data", "endgames.json"))) {
  const endgames = load("endgames.json");
  for (const d of endgames) {
    try {
      new Chess(d.fen);
    } catch (e) {
      fail(`${d.id}: bad FEN — ${e.message}`);
    }
  }
  console.log(`  ${endgames.length} endgame drills checked`);
}

console.log("Verifying lessons.json …");
if (existsSync(join(root, "src", "data", "lessons.json"))) {
  const lessons = load("lessons.json");
  for (const l of lessons) {
    for (const [si, step] of l.steps.entries()) {
      if (step.fen) {
        let chess;
        try {
          chess = new Chess(step.fen);
        } catch (e) {
          fail(`${l.id} step ${si}: bad FEN — ${e.message}`);
          continue;
        }
        if (step.type === "practice") {
          if (step.accept === "exact") {
            for (const san of step.correct) {
              const t = new Chess(step.fen);
              try {
                t.move(san);
              } catch {
                fail(`${l.id} step ${si}: correct move ${san} is illegal`);
              }
            }
          }
          if (step.accept === "mate" && !mateIn(new Chess(step.fen), 1)) {
            fail(`${l.id} step ${si}: no mate-in-1 available`);
          }
          if (step.accept === "check" && !new Chess(step.fen).moves().some((m) => m.includes("+") || m.includes("#"))) {
            fail(`${l.id} step ${si}: no checking move available`);
          }
          if (step.accept === "castle" && !new Chess(step.fen).moves().some((m) => m.startsWith("O-O"))) {
            fail(`${l.id} step ${si}: castling not available`);
          }
          if (step.accept === "capture" && !new Chess(step.fen).moves({ verbose: true }).some((m) => m.captured)) {
            fail(`${l.id} step ${si}: no capture available`);
          }
          if (step.accept === "promote" && !new Chess(step.fen).moves().some((m) => m.includes("="))) {
            fail(`${l.id} step ${si}: no promotion available`);
          }
        }
      }
    }
  }
  console.log(`  ${lessons.length} lessons checked`);
}

if (errors) {
  console.error(`\n${errors} content error(s) found.`);
  process.exit(1);
}
console.log("\nAll content verified ✔");
