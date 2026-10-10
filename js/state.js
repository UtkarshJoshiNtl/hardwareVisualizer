// state.js — app-level state and defaults.
//
// PROVIDED. The scenes keep their own state; this holds the shared config and
// the tiny pub/sub the UI uses.

export const DEFAULT_CONFIG = {
  blockBytes: 16, // cache line size
  numLines: 8, // total lines in the cache
  assoc: 2, // ways per set (numSets = numLines / assoc)
  policy: "LRU", // LRU | FIFO | Random
  wordBytes: 4, // bytes per element
  memWords: 64, // memory size in words (32-bit ints)
};

export function createStore(initial = {}) {
  let state = { ...initial };
  const subs = new Set();
  return {
    get: () => state,
    set(patch) {
      state = { ...state, ...patch };
      subs.forEach((fn) => fn(state));
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

// log2 that stays correct for non-powers-of-two (rounds up).
export function ilog2(n) {
  return Math.ceil(Math.log2(n));
}
