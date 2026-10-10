import { test } from "node:test";
import assert from "node:assert/strict";
import { genSequential, genStride, genBlocked, genColumnMajor } from "../js/scenes/patterns.js";
import { makeCache, cacheAccess } from "../js/scenes/cache.js";

test("genSequential walks 0..n-1", () => {
  assert.deepEqual(genSequential(5), [0, 1, 2, 3, 4]);
});

test("genStride steps by the stride", () => {
  assert.deepEqual(genStride(4, 3), [0, 3, 6, 9]);
  assert.deepEqual(genStride(3, 2, 1), [1, 3, 5]);
});

test("genColumnMajor walks the row-major matrix column by column", () => {
  // 2 rows x 3 cols, flat index = i*cols + j
  assert.deepEqual(genColumnMajor(2, 3), [0, 3, 1, 4, 2, 5]);
});

test("genBlocked tiles a 4x4 matrix with 2x2 blocks", () => {
  assert.deepEqual(genBlocked(4, 4, 2), [
    0, 1, 4, 5,
    2, 3, 6, 7,
    8, 9, 12, 13,
    10, 11, 14, 15,
  ]);
});

function missesFor(indices, cfg) {
  const cache = makeCache(cfg);
  for (const w of indices) cacheAccess(cache, w * cfg.wordBytes, cfg);
  return cache.stats.misses;
}

test("column-major costs more misses than row-major on the same matrix", () => {
  // 16x16 matrix = 64 lines, but only 16 slots -> column walk thrashes.
  const cfg = { blockBytes: 16, numLines: 16, assoc: 1, policy: "LRU", wordBytes: 4, memWords: 256 };
  const rows = 16, cols = 16;
  const rowMajor = genSequential(rows * cols);
  const colMajor = genColumnMajor(rows, cols);
  const mr = missesFor(rowMajor, cfg);
  const mc = missesFor(colMajor, cfg);
  assert.ok(mc > mr, `column-major (${mc}) should miss more than row-major (${mr})`);
});
