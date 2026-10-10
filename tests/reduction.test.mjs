import { test } from "node:test";
import assert from "node:assert/strict";
import { reduceSequential, reduceTree } from "../js/scenes/reduction.js";

test("reduceSequential sums and takes n-1 steps", () => {
  const r = reduceSequential([1, 2, 3, 4]);
  assert.equal(r.sum, 10);
  assert.equal(r.steps, 3);
});

test("reduceTree sums and takes log2(n) steps", () => {
  const r = reduceTree([1, 2, 3, 4]);
  assert.equal(r.sum, 10);
  assert.equal(r.steps, 2);
});

test("tree and serial agree on a full warp", () => {
  const vals = Array.from({ length: 32 }, (_, i) => i + 1);
  const seq = reduceSequential(vals);
  const tree = reduceTree(vals);
  assert.equal(seq.sum, tree.sum);
  assert.equal(tree.sum, 528);
  assert.equal(tree.steps, 5);
  assert.equal(seq.steps, 31);
});

test("reduceTree does not mutate its input", () => {
  const vals = [1, 2, 3, 4, 5, 6, 7, 8];
  const copy = vals.slice();
  reduceTree(vals);
  assert.deepEqual(vals, copy);
});
