/* Per-user session & learning progress.

   Saved in the visitor's own browser (localStorage), so someone can close the
   tab and pick up where they left off days later — no account, no login, and
   their data never leaves their device.

   Note: this is per-browser/per-device by design. Opening the site on a
   different device starts fresh (that would need accounts + a backend). */
TL.session = (function () {
  const KEY = "threatlens_session_v1";

  // The learning path shown in the "Your progress" card.
  const MILESTONES = [
    ["viewedCampaigns", "Explore the Campaign dashboard"],
    ["analyzedEmail", "Analyze an email"],
    ["viewedScams", "Browse Live Scams"],
    ["pulledFeed", "Pull the latest phishing scams"],
    ["readKnowledge", "Read the Knowledge Base"],
    ["ranTests", "Run the Test Runner"]
  ];

  // `lastVisit` = this visit; `previousVisit` = the one before it (for "welcome back").
  let state = { lastView: null, researchTab: null, lastVisit: null, previousVisit: null, visits: 0, progress: {} };

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  return {
    MILESTONES,

    /** Load saved state and return {returning, lastVisit} for the welcome-back. */
    start() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) state = Object.assign(state, JSON.parse(raw));
      } catch (e) { /* ignore */ }
      const previous = state.lastVisit;
      const returning = !!previous && (Date.now() - previous) > 60 * 60 * 1000;  // > 1 hour
      state.previousVisit = previous;
      state.lastVisit = Date.now();
      state.visits = (state.visits || 0) + 1;
      save();
      return { returning, lastVisit: previous, visits: state.visits };
    },

    get() { return state; },
    set(patch) { Object.assign(state, patch); save(); },

    /** Record a milestone once. Returns true the first time it's completed. */
    mark(key) {
      if (!state.progress[key]) { state.progress[key] = Date.now(); save(); return true; }
      return false;
    },
    done(key) { return !!state.progress[key]; },
    completed() { return MILESTONES.filter(([k]) => state.progress[k]).length; },
    percent() { return Math.round(100 * this.completed() / MILESTONES.length); },

    reset() {
      state = { lastView: null, researchTab: null, lastVisit: Date.now(), visits: 1, progress: {} };
      save();
    }
  };
})();
