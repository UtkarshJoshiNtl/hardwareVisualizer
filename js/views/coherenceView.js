// views/coherenceView.js — false sharing / coherence rendering.
//
// PROVIDED. Calls the seam functions in scenes/coherence.js.

import * as R from "../render.js";
import { makeCoherence, coherenceStep, layout, lineOf } from "../scenes/coherence.js";

export default {
  id: "coherence",
  title: "False sharing & cache coherence",
  subtitle: "Two threads, two variables, never the same one — yet the cache line ping-pongs between cores.",

  controls: [
    { id: "sameLine", label: "Placement", type: "select", options: [
      ["yes", "same cache line (false sharing)"],
      ["no", "padded onto separate lines"],
    ], value: "yes" },
    { id: "iters", label: "Writes per thread", type: "range", min: 1, max: 12, step: 1, value: 6 },
  ],

  create(cfg, params) {
    const sameLine = params.sameLine === "yes";
    const [a, b] = layout(sameLine, cfg);
    const la = lineOf(a, cfg), lb = lineOf(b, cfg);
    const wa = a / cfg.wordBytes, wb = b / cfg.wordBytes;
    const ops = [];
    for (let i = 0; i < params.iters; i++) {
      ops.push({ core: 0, line: la, word: wa, varName: "x" });
      ops.push({ core: 1, line: lb, word: wb, varName: "y" });
    }
    return { cfg, sameLine, state: makeCoherence(params.iters), ops, pointer: 0, last: null };
  },

  step(app) {
    const s = app.sceneState;
    if (s.pointer >= s.ops.length) return false;
    const op = s.ops[s.pointer];
    const res = coherenceStep(s.state, op.core, op.line);
    s.last = { ...op, ...res };
    s.pointer++;
    return s.pointer < s.ops.length;
  },

  draw(ctx, w, h, app) {
    const cfg = app.cfg.get();
    const s = app.sceneState;
    R.clear(ctx, w, h);

    const wordsPerLine = cfg.blockBytes / cfg.wordBytes;
    const [va, vb] = layout(s.sameLine, cfg);
    const la = lineOf(va, cfg), lb = lineOf(vb, cfg);

    const coreW = 230, coreH = 156, cy = 78;
    const cores = [
      { id: 0, x: 40, name: "Core 0", varName: "writes x", line: la, word: s.ops[0].word },
      { id: 1, x: w - coreW - 40, name: "Core 1", varName: "writes y", line: lb, word: s.ops[1].word },
    ];

    for (const c of cores) {
      const owns = s.state.owner[c.line] === c.id;
      const label = owns ? "Modified" : "Invalid";
      const scolor = owns ? R.PALETTE.modified : R.PALETTE.invalid;

      ctx.fillStyle = R.PALETTE.panel;
      R.roundRect(ctx, c.x, cy, coreW, coreH, 8);
      ctx.fill();
      ctx.strokeStyle = R.PALETTE.gridLine;
      ctx.stroke();

      R.text(ctx, c.x + 16, cy + 14, c.name, { size: 15, bold: true });
      R.text(ctx, c.x + 16, cy + 36, `L1 cache · ${c.varName}`, { size: 11, color: R.PALETTE.dim });

      ctx.fillStyle = scolor + "22";
      R.roundRect(ctx, c.x + 16, cy + 56, coreW - 32, 34, 6);
      ctx.fill();
      ctx.strokeStyle = scolor;
      R.roundRect(ctx, c.x + 16, cy + 56, coreW - 32, 34, 6);
      ctx.stroke();
      R.text(ctx, c.x + 28, cy + 68, `line ${c.line}: ${label}`, { size: 13, color: scolor, mono: true });

      R.drawGrid(ctx, c.x + 16, cy + 102, wordsPerLine, 1, (coreW - 32) / wordsPerLine, 30, (col) => {
        const word = c.line * wordsPerLine + col;
        const isMine = word === c.word;
        return {
          fill: isMine ? R.PALETTE.accent + "33" : R.PALETTE.grid,
          stroke: isMine ? R.PALETTE.accent : null,
          text: isMine ? c.varName.split(" ")[1] : word,
          textColor: isMine ? R.PALETTE.accent : R.PALETTE.dim,
          fontSize: 10,
        };
      });
    }

    // ---- centre: memory ----
    const memX = w / 2 - 95, memY = cy + 34;
    ctx.fillStyle = R.PALETTE.panel;
    R.roundRect(ctx, memX, memY, 190, 74, 8);
    ctx.fill();
    ctx.strokeStyle = R.PALETTE.gridLine;
    ctx.stroke();
    R.text(ctx, memX + 12, memY + 12, "memory", { size: 12, color: R.PALETTE.dim });
    R.text(ctx, memX + 12, memY + 34, s.sameLine ? "x, y share one line" : "x, y on separate lines",
      { size: 12, color: s.sameLine ? R.PALETTE.miss : R.PALETTE.hit, mono: true });
    R.text(ctx, memX + 12, memY + 52, `x @ line ${la}    y @ line ${lb}`, { size: 11, color: R.PALETTE.dim, mono: true });

    if (s.last && s.last.transfer) {
      const fromX = s.last.core === 0 ? cores[0].x + 46 : cores[1].x + coreW - 46;
      R.arrow(ctx, fromX, cy + 30, w / 2, memY + 6, R.PALETTE.miss, 2.5);
      R.text(ctx, w / 2 - 34, cy + 6, "TRANSFER", { size: 12, color: R.PALETTE.miss, bold: true });
    }

    // ---- counters ----
    const by = h - 96;
    ctx.fillStyle = R.PALETTE.panel;
    R.roundRect(ctx, 20, by, w - 40, 76, 6);
    ctx.fill();

    const t = s.state.transfers, writes = s.state.writes;
    const rate = writes ? t / writes : 0;
    R.text(ctx, 36, by + 12, "line transfers", { size: 10, color: R.PALETTE.dim });
    R.text(ctx, 36, by + 26, String(t), { size: 22, color: rate > 0.3 ? R.PALETTE.miss : R.PALETTE.hit, mono: true });
    R.text(ctx, 190, by + 12, "writes", { size: 10, color: R.PALETTE.dim });
    R.text(ctx, 190, by + 26, String(writes), { size: 22, color: R.PALETTE.text, mono: true });
    R.text(ctx, 300, by + 12, "transfers / write", { size: 10, color: R.PALETTE.dim });
    R.text(ctx, 300, by + 26, rate.toFixed(2), { size: 22, color: R.heat(rate), mono: true });

    R.text(ctx, 470, by + 30, s.sameLine
      ? "False sharing: every write steals the line. Pad to separate lines."
      : "No sharing: each core owns its line, zero transfers.",
      { size: 12, color: s.sameLine ? R.PALETTE.miss : R.PALETTE.hit });
  },

  legend: [
    { color: R.PALETTE.modified, label: "Modified (owned)" },
    { color: R.PALETTE.invalid, label: "Invalid" },
    { color: R.PALETTE.miss, label: "transfer" },
  ],
};
