# 01 — Compute → Memory

**Category:** Architectural (data path) · **Status:** ✅ Hands-on
**Language(s):** C/C++ · Python · CUDA

## 1. The tearing
A kernel with trivial arithmetic runs orders of magnitude below peak because it
spends its time stalled on memory it cannot reach fast enough — and changing
nothing but the *access pattern* moves it from ~10% to ~90% of bandwidth.

## 2. Why it happens
- **The memory wall.** CPU clocks grew ~1000× over decades; DRAM latency barely
  moved. A DRAM access costs ~200–400 cycles; L1 ~4–5, L2 ~12–20, LLC ~40–70.
  Arithmetic is cheap; the *wait* is the cost.
- **Cache lines.** Every miss moves a full **64-byte line**, even if you touch 8
  bytes of it. Data you never use still costs bandwidth.
- **Three miss types.** *Compulsory* (first touch — unavoidable), *capacity*
  (working set exceeds the cache), *conflict* (multiple addresses map to one set).
  Only the last two are yours to fix.
- **Latency hiding.** Independent loads can be in flight at once (memory-level
  parallelism). Dependent loads — pointer chasing — serialize and expose the full
  latency each step.
- **Arithmetic intensity.** The real currency is *bytes moved per flop*, compared
  against the machine's bandwidth-to-flop ratio. That comparison is the roofline.

## 3. Mental model
> **You do not read data; you read cache lines.**
> Your job is to use all 64 bytes of every line, and to keep many misses in
> flight at once.

## 4. What to plot (expected shape)
The **shape** is the prediction. If you cannot reproduce it, you do not yet
understand the seam.

1. **Memory mountain** — achieved GB/s vs working-set size, one curve per stride.
   *Expected:* flat plateaus that fall in **cliffs at each cache level**
   (L1 → L2 → LLC → DRAM), one cliff per level.
2. **Stride sweep** — time vs stride for a fixed array.
   *Expected:* a sharp degrade. At stride `s` bytes you use `8/s` of each line,
   so a scalar-float stride of 8 bytes → ~1/8 of peak throughput. The plateau
   *is* the evidence.
3. **Traversal order** — row-major vs column-major on a large matrix.
   *Expected:* column-major several× slower; under cachegrind the miss ratio
   inverts (bad case has high `D1mr`/`DLmr`).
4. **Roofline position** — achieved GFLOP/s vs arithmetic intensity.
   *Expected:* the naive kernel pinned on the slanted bandwidth roof; the tiled
   kernel lifted upward toward the flat compute roof.

## 5. Trigger (you write)
Candidate provocations, smallest first:
- Column-major traversal of an `N×N` matrix where `N*N*4` bytes ≫ LLC.
- Pointer chase over a shuffled array (defeats prefetch; exposes raw latency).
- Stride sweep from 1 to 64 bytes.

Deliverable: the trigger reproduces at least plot (2) or (3) from §4.

## 6. Diagnosis
- `valgrind --tool=cachegrind ./trigger` → read `D1mr` and `DLLmr` (miss rates).
- `cachegrind --cache-sim=yes --branch-sim=yes` for line-level miss/branch detail.
- GPU: `ncu --set full ./trigger` → global-load/store efficiency, DRAM throughput,
  sectors per request.
- Timing: `hyperfine --warmup 3` (median of N) — never trust a single run.
- **Bad reading:** high `D1mr`, low achieved GB/s, global-load efficiency well
  under 100%, or DRAM throughput plateauing far below spec.

## 7. Remedy (you write)
Change **one thing at a time** so the delta is attributable:
- **Loop interchange** — traverse row-major; often a one-line fix.
- **Cache blocking / tiling** — process `B×B` tiles that fit in a cache level.
- **SoA instead of AoS** — for strided struct access.
- **Software prefetch** — issue loads ahead of use for dependent chains.
- **Non-temporal stores** — for write-only streaming data that has no reuse.
- **CUDA:** coalesce (consecutive threads → consecutive addresses); stage reuse
  through shared memory.

## 8. Reproduce
See the seam's [`README.md`](../seams/01-compute-to-memory/README.md) and `Makefile`.
Build with `make`; run under cachegrind and `hyperfine`.

## 9. Results
*(filled in after running — see `seams/01-compute-to-memory/results/`)*

## 10. References
- *Computer Systems: A Programmer's Perspective*, §6 — The Memory Hierarchy.
- Ulrich Drepper, *What Every Programmer Should Know About Memory* (2007).
- Williams, Waterman, Patterson, *Roofline: An Insightful Visual Performance
  Model* (CACM 2009).
- CS:APP Cache Lab (`csim.c`, `trans.c`) — the canonical exercise.
