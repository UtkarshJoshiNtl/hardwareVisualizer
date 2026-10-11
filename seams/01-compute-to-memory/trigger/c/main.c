/*
 * trigger/c/main.c — seam 01 (Compute -> Memory): THE PATHOLOGY.
 *
 * Goal: write a kernel that deliberately provokes the seam — a bad access
 * pattern that leaves the hardware starved for bandwidth. See
 * docs/theory/01-compute-to-memory.md §5.
 *
 * The harness is provided. You write ONLY the function marked TODO.
 *
 * Build:  make trigger-c      Run:  make run-trigger  (or ./build/trigger-c N STRIDE)
 */
#include "../../common/harness.h"

/* ====================================================================
 * TODO (you): a deliberately bad access kernel.
 *
 * Suggested provocations (pick one, measure it, reproduce the plot):
 *   - walk the array with a large stride so each access pulls a new
 *     64-byte cache line but uses only 4 bytes
 *   - traverse a matrix column-major (loop order swapped)
 *   - pointer-chase to expose raw DRAM latency
 *
 * Return the sum of a[0], a[stride], a[2*stride], ... (n/stride elements).
 * Predicted shape: ns/elem climbs sharply once stride*4 > 64 bytes.
 * ==================================================================== */
static float bad_kernel(const float *a, long n, long stride) {
    (void)a;
    (void)n;
    (void)stride;
    return 0.0f; /* TODO */
}

int main(int argc, char **argv) {
    long n      = argc > 1 ? atol(argv[1]) : (1L << 24); /* 16M floats = 64 MiB */
    long stride = argc > 2 ? atol(argv[2]) : 16;         /* 16 floats = 64 bytes */

    seams_bench(bad_kernel, n, stride, "trigger");
    return 0;
}
