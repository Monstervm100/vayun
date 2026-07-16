/* App controller — shared UI helpers, router, bootstrap, sidebar actions. */
(function () {
  /* ---------- shared render helpers ---------- */
  TL.ui = {
    kpi(label, value, delta, cls) {
      return `<div class="kpi"><div class="kl">${TL.util.esc(label)}</div>
        <div class="kv">${TL.util.esc(value)}</div>
        <div class="kd ${cls || ""}">${TL.util.esc(delta || "")}</div></div>`;
    },
    barlist(rows) {
      if (!rows || !rows.length) return '<span class="muted">No data.</span>';
      const hi = Math.max.apply(null, rows.map(r => r.pct)) || 1;
      return `<div class="barlist">${rows.map(r => `
        <div class="barrow"${r.title ? ` title="${TL.util.esc(r.title)}"` : ""}><span class="bn">${TL.util.esc(r.label)}</span>
        <span class="track"><span class="fill" style="width:${Math.round(100 * r.pct / hi)}%"></span></span>
        <span class="bv">${TL.util.esc(r.value)}</span></div>`).join("")}</div>`;
    },
    sparkline(series) {
      const data = (series && series.length) ? series : [1, 1];
      const w = 300, h = 180, pad = 10, n = data.length;
      const max = Math.max.apply(null, data), min = Math.min.apply(null, data), rng = (max - min) || 1;
      const x = i => n === 1 ? w / 2 : pad + i * (w - 2 * pad) / (n - 1);
      const y = v => h - pad - ((v - min) / rng) * (h - 2 * pad);
      let d = "";
      data.forEach((v, i) => { d += (i ? "L" : "M") + x(i).toFixed(1) + "," + y(v).toFixed(1) + " "; });
      const area = d + `L${x(n - 1).toFixed(1)},${h} L${x(0).toFixed(1)},${h} Z`;
      return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="trend">
        <path d="${area}" fill="var(--accent)" fill-opacity="0.14"/>
        <path d="${d}" fill="none" stroke="var(--accent)" stroke-width="2.4" vector-effect="non-scaling-stroke"/>
        <circle cx="${x(n - 1).toFixed(1)}" cy="${y(data[n - 1]).toFixed(1)}" r="3.5" fill="var(--accent)"/></svg>`;
    },
    toast(msg) {
      const t = document.getElementById("toast");
      t.textContent = msg; t.classList.add("show");
      clearTimeout(TL.ui._tt); TL.ui._tt = setTimeout(() => t.classList.remove("show"), 2600);
    }
  };

  /* ---------- shared app state ---------- */
  TL.state = TL.state || {};

  /* ---------- router ---------- */
  const ROUTES = ["campaigns", "analysis", "scams", "research", "tests"];
  function currentRoute() {
    const h = (location.hash || "#campaigns").replace("#", "");
    return ROUTES.includes(h) ? h : "campaigns";
  }
  // Milestones unlocked simply by visiting a screen.
  const VIEW_MILESTONE = { campaigns: "viewedCampaigns", scams: "viewedScams", tests: "ranTests" };

  function renderView(name) {
    const view = TL.views[name];
    const main = document.getElementById("main");
    main.innerHTML = view.render();
    if (view.mount) view.mount();
    document.querySelectorAll(".navitem").forEach(a =>
      a.classList.toggle("on", a.dataset.view === name));
    main.scrollTop = 0;
    // Remember where the user was, and credit any milestone for this screen.
    TL.session.set({ lastView: name });
    if (VIEW_MILESTONE[name]) TL.session.mark(VIEW_MILESTONE[name]);
  }
  function route() { renderView(currentRoute()); }

  /* ---------- feed status ---------- */
  function updateFeedStatus() {
    const meta = TL.db.getMeta();
    const el = document.getElementById("feed-status");
    if (!meta.lastFeedPull) { el.textContent = "Last updated: never — refresh due"; return; }
    const due = TL.phishingFeed.isDue();
    el.innerHTML = "Last updated: " + TL.util.fmtDate(meta.lastFeedPull) +
      (meta.lastFeedSource ? "<br>Source: " + TL.util.esc(meta.lastFeedSource) : "") +
      "<br>" + (due ? "Monthly refresh due" : "Next due: " + TL.util.fmtDate(TL.phishingFeed.nextDue()));
  }

  /* ---------- theme ---------- */
  function applyTheme(mode) {
    document.documentElement.setAttribute("data-theme", mode);
    try { localStorage.setItem("tl_theme", mode); } catch (e) {}
  }
  function cycleTheme() {
    const order = ["auto", "light", "dark"];
    const cur = document.documentElement.getAttribute("data-theme") || "auto";
    const next = order[(order.indexOf(cur) + 1) % order.length];
    applyTheme(next);
    TL.ui.toast("Theme: " + next);
  }

  /* ---------- bootstrap ---------- */
  function seedIfEmpty() {
    TL.db.load();
    if (TL.db.count() === 0) {
      const r = TL.dataCollection.collect(TL.seed.samples);
      // Record the seed load as the first entry in the pull history.
      TL.db.setMeta({ feedHistory: [{ date: new Date().toISOString().slice(0, 10), added: r.added, source: "seed dataset" }] });
    }
    TL.api.recomputeCampaigns();
    TL.mlEngine.train();
  }

  function wireSidebar() {
    document.getElementById("btn-pull-feed").addEventListener("click", async () => {
      const btn = document.getElementById("btn-pull-feed");
      const label = btn.textContent;
      btn.disabled = true; btn.textContent = "⟳ Pulling…";
      try {
        const r = await TL.api.pullFeed();
        TL.session.mark("pulledFeed");
        updateFeedStatus();
        route();  // re-render current view with new data
        TL.ui.toast("Feed (" + r.source + "): +" + r.added + " new, " + r.duplicates + " duplicate(s).");
      } catch (e) {
        TL.ui.toast("Feed error: " + e.message);
      } finally {
        btn.disabled = false; btn.textContent = label;
      }
    });
    document.getElementById("btn-theme").addEventListener("click", cycleTheme);
    document.getElementById("btn-reset").addEventListener("click", () => {
      TL.db.reset(); seedIfEmpty(); updateFeedStatus(); route();
      TL.ui.toast("Database reset to seed data.");
    });
  }

  /** Show the anonymous visit counter (hidden on static hosting). */
  async function showVisitCounter() {
    const el = document.getElementById("visit-counter");
    const stats = await TL.analytics.recordVisit();
    if (!stats) { el.style.display = "none"; return; }
    el.innerHTML = "👥 " + stats.unique.toLocaleString() + " people · " +
      stats.total.toLocaleString() + " visits";
  }

  function init() {
    try { applyTheme(localStorage.getItem("tl_theme") || "auto"); } catch (e) { applyTheme("auto"); }
    const visit = TL.session.start();
    seedIfEmpty();
    wireSidebar();
    updateFeedStatus();
    TL.app = { route: route, updateFeedStatus: updateFeedStatus };  // for views
    window.addEventListener("hashchange", route);

    // Resume where they left off (a shared deep link in the URL still wins).
    const saved = TL.session.get().lastView;
    if (!location.hash && saved && ROUTES.includes(saved)) location.hash = "#" + saved;
    route();

    if (visit.returning) {
      TL.ui.toast("Welcome back! Last visit " + TL.util.fmtDateTime(visit.lastVisit) +
        " · " + TL.session.percent() + "% through the tour");
    }
    showVisitCounter();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
