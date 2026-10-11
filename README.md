# seams

> The friction points of HPC. Break them, measure them, bypass them.

HPC performance rarely fails inside the algorithm. It fails at the **seams** —
the boundaries where compute meets memory, node meets network, compute meets
storage, hardware meets software, and where the physical realities of energy,
failure, and placement decide the outcome.

This repository is a catalog of those seams. For each one it gives the **theory**
of why it tears, a **plot** that exposes it, a **trigger** — the smallest program
that provokes the pathology — and the **remedy** that bypasses it.

---

## What is a seam?

A *seam* is a boundary where two parts of a system meet — a place you can
substitute, observe, or cut. Under load, it is also where performance is lost.
Seams are where the interesting failures live.

This repo is organized by **failure mode**, not by technique. Each entry teaches
the pathology first, then the fix. Knowing where the seams are is how experienced
HPC engineers reason about a system they have never seen.

---

## Philosophy

- **Failure-first.** Meet the slow version before the fast one — the delta teaches.
- **Measure, or it did not happen.** Every seam ships a plot with an expected shape.
- **You write the trigger.** Reproducing a pathology proves you understand its mechanism.

---

## The Seams list
| Seam | What screws you up |
|---|---|
| **Inter-Node Network** | Slow network fabrics slowing down MPI |
| **Compute → Storage** | Parallel I/O choking during checkpoints |
| **Hardware → Software** | Inefficient compilers or unoptimized GPU kernels |
| **Synchronization / Coherence** | False sharing, lock contention, cache traffic |
| **Scaling / Stragglers** | One slow rank stalls everyone at the barrier |
| **Host ↔ Accelerator** | Naive copies and un-overlapped transfers |
| **Numerical Reproducibility** | Reduction order changes the last bits |
| **Energy & Thermal** | Throttling due to power limits or heat |
| **Resiliency & Fault** | Wasted time restarting jobs from dead nodes |
| **Orchestration / Topology** | Bad job placement across the physical cluster |

---

## Status legend

| Mark | Meaning |
|---|---|
| ✅ **Hands-on** | Runnable on a single machine with real hardware effects |
| 🟡 **Emulated** | Friction reproduced by deliberate emulation (`tc netem`, `fio`, cgroups/powercap, container kills, affinity). Clearly labeled as emulated. |
| ⚪ **Theory** | Mechanism and diagnosis written; no faithful local reproduction |

---

## Per-seam template

Every seam follows the same structure — see [`docs/seam-template.md`](docs/seam-template.md).

1. **The tearing** — the symptom, in one sentence.
2. **Why it happens** — the mechanism.
3. **Mental model** — how to reason about it.
4. **What to plot** — the measurement and its expected shape.
5. **Trigger** — the minimal program that provokes it.
6. **Diagnosis** — tools, and what to read.
7. **Remedy** — the bypass, and the expected delta.
8. **Reproduce** — environment and commands.
9. **Results** — measured numbers (filled in after running).
10. **References**.

**Division of labour:** the prose, theory, plot specifications, diagnostic
cookbook, and references are written for the repo. The `trigger/`, `remedy/`,
build files, and measurements in `results/` are written by hand — reproducing the
pathology is the point.

---

## Repository layout

```
seams/
├── README.md
├── docs/
│   ├── seam-template.md
│   └── theory/                     # mechanisms + plot specs (prose)
│       └── 01-compute-to-memory.md
├── seams/
│   └── 01-compute-to-memory/
│       ├── README.md               # the seam write-up (filled template)
│       ├── common/                 # shared measurement harness
│       ├── trigger/                # the pathology
│       │   ├── c/
│       │   └── python/
│       ├── remedy/                 # the bypass
│       │   ├── c/
│       │   ├── python/
│       │   └── cuda/
│       ├── Makefile
│       └── results/                # measured numbers + plots
└── LICENSE
```

---

## Environment (reference machine)

| | |
|---|---|
| CPU | AMD Ryzen 5 7535HS — 6c/12t, AVX2 + FMA, no AVX-512 |
| GPU | NVIDIA RTX 2050 — Ampere, CC 8.6, 4 GB |
| Toolchain | g++ 14, clang++ 19, nvcc, CMake 3.31, Ninja, Python 3.13 |
| CPU counters | `perf` unavailable → use `cachegrind` (`valgrind --tool=cachegrind`) |
| GPU counters | `ncu` (Nsight Compute), `compute-sanitizer` |
| Emulation | `tc netem`, `fio`/IOR, cgroups + `powercap`, container kill, `taskset` |

Numbers are reported as **methods + relative** measurements so the catalog does
not rot when hardware changes.

---

## License

TBD.
