// scenes/reduction.js — warp reduction. THIS IS YOURS TO WRITE.
//
// How do 32 lanes combine into one sum? Two ways:
//   - sequential: lane 0 reads the other 31 lanes one at a time -> 31 steps.
//   - tree: lanes pair up and fold in a shuffle-down tree -> 5 steps (= log2 32).
// Same answer, radically fewer steps and no serial dependency chain.

// ─────────────────────────────────────────────────────────────────────────────
// REIMPLEMENT (you): reduceSequential
// One accumulator (lane 0) adds every other lane's value, one per step.
// Record a history of the accumulator after each step so the UI can animate it.
// Return { sum, steps, rounds } where rounds is an array of snapshots:
//   { round, active: [lane indices still involved], accum }
// steps = values.length - 1.
// ─────────────────────────────────────────────────────────────────────────────
export function reduceSequential(values) {
  const rounds = [];
  let accum = values[0];
  rounds.push({ round: 0, active: [0], accum });
  for (let i = 1; i < values.length; i++) {
    accum += values[i];
    rounds.push({ round: i, active: [0, i], accum });
  }
  return { sum: accum, steps: values.length - 1, rounds };
}

// ─────────────────────────────────────────────────────────────────────────────
// REIMPLEMENT (you): reduceTree
// Classic shuffle-down reduction. Let count = values.length (a power of two):
//   for (offset = count/2; offset > 0; offset >>= 1)
//       for (lane = 0; lane < offset; lane++)
//           values[lane] += values[lane + offset]
// Record the working array at the start of each offset round so the UI can show
// the halving. Return { sum, steps, rounds }:
//   steps = log2(count), rounds = [{ round, offset, values: [...] }, ...].
// Work on a copy; do not mutate the caller's array.
// ─────────────────────────────────────────────────────────────────────────────
export function reduceTree(values) {
  const work = values.slice();
  const rounds = [{ round: 0, offset: null, values: work.slice() }];
  let round = 0;
  for (let offset = work.length >> 1; offset > 0; offset >>= 1) {
    round++;
    for (let lane = 0; lane < offset; lane++) {
      work[lane] += work[lane + offset];
    }
    rounds.push({ round, offset, values: work.slice() });
  }
  return { sum: work[0], steps: round, rounds };
}

export function makeWarp(n = 32) {
  return { values: Array.from({ length: n }, (_, i) => i + 1) };
}
