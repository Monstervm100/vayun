import type { Difficulty, Question } from '../types'
import { mulberry32 } from '../lib/recommend'

/**
 * Procedural question templates.
 *
 * Each template produces an unlimited family of original questions from a
 * seed, so the bank stays fresh without hand-authoring every variant.
 * All generated questions are deterministic per seed (stable ids, stable
 * answers) and tagged `generated: true`.
 */

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** build a choice list from the answer + distractors; returns [choices, answerIndex] */
function makeChoices(answer: number, distractors: number[], rng: () => number): [string[], number] {
  const unique = [...new Set([answer, ...distractors])].slice(0, 4)
  while (unique.length < 4) unique.push(answer + unique.length * 3 + 1)
  const shuffled = shuffle(unique, rng)
  return [shuffled.map(String), shuffled.indexOf(answer)]
}

type Template = (seed: number) => Question

const arithmeticNext: Template = (seed) => {
  const rng = mulberry32(seed)
  const start = 2 + Math.floor(rng() * 9)
  const step = 3 + Math.floor(rng() * 6)
  const terms = [0, 1, 2, 3].map((i) => start + i * step)
  const answer = start + 4 * step
  const [choices, answerIdx] = makeChoices(answer, [answer + step, answer - 1, answer + 2], rng)
  return {
    id: `gen-seq-${seed}`,
    skill: 'sequences',
    difficulty: 1,
    grade: 5,
    prompt: `What is the next number: ${terms.join(', ')}, … ?`,
    choices,
    answer: answerIdx,
    hints: [
      'Find how much the sequence grows at each step.',
      `Check the difference between neighbours: ${terms[1]} − ${terms[0]} = ${step}.`,
      `Add ${step} to ${terms[3]}.`,
    ],
    explanation: [
      `Each term is ${step} more than the one before.`,
      `The next term is ${terms[3]} + ${step} = ${answer}.`,
    ],
    strategy: 'Constant differences mean an adding rule — find the step and extend.',
    timeEst: 30,
    complexity: 1,
    prereqs: ['skip counting'],
    generated: true,
  }
}

const twoStepBackwards: Template = (seed) => {
  const rng = mulberry32(seed * 7 + 1)
  const x = 3 + Math.floor(rng() * 9)
  const mul = 2 + Math.floor(rng() * 3)
  const add = 1 + Math.floor(rng() * 9)
  const result = x * mul + add
  const [choices, answerIdx] = makeChoices(x, [x + 1, x - 1, x + 2], rng)
  return {
    id: `gen-bwd-${seed}`,
    skill: 'backwards',
    difficulty: 2,
    grade: 5,
    prompt: `I think of a number, multiply it by ${mul}, then add ${add}. The result is ${result}. What was my number?`,
    choices,
    answer: answerIdx,
    hints: [
      'Undo the steps in reverse order — last step first.',
      `Undo the "+${add}": compute ${result} − ${add}.`,
      `Then undo the "×${mul}": divide ${result - add} by ${mul}.`,
    ],
    explanation: [
      `Backwards from ${result}: undo "+${add}" → ${result} − ${add} = ${result - add}.`,
      `Undo "×${mul}" → ${result - add} ÷ ${mul} = ${x}.`,
      `Check forwards: ${x} × ${mul} + ${add} = ${result} ✓.`,
    ],
    strategy: 'Reverse the order of operations and invert each step.',
    timeEst: 55,
    complexity: 2,
    prereqs: ['inverse operations'],
    generated: true,
  }
}

const marbleProbability: Template = (seed) => {
  const rng = mulberry32(seed * 13 + 5)
  const red = 2 + Math.floor(rng() * 4)
  const blue = 2 + Math.floor(rng() * 4)
  const green = 1 + Math.floor(rng() * 4)
  const total = red + blue + green
  const correct = `${red}/${total}`
  const options = shuffle(
    [...new Set([correct, `${blue}/${total}`, `${red}/${red + blue}`, `1/${total}`, `${green}/${total}`])].slice(0, 4),
    rng,
  )
  return {
    id: `gen-prb-${seed}`,
    skill: 'probability',
    difficulty: 2,
    grade: 5,
    prompt: `A bag holds ${red} red, ${blue} blue and ${green} green marbles. You pick one without looking. What is the probability it is red?`,
    choices: options,
    answer: options.indexOf(correct),
    hints: [
      'Count all the marbles first.',
      `Total marbles: ${red} + ${blue} + ${green} = ${total}.`,
      `Red marbles are ${red} out of ${total}.`,
    ],
    explanation: [
      `Total marbles: ${red} + ${blue} + ${green} = ${total}.`,
      `Favourable outcomes (red): ${red}.`,
      `P(red) = ${red}/${total}.`,
    ],
    strategy: 'Probability = favourable ÷ total. Always find the total first.',
    timeEst: 50,
    complexity: 2,
    prereqs: ['fractions', 'basic chance'],
    generated: true,
  }
}

const handshakes: Template = (seed) => {
  const rng = mulberry32(seed * 31 + 9)
  const n = 4 + Math.floor(rng() * 5) // 4..8 people
  const answer = (n * (n - 1)) / 2
  const [choices, answerIdx] = makeChoices(answer, [n * (n - 1), answer + n, answer - 1], rng)
  return {
    id: `gen-cmb-${seed}`,
    skill: 'combinatorics',
    difficulty: 2,
    grade: 6,
    prompt: `${n} friends meet, and each pair shakes hands exactly once. How many handshakes happen?`,
    choices,
    answer: answerIdx,
    hints: [
      'Have the friends arrive one at a time, counting the new handshakes each arrival brings.',
      `The 2nd person shakes 1 hand, the 3rd shakes 2, … the ${n}th shakes ${n - 1}.`,
      `Add 1 + 2 + … + ${n - 1}.`,
    ],
    explanation: [
      `Each new arrival shakes hands with everyone already there: 1 + 2 + … + ${n - 1}.`,
      `That sum is ${(n * (n - 1)) / 2}.`,
      `Alternative: ${n} people × ${n - 1} partners ÷ 2 (each handshake counted twice) = ${answer}.`,
    ],
    strategy: 'Count pairs with multiply-then-halve, or by adding arrivals.',
    timeEst: 70,
    complexity: 3,
    prereqs: ['pair counting'],
    generated: true,
  }
}

const repeatingNth: Template = (seed) => {
  const rng = mulberry32(seed * 17 + 3)
  const symbols = shuffle(['★', '●', '▲', '■'], rng).slice(0, 3)
  const N = 20 + Math.floor(rng() * 60)
  const idx = (N - 1) % 3
  const answer = symbols[idx]
  const options = shuffle([...symbols, 'Cannot tell'], rng)
  return {
    id: `gen-pat-${seed}`,
    skill: 'pattern',
    difficulty: 2,
    grade: 5,
    prompt: `A strip repeats the symbols ${symbols.join(' ')} over and over: ${symbols.join(' ')} ${symbols.join(' ')} … What is the ${N}th symbol?`,
    choices: options,
    answer: options.indexOf(answer),
    hints: [
      `The block ${symbols.join(' ')} has 3 symbols. How many full blocks come before position ${N}?`,
      `Divide ${N} by 3 and look at the remainder.`,
      `${N} = 3 × ${Math.floor(N / 3)} + ${N % 3}${N % 3 === 0 ? ' — a remainder of 0 means the LAST symbol of a block' : ''}.`,
    ],
    explanation: [
      `The pattern repeats every 3 symbols.`,
      `${N} ÷ 3 leaves remainder ${N % 3}${N % 3 === 0 ? ', which points at the final symbol of the block' : `, pointing at symbol ${N % 3} of the block`}.`,
      `So the ${N}th symbol is ${answer}.`,
    ],
    strategy: 'Division with remainder locates any position inside a repeating block.',
    timeEst: 60,
    complexity: 2,
    prereqs: ['division with remainder'],
    generated: true,
  }
}

const gaussSum: Template = (seed) => {
  const rng = mulberry32(seed * 23 + 11)
  const n = [10, 12, 14, 16, 18, 20][Math.floor(rng() * 6)]
  const answer = (n * (n + 1)) / 2
  const [choices, answerIdx] = makeChoices(answer, [answer - n, answer + n, answer + 10], rng)
  return {
    id: `gen-num-${seed}`,
    skill: 'number',
    difficulty: 2,
    grade: 6,
    prompt: `What is 1 + 2 + 3 + … + ${n}?`,
    choices,
    answer: answerIdx,
    hints: [
      'Adding one by one is slow — pair numbers from the two ends.',
      `1 + ${n} = ${n + 1}, 2 + ${n - 1} = ${n + 1} … every pair gives ${n + 1}.`,
      `There are ${n / 2} pairs of ${n + 1}.`,
    ],
    explanation: [
      `Pair the ends: (1 + ${n}), (2 + ${n - 1}), … each pair sums to ${n + 1}.`,
      `${n} numbers form ${n / 2} pairs.`,
      `${n / 2} × ${n + 1} = ${answer}.`,
    ],
    strategy: "Gauss's pairing trick turns a long sum into one multiplication.",
    timeEst: 65,
    complexity: 2,
    prereqs: ['pairing trick'],
    generated: true,
  }
}

const TEMPLATES: Template[] = [
  arithmeticNext,
  twoStepBackwards,
  marbleProbability,
  handshakes,
  repeatingNth,
  gaussSum,
]

/** stable set of generated questions included in the bank (4 variants each) */
export function generatedQuestions(): Question[] {
  const out: Question[] = []
  for (let v = 1; v <= 4; v++) {
    for (const t of TEMPLATES) out.push(t(v * 101))
  }
  // de-dup ids just in case two templates collide on a seed
  const seen = new Set<string>()
  return out.filter((q) => (seen.has(q.id) ? false : (seen.add(q.id), true)))
}

/** produce one fresh generated question on demand (e.g. endless practice) */
export function generateOne(seed: number, difficultyCap: Difficulty = 4): Question {
  const rng = mulberry32(seed)
  const pool = TEMPLATES
  const q = pool[Math.floor(rng() * pool.length)](seed)
  if (q.difficulty > difficultyCap) q.difficulty = difficultyCap
  return q
}
