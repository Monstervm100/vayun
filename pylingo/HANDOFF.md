# PyLingo — Project Handoff

> Paste this whole file into a fresh Claude Code session to carry forward all context.
> Written because the user is switching accounts and starting fresh.

---

## 1. What PyLingo is

A **Duolingo-style website for learning Python**, built as a gift ("For Vayun Bro").
Plain static site — **HTML + CSS + vanilla JavaScript, no frameworks, no build step**.
Just open `index.html` and it runs.

**Credit shown in-app:** top-bar byline "by Mithil Bhansali" + a footer on the path:
"Created by **Mithil Bhansali** — For **Vayun Bro** 💚"

---

## 2. The 4 source files (this is the whole app)

Located in: `C:\Users\bhans\OneDrive\Documents\vayun project\`

| File | Size | What it holds |
|------|------|---------------|
| `index.html` | ~3 KB | Page skeleton: top bar, path screen, lesson screen, complete/gameover screens. Loads CSS/JS with `?v=3` cache-busting tags. Injects Vercel analytics only on live https (silent on localhost). |
| `style.css`  | ~9 KB | All styling — Duolingo look (chunky buttons, green/blue/gold, rounded cards). Light theme. |
| `data.js`    | ~39 KB | **All course content.** `COURSE` array = 11 units, 22 lessons, 133 exercises. Add content here. |
| `app.js`     | ~11 KB | All logic: screens, exercise engine, hearts/XP/streak, localStorage save, logo-to-continue. |

**Exercise types** in `data.js` (each lesson has ~6):
- `mc` — multiple choice `{prompt, code?, choices:[], answer:index, explain}`
- `type` — typed answer `{prompt, answer: string | [accepted...], explain}`
- `arrange` — word bank; tokens tapped in order `{prompt, tokens:[], answer:"joined by spaces", explain}`

**The 11 units:** 1 First Steps · 2 Variables · 3 Strings & Numbers · 4 Conditionals ·
5 Loops · 6 Lists & Functions · 7 Dictionaries · 8 Tuples & Sets · 9 Errors & Exceptions ·
10 Classes & Objects · 11 Power Python (imports + list comprehensions).

---

## 3. Features already built & tested (all working)

- **Skill path** — lessons unlock in order; done lessons show a 👑 crown; current lesson pulses.
- **Hearts/XP/streak** — wrong answer costs a heart; 0 hearts = game-over screen with retry.
  Wrong exercises get re-queued to the end of the lesson (Duolingo-style).
- **Progress saving** — per-visitor via `localStorage` key `pylingo-save`. **No expiry** —
  stop for a day/week/month, come back, resume exactly where you left off. Each visitor
  independent. (Limitation: per-browser/per-device; no cross-device sync — that needs
  accounts + a database, not built.)
- **Click the logo → continue where you left off** — resumes in-progress lesson, else next
  unfinished one; leaves you alone if you're already in it; all-done → returns to path.
- **Returning visitors auto-scroll** to their current lesson on load (had to use the `load`
  event + `history.scrollRestoration="manual"` because the browser was undoing the scroll).
- **Visitor analytics** — Vercel Web Analytics, added in `index.html`, activates ONLY on the
  live site. Must be enabled in Vercel dashboard (Analytics tab → Enable) after deploy.

---

## 4. Where the code lives

**Working/source copy (edit here):**
`C:\Users\bhans\OneDrive\Documents\vayun project\` (index.html, style.css, data.js, app.js)

**GitHub (already pushed):**
Repo: **https://github.com/Monstervm100/vayun**  → PyLingo is in the **`pylingo/`** subfolder.
(The repo is a monorepo holding several projects: pylingo, reasoninglab, starwatch, threatlens,
chessmaster-academy.) Commit author email used: **mithil.bhansali@gmail.com**.

**Hosted preview (private Claude Artifact):**
https://claude.ai/code/artifact/f0ad5563-9a2d-487f-a3e7-1867cc28b23e
(Single-file self-contained bundle. Private unless shared from the artifact's share menu.
NOTE: tied to the old account — a new account can't update it; republish a fresh one if needed.)

---

## 5. THE ONE UNFINISHED STEP → Deploy to Vercel

Everything is done **except** putting it live on Vercel. The blocker has always been that
signing into Vercel/GitHub requires the user's own login (Claude can't do account auth).

### How to finish (do this in your normal browser — ~4 clicks):
1. Go to **https://vercel.com/new** → **Continue with GitHub** (sign in).
2. Find repo **`Monstervm100/vayun`** → click **Import**.
3. ⚠️ **CRITICAL SETTING:** the repo has multiple projects, so expand **Root Directory**,
   click **Edit**, and set it to **`pylingo`**. (Skip this and you get a 404 / wrong content.)
4. Framework Preset = "Other" (auto-detected, static site). Click **Deploy**.
5. ~30 sec → live URL like `https://vayun-xxxx.vercel.app`. That's the shareable link.

### After it's live:
- Turn on the visitor counter: Vercel dashboard → project → **Analytics** tab → **Enable**.
- Any future `git push` to the repo auto-redeploys the site.

### Alternative host (if you skip Vercel):
Netlify Drop (https://app.netlify.com/drop) — drag the `pylingo` folder, instant link,
no account needed. But no free analytics (Vercel's is the reason to prefer Vercel).

---

## 6. How to run / edit locally

- **Run:** double-click `index.html`, OR `python -m http.server 8321` then open
  `http://localhost:8321`.
- **⚠️ Caching gotcha:** browsers aggressively cache `app.js`/`style.css`. After editing,
  bump the `?v=N` numbers in `index.html` (currently `?v=3`) OR hard-reload, or you'll run
  stale code. This bit us repeatedly during development.
- **Add a lesson:** append to the `COURSE` array in `data.js` — nothing else to touch.
- **Analytics stays silent** on localhost by design.

---

## 7. First things to tell a fresh session

> "I'm continuing PyLingo, a Duolingo-style Python learning site (plain HTML/CSS/JS in
> `C:\Users\bhans\OneDrive\Documents\vayun project\`). It's built and on GitHub at
> Monstervm100/vayun in the `pylingo/` folder. The only thing left is deploying to Vercel
> (set Root Directory = `pylingo`). Read PYLINGO-HANDOFF.md for full context."

---

## 8. Known limitations / possible next steps
- Progress is per-device only (no accounts). Cross-device = needs backend + DB.
- Single visual theme (light only) — no dark mode.
- Content could expand (dictionaries deep-dive, file I/O, classes inheritance, etc.).
- No sound/animations beyond CSS. No mobile-app packaging.
