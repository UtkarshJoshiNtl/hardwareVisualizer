#!/usr/bin/env python3
"""
trigger/python/main.py — seam 01 (Compute -> Memory): THE PATHOLOGY.

NumPy variant. The harness is provided; you write ONLY the function marked TODO.

Run:  python3 trigger/python/main.py [N] [STRIDE]
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "common"))
import numpy as np  # noqa: E402

from harness import bench  # noqa: E402


# ====================================================================
# TODO (you): a deliberately bad access kernel.
#
# Provocations to try:
#   a[::stride].sum()          -> strided gather (poor line utilisation)
#   an explicit Python loop    -> shows the interpreter overhead too
#   column-major over a 2-D array
#
# Return the sum of a[0], a[stride], a[2*stride], ... (n // stride elements).
# ====================================================================
def bad_kernel(a: np.ndarray, n: int, stride: int) -> float:
    return 0.0  # TODO


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else (1 << 24)
    stride = int(sys.argv[2]) if len(sys.argv) > 2 else 16
    bench(bad_kernel, n, stride, "trigger")
