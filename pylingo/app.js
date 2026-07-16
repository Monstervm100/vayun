// ===== State & persistence =====
const SAVE_KEY = "pylingo-save";

let save = loadSave();

function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && typeof s === "object") return { xp: 0, completed: {}, streak: 0, lastDay: "", lastLesson: null, ...s };
  } catch (e) { /* corrupted save — start fresh */ }
  return { xp: 0, completed: {}, streak: 0, lastDay: "", lastLesson: null };
}
function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }
  catch (e) { /* storage blocked (e.g. sandboxed embed) — play without saving */ }
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

function bumpStreak() {
  const today = todayStr();
  if (save.lastDay === today) return;
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  save.streak = save.lastDay === yesterday ? save.streak + 1 : 1;
  save.lastDay = today;
}

// If the streak was broken (missed a day), show 0 until they practice again.
function displayStreak() {
  const today = todayStr();
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  return (save.lastDay === today || save.lastDay === yesterday) ? save.streak : 0;
}

// ===== DOM helpers =====
const $ = (id) => document.getElementById(id);
const screens = ["home", "lesson", "complete", "gameover"];
function show(name) {
  screens.forEach((s) => $("screen-" + s).classList.toggle("hidden", s !== name));
  window.scrollTo(0, 0);
}

function updateTopbar() {
  $("stat-streak").textContent = displayStreak();
  $("stat-xp").textContent = save.xp;
  $("stat-hearts").textContent = current ? current.hearts : 5;
}

// ===== Home / path =====
function lessonKey(u, l) { return u + "-" + l; }

function firstIncomplete() {
  for (let u = 0; u < COURSE.length; u++)
    for (let l = 0; l < COURSE[u].lessons.length; l++)
      if (!save.completed[lessonKey(u, l)]) return { u, l };
  return null;
}

function renderPath() {
  const path = $("path");
  path.innerHTML = "";
  const next = firstIncomplete();

  COURSE.forEach((unit, u) => {
    const header = document.createElement("div");
    header.className = "unit-header " + unit.color;
    header.innerHTML = `<h2>${unit.title}</h2><p>${unit.subtitle}</p>`;
    path.appendChild(header);

    const wrap = document.createElement("div");
    wrap.className = "lessons";

    unit.lessons.forEach((lesson, l) => {
      const done = !!save.completed[lessonKey(u, l)];
      const isNext = next && next.u === u && next.l === l;
      const locked = !done && !isNext;

      const node = document.createElement("button");
      node.className = "lesson-node" + (done ? " done" : "") + (locked ? " locked" : "") + (isNext ? " current" : "");
      node.innerHTML = `<div class="bubble">${done ? "👑" : lesson.icon}</div><div class="title">${lesson.title}</div>`;
      if (!locked) node.addEventListener("click", () => startLesson(u, l));
      else node.title = "Complete the previous lesson to unlock";
      wrap.appendChild(node);
    });

    path.appendChild(wrap);
  });
}

// ===== Lesson engine =====
let current = null; // { u, l, queue, index, hearts, correctFirstTry, total, checked, getAnswer }

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startLesson(u, l) {
  save.lastLesson = { u, l };
  persist();
  const exercises = COURSE[u].lessons[l].exercises;
  current = {
    u, l,
    queue: shuffle(exercises),
    index: 0,
    hearts: 5,
    missed: new Set(),
    total: exercises.length,
    checked: false,
    getAnswer: null,
  };
  show("lesson");
  updateTopbar();
  renderExercise();
}

function renderExercise() {
  const ex = current.queue[current.index];
  current.checked = false;
  current.getAnswer = null;

  $("progress-fill").style.width = (current.index / current.queue.length) * 100 + "%";
  $("lesson-hearts").textContent = "❤️ " + current.hearts;
  $("ex-prompt").innerHTML = ex.prompt;

  const codeEl = $("ex-code");
  if (ex.code) { codeEl.textContent = ex.code; codeEl.classList.remove("hidden"); }
  else codeEl.classList.add("hidden");

  const area = $("answer-area");
  area.innerHTML = "";

  const bar = $("check-bar");
  bar.className = "check-bar";
  $("feedback").classList.add("hidden");
  const btn = $("btn-check");
  btn.textContent = "CHECK";
  btn.disabled = true;

  if (ex.type === "mc") renderMC(ex, area, btn);
  else if (ex.type === "type") renderType(ex, area, btn);
  else if (ex.type === "arrange") renderArrange(ex, area, btn);
}

function renderMC(ex, area, btn) {
  const box = document.createElement("div");
  box.className = "choices";
  let selected = -1;

  ex.choices.forEach((choice, i) => {
    const b = document.createElement("button");
    b.className = "choice";
    b.innerHTML = choice;
    b.addEventListener("click", () => {
      if (current.checked) return;
      selected = i;
      box.querySelectorAll(".choice").forEach((c, j) => c.classList.toggle("selected", j === i));
      btn.disabled = false;
    });
    box.appendChild(b);
  });
  area.appendChild(box);

  current.getAnswer = () => {
    const ok = selected === ex.answer;
    box.querySelectorAll(".choice").forEach((c, j) => {
      c.classList.remove("selected");
      if (j === ex.answer) c.classList.add("correct");
      else if (j === selected && !ok) c.classList.add("wrong");
    });
    return ok;
  };
}

function normalize(s) {
  return s.trim().replace(/\s+/g, " ").replace(/\s*([()=+*.,:%])\s*/g, "$1");
}

function renderType(ex, area, btn) {
  const input = document.createElement("input");
  input.className = "type-input";
  input.type = "text";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.placeholder = "Type your answer here…";
  input.addEventListener("input", () => { btn.disabled = input.value.trim() === ""; });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !btn.disabled) btn.click();
  });
  area.appendChild(input);
  input.focus();

  const accepted = Array.isArray(ex.answer) ? ex.answer : [ex.answer];
  current.getAnswer = () => {
    input.disabled = true;
    return accepted.some((a) => normalize(a) === normalize(input.value));
  };
}

function renderArrange(ex, area, btn) {
  const assembled = document.createElement("div");
  assembled.className = "assembled";
  const bank = document.createElement("div");
  bank.className = "bank";
  area.appendChild(assembled);
  area.appendChild(bank);

  // picked: array of bank indices in chosen order
  let picked = [];

  const bankTokens = shuffle(ex.tokens.map((t, i) => ({ t, i })));

  function redraw() {
    assembled.innerHTML = "";
    picked.forEach((bankIdx, pos) => {
      const tok = document.createElement("button");
      tok.className = "token";
      tok.textContent = ex.tokens[bankIdx];
      tok.addEventListener("click", () => {
        if (current.checked) return;
        picked.splice(pos, 1);
        redraw();
      });
      assembled.appendChild(tok);
    });
    bank.querySelectorAll(".token").forEach((b, k) => {
      b.classList.toggle("used", picked.includes(bankTokens[k].i));
    });
    btn.disabled = picked.length === 0;
  }

  bankTokens.forEach(({ t, i }) => {
    const tok = document.createElement("button");
    tok.className = "token";
    tok.textContent = t;
    tok.addEventListener("click", () => {
      if (current.checked || picked.includes(i)) return;
      picked.push(i);
      redraw();
    });
    bank.appendChild(tok);
  });

  current.getAnswer = () => {
    const built = picked.map((i) => ex.tokens[i]).join(" ");
    return normalize(built) === normalize(ex.answer);
  };
}

// ===== Check / continue flow =====
$("btn-check").addEventListener("click", () => {
  if (!current) return;

  if (current.checked) { nextExercise(); return; }

  const ex = current.queue[current.index];
  const ok = current.getAnswer();
  current.checked = true;

  const bar = $("check-bar");
  const fb = $("feedback");
  fb.classList.remove("hidden");

  if (ok) {
    bar.classList.add("state-correct");
    $("feedback-title").textContent = pickRandom(["Nice!", "Correct!", "Excellent!", "You got it!", "Amazing!"]);
    $("feedback-detail").textContent = "";
  } else {
    current.hearts--;
    current.missed.add(ex);
    bar.classList.add("state-wrong");
    $("feedback-title").textContent = "Not quite…";
    $("feedback-detail").innerHTML = "Correct answer: <code>" +
      escapeHtml(correctAnswerText(ex)) + "</code>";
    $("lesson-hearts").textContent = "❤️ " + current.hearts;
    updateTopbar();
    // Re-queue missed exercise at the end, Duolingo-style.
    current.queue.push(ex);
  }

  $("btn-check").textContent = "CONTINUE";
  $("btn-check").disabled = false;

  if (current.hearts <= 0) {
    setTimeout(() => show("gameover"), 900);
  }
});

function correctAnswerText(ex) {
  if (ex.explain) return stripTags(ex.explain);
  if (ex.type === "mc") return stripTags(ex.choices[ex.answer]);
  if (ex.type === "type") return Array.isArray(ex.answer) ? ex.answer[0] : ex.answer;
  return ex.answer;
}
function stripTags(s) { const d = document.createElement("div"); d.innerHTML = s; return d.textContent; }
function escapeHtml(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function nextExercise() {
  current.index++;
  if (current.index >= current.queue.length) finishLesson();
  else renderExercise();
}

function finishLesson() {
  const firstTry = current.total - current.missed.size;
  const earned = 10 + firstTry * 2;
  const accuracy = Math.round((firstTry / current.total) * 100);

  save.xp += earned;
  save.completed[lessonKey(current.u, current.l)] = true;
  bumpStreak();
  persist();

  $("complete-xp").textContent = "+" + earned;
  $("complete-acc").textContent = Math.min(accuracy, 100) + "%";
  show("complete");
  current = null;
  updateTopbar();
}

// Clicking the logo resumes where you left off: an in-progress lesson,
// else the last lesson you opened (if unfinished), else the next unfinished one.
function continueLearning() {
  let target = null;
  if (save.lastLesson && !save.completed[lessonKey(save.lastLesson.u, save.lastLesson.l)]) {
    target = save.lastLesson;
  } else {
    target = firstIncomplete();
  }
  if (!target) { current = null; renderPath(); show("home"); updateTopbar(); return; } // all done
  if (current && current.u === target.u && current.l === target.l) return; // already here
  startLesson(target.u, target.l);
}

// ===== Buttons =====
$("logo").addEventListener("click", continueLearning);
$("logo").addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); continueLearning(); }
});

$("btn-quit").addEventListener("click", () => {
  current = null;
  renderPath();
  show("home");
  updateTopbar();
});
$("btn-continue").addEventListener("click", () => { renderPath(); show("home"); });
$("btn-retry").addEventListener("click", () => {
  const { u, l } = current || firstIncomplete() || { u: 0, l: 0 };
  startLesson(u, l);
});
$("btn-home").addEventListener("click", () => { current = null; renderPath(); show("home"); updateTopbar(); });

// gameover keeps `current` so retry knows which lesson — but clear hearts display
// ===== Init =====
renderPath();
updateTopbar();

// Returning visitors land on the lesson they stopped at rather than the top of the path.
// This has to wait for load: the browser settles its own scroll position first and would
// otherwise undo the jump.
if (save.xp > 0 || Object.keys(save.completed).length) {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.addEventListener("load", () => {
    const node = document.querySelector(".lesson-node.current");
    if (node) node.scrollIntoView({ block: "center" });
  });
}
