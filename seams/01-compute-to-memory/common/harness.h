/*
 * common/harness.h — shared measurement harness for seam 01 (Compute -> Memory).
 *
 * Header-only. Provides allocation, deterministic data, timing, and a
 * median-of-N benchmark driver with throughput reporting. The learner writes
 * only the kernel; this harness is provided so every seam measures the same way.
 *
 * Kernel contract:
 *     float kernel(const float *a, long n, long stride);
 * Returns the sum of a[0], a[stride], a[2*stride], ... (i.e. n/stride elements).
 *
 * Contacts:
 *     - a      : array of n floats (cache-line aligned)
 *     - stride : elements between accesses (1 == contiguous)
 */
#ifndef SEAMS_HARNESS_H
#define SEAMS_HARNESS_H

#define _POSIX_C_SOURCE 200809L

#include <stdio.h>
#include <stdlib.h>
#include <time.h>

typedef float (*seam_kernel_t)(const float *a, long n, long stride);

static inline double seams_now(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (double)ts.tv_sec + (double)ts.tv_nsec * 1e-9;
}

/* Aligned, deterministically-filled array. Values are in [0, 1). */
static inline float *seams_alloc(long n) {
    float *a = NULL;
    if (posix_memalign((void **)&a, 64, (size_t)n * sizeof(float)) != 0 || !a) {
        fprintf(stderr, "seams_alloc: failed for n=%ld\n", n);
        exit(1);
    }
    unsigned int s = 123456789u;
    for (long i = 0; i < n; ++i) {
        s = s * 1664525u + 1013904223u;
        a[i] = (float)(s >> 8) * (1.0f / 16777216.0f);
    }
    return a;
}

static inline int seams_cmp_double(const void *x, const void *y) {
    double a = *(const double *)x, b = *(const double *)y;
    return (a > b) - (a < b);
}

/*
 * Runs the kernel R times, discards a warmup, and reports the median time plus
 * two throughput figures that expose the seam:
 *   - GB/s     : effective bandwidth over the *useful* bytes touched
 *   - ns/elem  : time per accessed element  <-- this is the shape that degrades
 * The stride sweep plots ns/elem against stride.
 */
static inline void seams_bench(seam_kernel_t kern, long n, long stride,
                               const char *label) {
    float *a = seams_alloc(n);
    const int R = 7;
    double t[R];
    volatile float sink = 0.0f;

    sink = kern(a, n, stride); /* warmup */

    for (int r = 0; r < R; ++r) {
        double t0 = seams_now();
        float s = kern(a, n, stride);
        double t1 = seams_now();
        sink = sink + s;
        t[r] = t1 - t0;
    }
    qsort(t, R, sizeof(double), seams_cmp_double);

    double med = t[R / 2];
    long   elems = n / stride;
    double bytes = (double)elems * sizeof(float);
    double gbs   = bytes / med / 1e9;
    double nspe  = (med * 1e9) / (double)elems;

    printf("%-10s n=%-10ld stride=%-4ld  %8.3f ms  %7.2f GB/s  %6.2f ns/elem  (sink=%.1f)\n",
           label, n, stride, med * 1e3, gbs, nspe, (double)sink);

    free(a);
}

#endif /* SEAMS_HARNESS_H */
