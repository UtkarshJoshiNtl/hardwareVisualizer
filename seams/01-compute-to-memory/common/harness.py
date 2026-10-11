"""
common/harness.py — shared measurement harness for seam 01 (Compute -> Memory).

Mirrors common/harness.h so the C and Python variants measure identically.
The learner writes only the kernel function.

Kernel contract:
    def kernel(a: np.ndarray, n: int, stride: int) -> float
    Returns the sum of a[0], a[stride], a[2*stride], ... (n // stride elements).
"""

import time

import numpy as np


def alloc(n: int) -> np.ndarray:
    """Deterministic, cache-line-aligned array of n float32 in [0, 1)."""
    rng = np.random.default_rng(123456789)
    return rng.random(n, dtype=np.float32)


def _median(xs):
    xs = sorted(xs)
    return xs[len(xs) // 2]


def bench(kernel, n: int, stride: int, label: str) -> None:
    a = alloc(n)
    R = 7

    sink = kernel(a, n, stride)  # warmup
    ts = []
    for _ in range(R):
        t0 = time.perf_counter()
        sink = kernel(a, n, stride)
        ts.append(time.perf_counter() - t0)

    med = _median(ts)
    elems = n // stride
    gbs = (elems * 4) / med / 1e9
    nspe = (med * 1e9) / elems

    print(
        f"{label:<10} n={n:<10d} stride={stride:<4d}  "
        f"{med * 1e3:8.3f} ms  {gbs:7.2f} GB/s  {nspe:6.2f} ns/elem  (sink={sink:.1f})"
    )
