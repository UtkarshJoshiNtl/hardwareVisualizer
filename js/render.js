// render.js — canvas primitives shared by every scene.
//
// PROVIDED. This is plumbing: you should not need to edit it to learn the
// hardware lessons. The interesting code lives in js/scenes/*.js.

export const PALETTE = {
  bg: "#0d1117",
  panel: "#161b22",
  grid: "#21262d",
  gridLine: "#30363d",
  text: "#c9d1d9",
  dim: "#8b949e",
  hit: "#2ea043",
  miss: "#f85149",
  active: "#d29922",
  fetch: "#58a6ff",
  invalid: "#484f58",
  modified: "#db6d28",
  shared: "#3fb950",
  accent: "#bc8cff",
};

export function clear(ctx, w, h, color = PALETTE.bg) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
}

// Draw a rows x cols grid of cells. `get(x,y)` returns
// {fill, stroke, text, textColor} for cell (col, row).
export function drawGrid(ctx, ox, oy, cols, rows, cw, ch, get, opts = {}) {
  const gap = opts.gap ?? 2;
  const r = opts.radius ?? 3;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const d = get(col, row) || {};
      const x = ox + col * cw + gap;
      const y = oy + row * ch + gap;
      const w = cw - gap * 2;
      const h = ch - gap * 2;
      roundRect(ctx, x, y, w, h, r);
      ctx.fillStyle = d.fill ?? PALETTE.grid;
      ctx.fill();
      if (d.stroke) {
        ctx.strokeStyle = d.stroke;
        ctx.lineWidth = d.lineWidth ?? 1.5;
        ctx.stroke();
      }
      if (d.text != null) {
        ctx.fillStyle = d.textColor ?? PALETTE.text;
        ctx.font = `${d.fontSize ?? 11}px ui-monospace, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(d.text), x + w / 2, y + h / 2);
      }
    }
  }
}

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function text(ctx, x, y, str, opts = {}) {
  ctx.fillStyle = opts.color ?? PALETTE.text;
  ctx.font = `${opts.size ?? 12}px ${opts.mono ? "ui-monospace, monospace" : "system-ui, sans-serif"}`;
  ctx.textAlign = opts.align ?? "left";
  ctx.textBaseline = opts.baseline ?? "top";
  if (opts.bold) ctx.font = `600 ${opts.size ?? 12}px system-ui, sans-serif`;
  ctx.fillText(str, x, y);
}

export function legend(ctx, x, y, items) {
  let cx = x;
  for (const it of items) {
    roundRect(ctx, cx, y, 12, 12, 3);
    ctx.fillStyle = it.color;
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(it.label, cx + 17, y + 6);
    cx += 17 + ctx.measureText(it.label).width + 18;
  }
}

export function arrow(ctx, x0, y0, x1, y1, color = PALETTE.fetch, width = 2) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const a = Math.atan2(y1 - y0, x1 - x0);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - 8 * Math.cos(a - 0.4), y1 - 8 * Math.sin(a - 0.4));
  ctx.lineTo(x1 - 8 * Math.cos(a + 0.4), y1 - 8 * Math.sin(a + 0.4));
  ctx.closePath();
  ctx.fill();
}

// 0 -> cool, 1 -> hot. Used for hit-rate and reduction heat.
export function heat(t) {
  const clamp = Math.max(0, Math.min(1, t));
  const r = Math.round(40 + 200 * clamp);
  const g = Math.round(180 - 120 * clamp);
  const b = Math.round(120 - 80 * clamp);
  return `rgb(${r},${g},${b})`;
}
