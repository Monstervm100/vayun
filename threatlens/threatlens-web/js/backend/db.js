/* Mock database — the "DB" tier.
   In-memory store, persisted best-effort to localStorage. Falls back to
   memory-only if localStorage is unavailable (e.g., some file:// contexts). */
TL.db = (function () {
  const KEY = TL.config.STORAGE_KEY;
  let state = { samples: [], campaigns: [], meta: { lastFeedPull: null }, seq: 7000 };

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* memory-only */ }
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { state = JSON.parse(raw); return true; }
    } catch (e) { /* ignore */ }
    return false;
  }

  return {
    load,
    all() { return state; },
    getSamples() { return state.samples.slice(); },
    count() { return state.samples.length; },
    getMeta() { return state.meta; },
    setMeta(patch) { Object.assign(state.meta, patch); persist(); },

    /** Insert a sample if its dedupe key is new. Returns true if added. (DC-FR-03) */
    addSample(sample) {
      const key = sample._key;
      if (state.samples.some(s => s._key === key)) return false;
      sample.id = sample.id || ++state.seq;
      state.samples.push(sample);
      persist();
      return true;
    },
    setCampaigns(list) { state.campaigns = list; persist(); },
    getCampaigns() { return state.campaigns.slice(); },

    /** Wipe and re-seed from seed.js (used by "Reset DB"). */
    reset() {
      state = { samples: [], campaigns: [], meta: { lastFeedPull: null }, seq: 7000 };
      persist();
    }
  };
})();
