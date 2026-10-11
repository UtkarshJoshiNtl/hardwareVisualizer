# Seam template

Copy this for every seam. Keep every heading; delete the italic guidance once filled.

---

## <NN> — <Seam name>

**Category:** Architectural (data path) | Physical / operational (environment)
**Status:** ✅ Hands-on | 🟡 Emulated | ⚪ Theory
**Language(s):** C/C++ · Python · CUDA

### 1. The tearing
*One sentence. The observable symptom — what degrades, and how you notice it.*

### 2. Why it happens
*The mechanism. Latencies, bandwidths, contention, ordering, physics. No hand-waving.*

### 3. Mental model
*The one picture or rule of thumb a reader should keep.*

### 4. What to plot
*The exact measurement(s) and the **expected shape** of each curve — axes, units,
and what the shape proves. This is the falsifiable prediction.*

### 5. Trigger (you write)
*The smallest program that provokes the pathology.*
- `trigger/c/…` and/or `trigger/python/…`
- State the parameters that make it bite (size, stride, working set).
- Success = it reproduces the shape predicted in §4.

### 6. Diagnosis
*Tools and what to read.*
- Command(s) to run.
- Which counters / metrics matter.
- What the bad reading looks like vs the good one.
- Expected shape of the diagnostic output.

### 7. Remedy (you write)
*The bypass. One change at a time so the delta is attributable.*
- `remedy/c/`, `remedy/python/`, `remedy/cuda/` as relevant.
- Expected speedup / metric change, and **why**.

### 8. Reproduce
*Exact environment + build + run commands. Assumptions stated.*

### 9. Results
*Filled in after running: table of measured values + committed plots.*

| Variant | Metric | Value | Notes |
|---|---|---|---|
| trigger | | | |
| remedy  | | | |

### 10. References
*Papers, docs, talks — the source of the mechanism.*
