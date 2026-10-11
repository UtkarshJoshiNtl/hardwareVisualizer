#!/usr/bin/env python3
"""
results/plot.py — stride sweep for seam 01 (Compute -> Memory).

Runs the trigger and remedy Python kernels across a stride sweep and plots
ns/elem against stride. The expected shape (docs/theory/01-compute-to-memory.md
§4) is a sharp climb for the trigger once stride*4 > 64 bytes, while the remedy
stays flat.

Usage:  python3 results/plot.py
Output: results/stride_sweep.png   (+ a table on stdout)
"""
import importlib.util
import os
import sys
import time

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "common"))
from harness import alloc  # noqa: E402


def _load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _time_kernel(kernel, a, n, stride, reps=5):
    kernel(a, n, stride)  # warmup
    ts = []
    for _ in range(reps):
        t0 = time.perf_counter()
        kernel(a, n, stride)
        ts.append(time.perf_counter() - t0)
    return sorted(ts)[len(ts) // 2]


def main():
    n = 1 << 24  # 16M floats = 64 MiB > LLC
    strides = [1, 2, 4, 8, 16, 32, 64, 128]

    trig = _load(os.path.join(ROOT, "trigger", "python", "main.py"), "trig")
    rem = _load(os.path.join(ROOT, "remedy", "python", "main.py"), "rem")

    a = alloc(n)
    trig_ns, rem_ns = [], []
    print(f"{'stride':>7} {'B/line':>7} {'trigger ns/elem':>16} {'remedy ns/elem':>16}")
    for s in strides:
        elems = n // s
        tt = _time_kernel(trig.bad_kernel, a, n, s) * 1e9 / elems
        rt = _time_kernel(rem.good_kernel, a, n, s) * 1e9 / elems
        trig_ns.append(tt)
        rem_ns.append(rt)
        print(f"{s:>7} {min(s * 4, 64):>7} {tt:>16.2f} {rt:>16.2f}")

    try:
        import matplotlib

        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        print("\nmatplotlib not installed — table only.  pip install matplotlib")
        return

    fig, ax = plt.subplots(figsize=(7, 4.5))
    ax.plot(strides, trig_ns, "o-", label="trigger (bad pattern)")
    ax.plot(strides, rem_ns, "s-", label="remedy (fixed)")
    ax.axvline(16, ls="--", c="grey", lw=1)
    ax.text(16.5, max(trig_ns), " stride*4 = 64 B\n (one cache line)", va="top",
            fontsize=8, color="grey")
    ax.set_xscale("log", base=2)
    ax.set_xlabel("stride (elements)")
    ax.set_ylabel("ns per element")
    ax.set_title("Compute -> Memory: stride sweep (n = 16M floats)")
    ax.grid(True, which="both", alpha=0.3)
    ax.legend()
    out = os.path.join(ROOT, "results", "stride_sweep.png")
    fig.tight_layout()
    fig.savefig(out, dpi=130)
    print(f"\nwrote {out}")


if __name__ == "__main__":
    main()
