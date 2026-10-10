// views/reductionView.js — GPU warp reduction rendering.
//
// PROVIDED. Calls the seam functions in scenes/reduction.js.

import * as R from "../render.js";
import { reduceSequential, reduceTree } from "../scenes/reduction.js";

export default {
  id: "reduction",
  title: "GPU warp reduction",
  subtitle: "Fold 32 lanes into one sum: a serial walk takes 31 steps, a shuffle tree takes 5.",

  controls: [
    { id: "n", label: "Warp size", type: "select", options: [
      [8, "8 lanes"], [16, "16 lanes"], [32, "32 lanes (a warp)"],
    ], value: 32 },
    { id: "mode", label: "Method", type: "select", options: [
      ["tree", "shuffle tree (log n)"], ["sequential", "serial (n-1)"],
    ], value: "tree" },
  ],

  create(cfg, params) {
    const n = Number(params.n);
    const values = Array.from({ length: n }, (_, i) => i + 1);
    const seq = reduceSequential(values);
    const tree = reduceTree(values);
    const rounds = params.mode === "tree" ? tree.rounds : seq.rounds;
    return {
      n, values,
      seq, tree,
      mode: params.mode,
      rounds,
      pointer: 0,
      steps: params.mode === "tree" ? tree.steps : seq.steps,
      sum: values.reduce((a, b) => a + b, 0),
    };
  },

  step(app) {
    const s = app.sceneState;
    if (s.pointer >= s.rounds.length - 1) return false;
    s.pointer++;
    return s.pointer < s.rounds.length - 1;
  },

  draw(ctx, w, h, app) {
    const s = app.sceneState;
    R.clear(ctx, w, h);
    const r = s.rounds[s.pointer];
    const disp = r.values ?? s.values;

    // ---- lanes ----
    const laneY = 110;
    const laneH = 64;
    const laneW = Math.min(54, (w - 60) / s.n);

    R.text(ctx, 30, 20, `LANE REGISTERS`, { size: 12, color: R.PALETTE.dim, bold: true });
    R.text(ctx, 30, 38,
      s.mode === "tree"
        ? `round ${r.round}/${s.rounds.length - 1}  ·  offset ${r.offset ?? "—"}  ·  lanes 0..${(r.offset ?? 0) - 1} add their partner`
        : `step ${r.round}/${s.steps}  ·  lane 0 accumulating`,
      { size: 12, color: R.PALETTE.dim });

    const active = new Set();
    if (s.mode === "tree" && r.offset) {
      for (let i = 0; i < r.offset; i++) active.add(i);
    } else if (s.mode === "sequential") {
      active.add(0);
      if (r.active) r.active.forEach((i) => active.add(i));
    }

    R.drawGrid(ctx, 30, laneY, s.n, 1, laneW, laneH, (col) => {
      const on = s.mode === "tree" ? col < (r.offset ?? 0) : (r.active ? r.active.includes(col) : col === 0);
      const done = s.mode === "tree" ? col >= (r.offset ?? 0) && r.offset != null : false;
      let fill = R.PALETTE.grid;
      if (done) fill = R.PALETTE.invalid + "22";
      if (on) fill = R.PALETTE.accent + "44";
      const v = disp[col];
      return {
        fill,
        stroke: on ? R.PALETTE.accent : null,
        text: v != null ? v : "·",
        textColor: on ? R.PALETTE.text : (done ? R.PALETTE.invalid : R.PALETTE.dim),
        fontSize: laneW > 40 ? 15 : 12,
        lineWidth: 2,
      };
    });

    for (let i = 0; i < s.n; i++) {
      R.text(ctx, 30 + i * laneW + laneW / 2, laneY + laneH + 6, `L${i}`,
        { size: 9, color: R.PALETTE.dim, mono: true, align: "center" });
    }

    // ---- tree arrows for this round ----
    if (s.mode === "tree" && r.offset) {
      for (let i = 0; i < r.offset; i++) {
        const x0 = 30 + (i + r.offset) * laneW + laneW / 2;
        const x1 = 30 + i * laneW + laneW / 2;
        R.arrow(ctx, x0, laneY - 8, x1, laneY - 8, R.PALETTE.fetch, 1.5);
      }
    }

    // ---- summary / comparison ----
    const by = h - 150;
    ctx.fillStyle = R.PALETTE.panel;
    R.roundRect(ctx, 20, by, w - 40, 130, 6);
    ctx.fill();

    const total = s.sum;
    R.text(ctx, 40, by + 14, "final sum", { size: 10, color: R.PALETTE.dim });
    R.text(ctx, 40, by + 28, disp[0] != null && s.pointer >= s.rounds.length - 1 ? String(disp[0]) : "…",
      { size: 24, color: R.PALETTE.hit, mono: true });
    R.text(ctx, 200, by + 14, "true sum", { size: 10, color: R.PALETTE.dim });
    R.text(ctx, 200, by + 28, String(total), { size: 24, color: R.PALETTE.text, mono: true });

    // method comparison bars
    const bx = 360, bw = w - bx - 60;
    const maxSteps = Math.max(s.seq.steps, 1);
    for (const [i, [name, steps, color]] of [["shuffle tree", s.tree.steps, R.PALETTE.hit], ["serial", s.seq.steps, R.PALETTE.miss]].entries()) {
      const yy = by + 20 + i * 34;
      R.text(ctx, bx, yy, name, { size: 11, color: R.PALETTE.dim });
      const frac = steps / maxSteps;
      ctx.fillStyle = color + "55";
      R.roundRect(ctx, bx + 110, yy - 2, Math.max(2, frac * (bw - 110)), 18, 4);
      ctx.fill();
      R.text(ctx, bx + 116, yy + 1, `${steps} steps`, { size: 11, color, mono: true });
    }

    R.text(ctx, 40, by + 78,
      s.mode === "tree"
        ? "log₂(n) rounds, fully parallel within each round."
        : "n−1 sequential steps, one dependency chain — slow on a GPU.",
      { size: 12, color: R.PALETTE.dim });
    R.text(ctx, 40, by + 100,
      `speedup of tree over serial: ${(s.seq.steps / Math.max(s.tree.steps, 1)).toFixed(1)}x`,
      { size: 12, color: R.PALETTE.accent });
  },

  legend: [
    { color: R.PALETTE.accent, label: "active lane" },
    { color: R.PALETTE.invalid, label: "retired lane" },
    { color: R.PALETTE.fetch, label: "shuffle" },
  ],
};
