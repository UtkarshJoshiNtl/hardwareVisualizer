// scenes/patterns.js — memory access patterns. THIS IS YOURS TO WRITE.
//
// A traversal order decides how often you cross a cache line. Sequential walk
// = one miss per line. Strided or column-major walk = a miss almost every time.
// These functions return arrays of *word indices* to access in order.

// ─────────────────────────────────────────────────────────────────────────────
// REIMPLEMENT (you): genSequential
// Access 0, 1, 2, ... n-1. This is the good case: every access after the first
// in a line hits. Return an array of length n.
// ─────────────────────────────────────────────────────────────────────────────
export function genSequential(n) {
  return Array.from({ length: n }, (_, i) => i);
}

// ─────────────────────────────────────────────────────────────────────────────
// REIMPLEMENT (you): genStride
// Access start, start+stride, start+2*stride, ... for n accesses.
// stride is measured in WORDS. A stride >= words-per-line touches a fresh line
// every time -> all misses. Return an array of length n.
// ─────────────────────────────────────────────────────────────────────────────
export function genStride(n, stride, start = 0) {
  return Array.from({ length: n }, (_, i) => start + i * stride);
}

// ─────────────────────────────────────────────────────────────────────────────
// REIMPLEMENT (you): genBlocked
// Traverse a rows x cols row-major matrix in block x block tiles. Within a tile
// you walk row by row, so you stay in cache; you only break out between tiles.
// Return the sequence of flat indices i*cols + j, tile by tile.
// ─────────────────────────────────────────────────────────────────────────────
export function genBlocked(rows, cols, block) {
  const out = [];
  for (let bi = 0; bi < rows; bi += block) {
    for (let bj = 0; bj < cols; bj += block) {
      for (let i = bi; i < Math.min(bi + block, rows); i++) {
        for (let j = bj; j < Math.min(bj + block, cols); j++) {
          out.push(i * cols + j);
        }
      }
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// REIMPLEMENT (you): genColumnMajor
// Traverse the same row-major matrix column by column: for each column j, walk
// every row i. Because storage is row-major, consecutive accesses are `cols`
// words apart -> a fresh cache line each time. Return flat indices i*cols + j.
// ─────────────────────────────────────────────────────────────────────────────
export function genColumnMajor(rows, cols) {
  const out = [];
  for (let j = 0; j < cols; j++) {
    for (let i = 0; i < rows; i++) {
      out.push(i * cols + j);
    }
  }
  return out;
}

export function makePattern(kind, opts = {}) {
  const { n = 64, stride = 4, rows = 8, cols = 8, block = 2 } = opts;
  switch (kind) {
    case "stride":
      return { indices: genStride(n, stride), label: `stride ${stride} words` };
    case "blocked":
      return { indices: genBlocked(rows, cols, block), label: `${block}x${block} tiled` };
    case "column":
      return { indices: genColumnMajor(rows, cols), label: "column-major" };
    case "sequential":
    default:
      return { indices: genSequential(rows * cols), label: "row-major (sequential)" };
  }
}
