// views/cacheView.js — rendering for the cache scene.
//
// PROVIDED. Draws memory, the cache, and the counters. It calls the seam
// functions in scenes/cache.js and scenes/patterns.js — those are the parts you
// rewrite.

import * as R from "../render.js";
import { makeCache, cacheAccess, blockOf, hitRate } from "../scenes/cache.js";
import { makePattern } from "../scenes/patterns.js";

export default {
  id: "cache",
  title: "Cache lines & access patterns",
  subtitle: "Watch a traversal decide its own hit rate. Same data, same cache — only the order changes.",

  controls: [
    { id: "pattern", label: "Access pattern", type: "select", options: [
      ["sequential", "row-major (sequential)"],
      ["stride", "strided"],
      ["blocked", "tiled (blocked)"],
      ["column", "column-major"],
    ], value: "sequential" },
    { id: "stride", label: "Stride (words)", type: "range", min: 1, max: 8, step: 1, value: 4 },
    { id: "block", label: "Tile size", type: "range", min: 1, max: 4, step: 1, value: 2 },
  ],

  cacheControls: true,

  create(cfg, params) {
    const rows = 8, cols = 8;
    const { indices, label } = makePattern(params.pattern, {
      n: cfg.memWords,
      stride: params.stride,
      rows, cols, block: params.block,
    });
    return {
      cache: makeCache(cfg),
      indices,
      label,
      pointer: 0,
      last: null,
      history: [],
      rows, cols,
    };
  },

  step(app) {
    const s = app.sceneState;
    const cfg = app.cfg.get();
    if (s.pointer >= s.indices.length) return false;
    const word = s.indices[s.pointer];
    const byteAddr = word * cfg.wordBytes;
    const res = cacheAccess(s.cache, byteAddr, cfg);
    res.word = word;
    res.block = blockOf(byteAddr, cfg);
    s.last = res;
    s.pointer++;
    return s.pointer < s.indices.length;
  },

  draw(ctx, w, h, app) {
    const cfg = app.cfg.get();
    const s = app.sceneState;
    R.clear(ctx, w, h);

    const wordsPerLine = cfg.blockBytes / cfg.wordBytes;
    const memLines = Math.floor(cfg.memWords / wordsPerLine);
    const numSets = cfg.numLines / cfg.assoc;

    R.text(ctx, 20, 16, "MEMORY", { size: 12, color: R.PALETTE.dim, bold: true });
    R.text(ctx, 20, 32, `${cfg.memWords} words · ${cfg.wordBytes}B each · line = ${cfg.blockBytes}B (${wordsPerLine} words)`,
      { size: 11, color: R.PALETTE.dim });

    // ---- memory grid: one row per cache line ----
    const mx = 20, my = 58;
    const mCellW = 46, mCellH = Math.min(26, (h - my - 150) / memLines);
    const fetched = s.last ? new Set(s.last.block.words) : new Set();

    R.drawGrid(ctx, mx, my, wordsPerLine, memLines, mCellW, mCellH, (col, row) => {
      const word = row * wordsPerLine + col;
      if (word >= cfg.memWords) return { fill: "transparent" };
      const isFetched = fetched.has(word);
      const isCurrent = s.last && s.last.word === word;
      let fill = R.PALETTE.grid;
      let stroke = null;
      if (isFetched) { fill = R.PALETTE.fetch + "33"; stroke = R.PALETTE.fetch; }
      if (isCurrent) { fill = (s.last.hit ? R.PALETTE.hit : R.PALETTE.miss) + "55"; stroke = s.last.hit ? R.PALETTE.hit : R.PALETTE.miss; }
      return { fill, stroke, text: word, textColor: R.PALETTE.dim, fontSize: 10, lineWidth: 2 };
    });

    // line labels
    for (let row = 0; row < memLines; row++) {
      R.text(ctx, mx + wordsPerLine * mCellW + 8, my + row * mCellH + mCellH / 2 - 6,
        `line ${row}`, { size: 10, color: R.PALETTE.dim, mono: true });
    }

    // ---- cache grid ----
    const cx = mx + wordsPerLine * mCellW + 80;
    R.text(ctx, cx, 16, "CACHE", { size: 12, color: R.PALETTE.dim, bold: true });
    R.text(ctx, cx, 32, `${cfg.numLines} lines · ${numSets} sets × ${cfg.assoc}-way · ${cfg.policy}`,
      { size: 11, color: R.PALETTE.dim });

    const cCellW = 74, cCellH = Math.min(30, (h - my - 150) / numSets);
    R.drawGrid(ctx, cx, my, cfg.assoc, numSets, cCellW, cCellH, (col, row) => {
      const way = s.cache.sets[row][col];
      const isVictim = s.last && !s.last.hit && s.last.setIndex === row && s.last.way === col;
      const isHot = s.last && s.last.hit && s.last.setIndex === row && s.last.way === col;
      let fill = R.PALETTE.grid;
      let stroke = null;
      if (way.valid) fill = R.PALETTE.shared + "26";
      if (isHot) { fill = R.PALETTE.hit + "44"; stroke = R.PALETTE.hit; }
      if (isVictim) { fill = R.PALETTE.miss + "44"; stroke = R.PALETTE.miss; }
      return {
        fill, stroke, lineWidth: 2,
        text: way.valid ? `tag ${way.tag}` : "—",
        textColor: way.valid ? R.PALETTE.text : R.PALETTE.invalid,
        fontSize: 10,
      };
    });

    // set index labels
    for (let row = 0; row < numSets; row++) {
      R.text(ctx, cx - 44, my + row * cCellH + cCellH / 2 - 6, `set ${row}`, { size: 10, color: R.PALETTE.dim, mono: true });
    }

    // ---- counters ----
    const by = h - 84;
    ctx.fillStyle = R.PALETTE.panel;
    R.roundRect(ctx, 20, by, w - 40, 64, 6);
    ctx.fill();

    const st = s.cache.stats;
    R.text(ctx, 36, by + 12, "accesses", { size: 10, color: R.PALETTE.dim });
    R.text(ctx, 36, by + 26, String(st.accesses), { size: 20, color: R.PALETTE.text, mono: true });
    R.text(ctx, 150, by + 12, "hits", { size: 10, color: R.PALETTE.dim });
    R.text(ctx, 150, by + 26, String(st.hits), { size: 20, color: R.PALETTE.hit, mono: true });
    R.text(ctx, 240, by + 12, "misses", { size: 10, color: R.PALETTE.dim });
    R.text(ctx, 240, by + 26, String(st.misses), { size: 20, color: R.PALETTE.miss, mono: true });
    R.text(ctx, 350, by + 12, "evictions", { size: 10, color: R.PALETTE.dim });
    R.text(ctx, 350, by + 26, String(st.evictions), { size: 20, color: R.PALETTE.text, mono: true });

    const rate = hitRate(st);
    R.text(ctx, 470, by + 12, "hit rate", { size: 10, color: R.PALETTE.dim });
    R.text(ctx, 470, by + 22, `${(rate * 100).toFixed(0)}%`, { size: 22, color: R.heat(rate), mono: true });

    if (s.last) {
      const tag = s.last.hit ? "HIT" : "MISS";
      const col = s.last.hit ? R.PALETTE.hit : R.PALETTE.miss;
      R.text(ctx, w - 150, by + 14, `word ${s.last.word}`, { size: 12, color: R.PALETTE.dim, mono: true });
      R.text(ctx, w - 150, by + 32, tag, { size: 22, color: col, bold: true });
      R.text(ctx, w - 150, by + 56, s.last.hit ? `set ${s.last.setIndex} · way ${s.last.way}` : `set ${s.last.setIndex} · fill way ${s.last.way}`,
        { size: 10, color: R.PALETTE.dim, mono: true });
    }
  },

  legend: [
    { color: R.PALETTE.fetch, label: "fetched line" },
    { color: R.PALETTE.hit, label: "hit" },
    { color: R.PALETTE.miss, label: "miss / evict" },
  ],
};
