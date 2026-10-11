# 01 — Compute → Memory

**Category:** Architectural (data path)
**Status:** ✅ Hands-on
**Language(s):** C/C++ · Python · CUDA

Theory, mechanism, and plot specifications: [`docs/theory/01-compute-to-memory.md`](../../docs/theory/01-compute-to-memory.md).

This page is the operational side: what to build, run, and measure.

---

## 1. The tearing
A memory-bound kernel with trivial arithmetic runs far below peak because it
stalls waiting on RAM — and the access pattern, not the amount of work, decides
the outcome.

## 2. Why it happens
See theory §2. Short version: the memory wall, 64-byte cache lines, three miss
types, memory-level parallelism, and arithmetic intensity.

## 3. Mental model
> You do not read data; you read cache lines.

## 4. What to plot
- Stride sweep: time vs stride → sharp degrade past a threshold.
- Traversal order: row-major vs column-major → several× gap; miss ratio inverts.
- (optional) Memory mountain and roofline.

## 5. Trigger (you write)
Fill the marked `TODO` in each file. The harness is provided; **only the kernel is yours**.

| Variant | Path | What you write |
|---|---|---|
| C | [`trigger/c/main.c`](trigger/c/main.c) | the deliberately-bad access kernel |
| Python | [`trigger/python/main.py`](trigger/python/main.py) | same, in NumPy |

Success: `make run-trigger` reproduces the predicted degrade.

## 6. Diagnosis
```
valgrind --tool=cachegrind --cache-sim=yes ./build/trigger-c 1<<24 8
hyperfine --warmup 3 './build/trigger-c 16777216 1' './build/remedy-c 16777216 1'
```
Read `D1mr`, `DLLmr`, and achieved GB/s. Bad case: high miss rates, low GB/s.

## 7. Remedy (you write)
Change one thing at a time. Fill the `TODO` in each:

| Variant | Path | The fix |
|---|---|---|
| C | [`remedy/c/main.c`](remedy/c/main.c) | loop interchange / blocking |
| Python | [`remedy/python/main.py`](remedy/python/main.py) | vectorized / blocked |
| CUDA | [`remedy/cuda/main.cu`](remedy/cuda/main.cu) | coalesced loads + shared memory |

## 8. Reproduce
```bash
cd seams/01-compute-to-memory
make            # builds C + CUDA variants
make run-trigger
make run-remedy
make cachegrind  # CPU miss profile of the trigger
```

Environment: see the top-level [`README.md`](../../README.md). `perf` is
unavailable on the reference machine — use `cachegrind`.

## 9. Results
*(filled in after running; committed plots live in [`results/`](results/))*

| Variant | Metric | Value | Notes |
|---|---|---|---|
| trigger | | | |
| remedy  | | | |

## 10. References
See theory §10.
