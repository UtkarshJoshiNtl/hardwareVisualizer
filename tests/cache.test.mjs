import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeAddress, makeCache, cacheAccess, selectVictim, hitRate } from "../js/scenes/cache.js";

const cfg = { blockBytes: 16, numLines: 8, assoc: 2, policy: "LRU", wordBytes: 4, memWords: 64 };

test("decodeAddress splits tag / set / offset correctly", () => {
  // 4 sets (8 lines / 2 ways), block 16B -> offsetBits 4, indexBits 2
  const d = decodeAddress(0, cfg);
  assert.deepEqual([d.offset, d.setIndex, d.tag], [0, 0, 0]);
  assert.equal(d.offsetBits, 4);
  assert.equal(d.indexBits, 2);

  const a = decodeAddress(37, cfg); // 37 = 2*16 + 5 -> set 2, offset 5
  assert.deepEqual([a.offset, a.setIndex, a.tag], [5, 2, 0]);
  assert.equal(a.lineStart, 32);

  const b = decodeAddress(64, cfg); // 64 = 4*16 -> set 0, tag 1
  assert.deepEqual([b.offset, b.setIndex, b.tag], [0, 0, 1]);

  const c = decodeAddress(160, cfg); // 160 = 10*16 -> set 2, tag 2
  assert.deepEqual([c.offset, c.setIndex, c.tag], [0, 2, 2]);
});

test("cacheAccess: first touch misses, repeat hits, same line hits", () => {
  const cache = makeCache(cfg);
  assert.equal(cacheAccess(cache, 0, cfg).hit, false);
  assert.equal(cacheAccess(cache, 4, cfg).hit, true); // same 16B line
  assert.equal(cacheAccess(cache, 0, cfg).hit, true);
  assert.equal(cache.stats.misses, 1);
  assert.equal(cache.stats.hits, 2);
  assert.ok(Math.abs(hitRate(cache.stats) - 2 / 3) < 1e-9);
});

test("different tags mapping to one set evict (direct-mapped)", () => {
  const dm = { ...cfg, assoc: 1, numLines: 4 }; // 4 sets
  const cache = makeCache(dm);
  assert.equal(cacheAccess(cache, 0, dm).hit, false); // set 0, tag 0
  assert.equal(cacheAccess(cache, 64, dm).hit, false); // 64 -> set 0, tag 1 -> conflict
  assert.equal(cache.stats.evictions, 1);
  assert.equal(cacheAccess(cache, 0, dm).hit, false); // tag 0 was evicted
});

test("selectVictim picks the least-recently-used way", () => {
  const set = [
    { valid: true, tag: 0, lastUsed: 5, insertedTick: 0 },
    { valid: true, tag: 1, lastUsed: 2, insertedTick: 1 },
  ];
  assert.equal(selectVictim(set, "LRU", 9), 1);
  assert.equal(selectVictim(set, "FIFO", 9), 0);
});

test("selectVictim prefers an invalid way before evicting", () => {
  const set = [
    { valid: true, tag: 0, lastUsed: 5, insertedTick: 0 },
    { valid: false, tag: -1, lastUsed: -1, insertedTick: -1 },
  ];
  assert.equal(selectVictim(set, "LRU", 9), 1);
});
