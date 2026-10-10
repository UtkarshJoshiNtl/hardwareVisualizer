// scenes/coherence.js — false sharing / cache coherence. THIS IS YOURS TO WRITE.
//
// Two cores, two variables, one cache line. If both variables live in the same
// 64-byte line, every write by one core invalidates the other's copy: the line
// "ping-pongs" between cores even though the threads never touch the same
// variable. That is false sharing. Pad the variables onto separate lines and
// the transfers vanish.

// ─────────────────────────────────────────────────────────────────────────────
// REIMPLEMENT (you): lineOf
// Return the cache-line number that holds this byte address.
//   lineOf(addr, cfg) = floor(addr / cfg.blockBytes)
// ─────────────────────────────────────────────────────────────────────────────
export function lineOf(addr, cfg) {
  return Math.floor(addr / cfg.blockBytes);
}

// ─────────────────────────────────────────────────────────────────────────────
// REIMPLEMENT (you): coherenceStep
//
// Model one core writing one line. Coherence in one sentence: a line can be
// owned (Modified) by at most one core. If `coreId` does not already own the
// line, the write must first pull it from the other core and invalidate the
// other copy -> that transfer is the cost of coherence.
//
// state: { owner: {lineId: coreId}, transfers, writes }
// Return { transfer: boolean } and update the state:
//   - if state.owner[lineId] === coreId  -> no transfer, just a write
//   - otherwise                          -> transfers++, state.owner[lineId] = coreId
// ─────────────────────────────────────────────────────────────────────────────
export function coherenceStep(state, coreId, lineId) {
  state.writes++;
  if (state.owner[lineId] === coreId) {
    return { transfer: false };
  }
  state.owner[lineId] = coreId;
  state.transfers++;
  return { transfer: true };
}

export function makeCoherence(iters) {
  return { owner: {}, transfers: 0, writes: 0, iters };
}

// Layout: two 4-byte ints. `sameLine` puts them adjacent (false sharing);
// otherwise it pads the second onto its own cache line.
export function layout(sameLine, cfg) {
  return sameLine ? [0, cfg.wordBytes] : [0, cfg.blockBytes];
}

// The full experiment: both cores hammer their variable `iters` times.
export function simulate(sameLine, iters, cfg) {
  const [a, b] = layout(sameLine, cfg);
  const la = lineOf(a, cfg);
  const lb = lineOf(b, cfg);
  const state = makeCoherence(iters);
  for (let i = 0; i < iters; i++) {
    coherenceStep(state, 0, la);
    coherenceStep(state, 1, lb);
  }
  return { transfers: state.transfers, writes: state.writes, sameLine };
}
