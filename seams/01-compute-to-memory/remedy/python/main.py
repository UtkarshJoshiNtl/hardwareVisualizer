#!/usr/bin/env python3
"""
remedy/python/main.py — seam 01 (Compute -> Memory): THE BYPASS.

NumPy variant. Same harness; change only the function marked TODO. Prefer
contiguous, vectorised operations (e.g. reshape + sum along the used axis).

Run:  python3 remedy/python/main.py [N] [STRIDE]
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "common"))
import numpy as np  # noqa: E402

from harness import bench  # noqa: E402


# ====================================================================
# TODO (you): the fixed access kernel.
#
# Return the sum of a[0], a[stride], a[2*stride], ... (n // stride elements),
# but without a strided gather. Hint: reshape to (n // stride, stride) and
# sum the first column — contiguous access, one cache line per element.
# ====================================================================
def good_kernel(a: np.ndarray, n: int, stride: int) -> float:
    return 0.0  # TODO


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else (1 << 24)
    stride = int(sys.argv[2]) if len(sys.argv) > 2 else 16
    bench(good_kernel, n, stride, "remedy")
