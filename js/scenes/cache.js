// scenes/cache.js — the cache model. THIS IS YOURS TO WRITE.
//
// Everything below marked REIMPLEMENT is the actual lesson. A cache simulator
// library would hide all of it. Derive the bit fields and the replacement logic
// by hand. A correct reference implementation is included so the app always
// runs; comment it out and replace it with your own, then `node --test`.

// ─────────────────────────────────────────────────────────────────────────────
// REIMPLEMENT (you): decodeAddress
//
// Split a byte address into the three fields a cache uses. This is the single
// most important idea in the whole visualizer.
//
// Spec:
//   numSets   = numLines / assoc
//   offsetBits = log2(blockBytes)
//   indexBits  = log2(numSets)
//   offset     = addr mod blockBytes              (which byte inside the line)
//   setIndex   = (addr / blockBytes) mod numSets  (which set it maps to)
//   tag        = addr / (blockBytes * numSets)     (the rest)
//   lineStart  = addr - offset                     (first byte of the line)
//
// Return { offset, setIndex, tag, lineStart, offsetBits, indexBits }.
// ─────────────────────────────────────────────────────────────────────────────
export function decodeAddress(addr, cfg) {
  const numSets = cfg.numLines / cfg.assoc;
  const offsetBits = Math.log2(cfg.blockBytes);
  const indexBits = Math.log2(numSets);
  const offset = addr % cfg.blockBytes;
  const setIndex = Math.floor(addr / cfg.blockBytes) % numSets;
  const tag = Math.floor(addr / (cfg.blockBytes * numSets));
  return { offset, setIndex, tag, lineStart: addr - offset, offsetBits, indexBits };
}

// ─────────────────────────────────────────────────────────────────────────────
// REIMPLEMENT (you): selectVictim
//
// When a set is full and a new line must come in, which way gets evicted?
//   - prefer an empty (invalid) way first
//   - LRU:   the way with the smallest lastUsed
//   - FIFO:  the way with the smallest insertedTick
//   - Random: any way; derive the index deterministically from `tick` so the
//             simulation is reproducible (e.g. a hash of tick).
// `set` is an array of ways: { valid, tag, lastUsed, insertedTick }.
// Return the index of the way to replace.
// ─────────────────────────────────────────────────────────────────────────────
export function selectVictim(set, policy, tick) {
  for (let i = 0; i < set.length; i++) if (!set[i].valid) return i;
  if (policy === "LRU") {
    let best = 0;
    for (let i = 1; i < set.length; i++) if (set[i].lastUsed < set[best].lastUsed) best = i;
    return best;
  }
  if (policy === "FIFO") {
    let best = 0;
    for (let i = 1; i < set.length; i++) if (set[i].insertedTick < set[best].insertedTick) best = i;
    return best;
  }
  const h = (Math.imul(tick, 2654435761) >>> 0) % set.length;
  return h;
}

export function makeCache(cfg) {
  const numSets = cfg.numLines / cfg.assoc;
  const sets = Array.from({ length: numSets }, () =>
    Array.from({ length: cfg.assoc }, () => ({ valid: false, tag: -1, lastUsed: -1, insertedTick: -1 })),
  );
  return { cfg, sets, tick: 0, stats: { accesses: 0, hits: 0, misses: 0, evictions: 0 } };
}

// ─────────────────────────────────────────────────────────────────────────────
// REIMPLEMENT (you): cacheAccess
//
// One memory access. Touch a byte address and update the cache.
// Algorithm:
//   1. decode the address into (tag, setIndex)
//   2. scan every way of that set for { valid && tag matches }
//        -> HIT: refresh lastUsed, bump stats.hits, return { hit: true, way }
//   3. otherwise MISS:
//        - choose a victim with selectVictim()
//        - if the victim way was valid, that line is evicted (stats.evictions++)
//        - install the new line { valid, tag, lastUsed, insertedTick }
//        - bump stats.misses
//        - return { hit: false, way, evicted }
//   Always advance cache.tick.
// Return { hit, way, setIndex, tag, decode, evicted }.
// ─────────────────────────────────────────────────────────────────────────────
export function cacheAccess(cache, addr, cfg) {
  const d = decodeAddress(addr, cfg);
  const set = cache.sets[d.setIndex];
  cache.stats.accesses++;

  for (let way = 0; way < set.length; way++) {
    if (set[way].valid && set[way].tag === d.tag) {
      set[way].lastUsed = cache.tick;
      cache.stats.hits++;
      cache.tick++;
      return { hit: true, way, setIndex: d.setIndex, tag: d.tag, decode: d, evicted: null };
    }
  }

  const victim = selectVictim(set, cfg.policy, cache.tick);
  const evicted = set[victim].valid ? { ...set[victim], way: victim } : null;
  if (evicted) cache.stats.evictions++;
  set[victim] = { valid: true, tag: d.tag, lastUsed: cache.tick, insertedTick: cache.tick };
  cache.stats.misses++;
  cache.tick++;
  return { hit: false, way: victim, setIndex: d.setIndex, tag: d.tag, decode: d, evicted };
}

// Which memory words live in the line touched by this address (for drawing).
export function blockOf(addr, cfg) {
  const lineStart = addr - (addr % cfg.blockBytes);
  const perLine = cfg.blockBytes / cfg.wordBytes;
  const words = [];
  for (let i = 0; i < perLine; i++) words.push(lineStart / cfg.wordBytes + i);
  return { lineStart, words };
}

export function hitRate(stats) {
  return stats.accesses ? stats.hits / stats.accesses : 0;
}
