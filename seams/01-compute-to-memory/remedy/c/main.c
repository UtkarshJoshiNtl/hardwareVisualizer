/*
 * remedy/c/main.c — seam 01 (Compute -> Memory): THE BYPASS.
 *
 * Goal: fix the pathology with ONE attributable change (loop interchange,
 * blocking, SoA, prefetch, non-temporal stores). See
 * docs/theory/01-compute-to-memory.md §7.
 *
 * Start from the same harness; change only the function marked TODO.
 *
 * Build:  make remedy-c   Run:  make run-remedy  (or ./build/remedy-c N STRIDE)
 */
#include "../../common/harness.h"

/* ====================================================================
 * TODO (you): the fixed access kernel.
 *
 * Same contract as the trigger, but using all 64 bytes of every line and
 * keeping many misses in flight. Try loop interchange / cache blocking /
 * software prefetch — ONE change at a time so the delta is attributable.
 *
 * Return the sum of a[0], a[stride], a[2*stride], ... (n/stride elements).
 * Predicted shape: ns/elem stays low and flat across strides.
 * ==================================================================== */
static float good_kernel(const float *a, long n, long stride) {
    (void)a;
    (void)n;
    (void)stride;
    return 0.0f; /* TODO */
}

int main(int argc, char **argv) {
    long n      = argc > 1 ? atol(argv[1]) : (1L << 24);
    long stride = argc > 2 ? atol(argv[2]) : 16;

    seams_bench(good_kernel, n, stride, "remedy");
    return 0;
}
