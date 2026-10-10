# Hardware-Aware Visualizer

An interactive, in-browser visualizer for the things that actually decide
performance: **cache lines, memory access patterns, false sharing, and GPU
reductions.** Static site — no backend, no build step, no dependencies.

This space is crowded (U-Michigan's cache simulator, UW CSE 351's, `p14m.com`,
several MESI-coherence tools). That is fine. The point of *this* repo is not to
be another simulator — it's the **learn-by-writing split** below. The app is a
finished, runnable artifact *and* a scaffold for you to write the hardware model
by hand.

## Run it

ES modules require a web server (browsers block `file://` module imports):

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## The three scenes

1. **Cache lines & access patterns** — watch a traversal build its own hit rate.
   Same data, same cache; switch row-major ↔ strided ↔ tiled ↔ column-major and
   watch misses appear. Sliders for line size, number of lines, associativity,
   replacement policy.
2. **False sharing & coherence** — two threads writing two variables. Placed in
   one cache line, every write ping-pongs the line between cores; padded onto
   separate lines, transfers drop to zero.
3. **GPU warp reduction** — fold 32 lanes into one sum. Step the shuffle-down
   tree (5 rounds) against the serial reduction (31 steps).

Keys: <kbd>Space</kbd> play/pause · <kbd>→</kbd> step · <kbd>R</kbd> reset · <kbd>1</kbd>–<kbd>3</kbd> scenes.

## What is yours to write

Every function in **`js/scenes/*.js`** carries a `REIMPLEMENT (you):` banner with
a spec. These are the real lessons — a cache/reduction library would hide them:

| seam | file | the idea you implement |
|------|------|------------------------|
| `decodeAddress` | `scenes/cache.js` | split a byte address into tag / index / offset |
| `selectVictim` | `scenes/cache.js` | LRU / FIFO / random eviction |
| `cacheAccess` | `scenes/cache.js` | lookup → hit, or evict + fill |
| `genSequential` / `genStride` / `genBlocked` / `genColumnMajor` | `scenes/patterns.js` | how traversal order decides cache behaviour |
| `lineOf` / `coherenceStep` | `scenes/coherence.js` | ownership, invalidate-on-write, ping-pong |
| `reduceSequential` / `reduceTree` | `scenes/reduction.js` | serial vs shuffle-tree reduction |

**Every seam ships with a correct reference implementation**, so the app is
complete and always runs. To learn: open the file, read the `REIMPLEMENT` banner,
comment out the reference, and write your own. Then check your work:

```sh
node --test        # 18 tests across the four seam modules
```

That is the whole loop: **read the spec → implement → `node --test` says whether
you got it right.**

## What is provided (all the rest)

`js/main.js` (routing + animation loop), `js/ui.js` (control panel),
`js/render.js` (canvas primitives), `js/state.js` (config), `js/views/*`
(the drawing for each scene), `data/presets.json`, `index.html`, `css/`,
`tests/`. You do not need to touch any of it to learn the hardware.

## Layout

```
index.html
css/styles.css
js/
  main.js            routing, animation loop          PROVIDED
  ui.js              controls/presets wiring          PROVIDED
  render.js          canvas primitives                PROVIDED
  state.js           config + store                   PROVIDED
  scenes/            ---- SEAMS: yours to write ----
    cache.js         decodeAddress, selectVictim, cacheAccess
    patterns.js      access-pattern generators
    coherence.js     false sharing / ownership
    reduction.js     warp reduction
  views/             scene rendering                  PROVIDED
data/presets.json
tests/               node --test against the seams
```

## Deploy

It's a static site; pushing to GitHub Pages serves `index.html` directly.

## Concepts, in one paragraph each

- **Cache line.** Memory moves in fixed 64-byte blocks, not single bytes.
  Touch one byte and you get the whole line — that's spatial locality, and it's
  why a sequential walk sees one miss per line while a strided walk sees almost
  all misses.
- **Tag / index / offset.** An address splits into *offset* (byte within the
  line), *index* (which set), and *tag* (the rest, checked for a match). How many
  lines share a set is the associativity; too few and you get conflict misses.
- **False sharing.** Two threads write different variables that happen to sit in
  the same line. Coherence (a line can be Modified by only one core) then makes
  the line ping-pong between cores on every write. Pad the variables apart.
- **Warp reduction.** 32 lanes combine by a shuffle-down tree in `log₂ 32 = 5`
  steps instead of `31`, and with no long serial dependency chain.
