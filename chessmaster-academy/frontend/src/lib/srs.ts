/**
 * SM-2-style spaced repetition over mistake items.
 * quality: 0 = failed again, 3 = hard, 4 = good, 5 = easy
 */
export type ReviewQuality = 0 | 3 | 4 | 5;

interface Reviewable {
  intervalDays: number;
  ease: number;
  lapses: number;
  reps: number;
  due: string;
}

export function nextReview<T extends Reviewable>(item: T, quality: ReviewQuality): T {
  let { intervalDays, ease, lapses, reps } = item;

  if (quality === 0) {
    lapses += 1;
    reps = 0;
    intervalDays = 0; // due again today
  } else {
    reps += 1;
    if (reps === 1) intervalDays = 1;
    else if (reps === 2) intervalDays = 3;
    else intervalDays = Math.round(intervalDays * ease);
    ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  }

  const due = new Date(Date.now() + intervalDays * 86400000).toISOString();
  return { ...item, intervalDays, ease, lapses, reps, due };
}

export function dueItems<T extends Reviewable>(items: T[], now = new Date()): T[] {
  return items
    .filter((i) => new Date(i.due) <= now)
    .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());
}
