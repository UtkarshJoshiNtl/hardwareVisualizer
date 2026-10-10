import { test } from "node:test";
import assert from "node:assert/strict";
import { lineOf, coherenceStep, makeCoherence, layout, simulate } from "../js/scenes/coherence.js";

const cfg = { blockBytes: 16, wordBytes: 4, numLines: 8, assoc: 2, memWords: 64 };

test("lineOf groups addresses into cache lines", () => {
  assert.equal(lineOf(0, cfg), 0);
  assert.equal(lineOf(12, cfg), 0);
  assert.equal(lineOf(16, cfg), 1);
  assert.equal(lineOf(31, cfg), 1);
});

test("layout puts the two vars on one line or two, per the flag", () => {
  const [a1, b1] = layout(true, cfg);
  assert.equal(lineOf(a1, cfg), lineOf(b1, cfg));
  const [a2, b2] = layout(false, cfg);
  assert.notEqual(lineOf(a2, cfg), lineOf(b2, cfg));
});

test("coherenceStep transfers only when ownership changes", () => {
  const s = makeCoherence(10);
  assert.equal(coherenceStep(s, 0, 0).transfer, true); // first touch
  assert.equal(coherenceStep(s, 0, 0).transfer, false); // still owner
  assert.equal(coherenceStep(s, 1, 0).transfer, true); // stolen
  assert.equal(s.transfers, 2);
  assert.equal(s.writes, 3);
});

test("false sharing causes far more transfers than padding", () => {
  const shared = simulate(true, 8, cfg);
  const padded = simulate(false, 8, cfg);
  assert.equal(shared.transfers, shared.writes); // every write steals the line
  assert.equal(padded.transfers, 2); // one cold miss per line, then stable
  assert.ok(shared.transfers > padded.transfers);
});
