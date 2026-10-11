/*
 * remedy/cuda/main.cu — seam 01 (Compute -> Memory): THE GPU BYPASS.
 *
 * Goal: show the same seam on the GPU, where it is called *coalescing* and
 * *shared-memory reuse*. Consecutive threads must read consecutive addresses;
 * a strided pattern wastes DRAM transactions (32-byte sectors).
 *
 * The host harness (alloc, timing via CUDA events, verification) is provided.
 * You write ONLY the kernel marked TODO.
 *
 * Build:  make remedy-cuda     Run:  ./build/remedy-cuda [N] [STRIDE]
 * Note: this GPU has 4 GB; keep N*4 bytes well under that (default 16M = 64 MiB).
 */
#include <cuda_runtime.h>
#include <cstdio>
#include <cstdlib>

#define CUDA_CHECK(call)                                                    \
    do {                                                                    \
        cudaError_t e_ = (call);                                            \
        if (e_ != cudaSuccess) {                                            \
            fprintf(stderr, "CUDA error %s:%d: %s\n", __FILE__, __LINE__,   \
                    cudaGetErrorString(e_));                                \
            exit(1);                                                        \
        }                                                                   \
    } while (0)

/* ====================================================================
 * TODO (you): the fixed GPU kernel.
 *
 * Sum a[0], a[stride], a[2*stride], ... (n/stride elements) into out[0].
 * Coalesced version: let the stride loop be the *inner* loop over
 * consecutive threads, i.e. thread i handles element i, i+blockDim, ...
 * and separately iterate the stride, OR restructure so a warp reads a
 * contiguous 128-byte span. Use block reduction (shared memory) for the
 * final sum. One change at a time; compare against a naive strided kernel.
 * ==================================================================== */
__global__ void good_kernel(const float *a, long n, long stride, float *out) {
    (void)a;
    (void)n;
    (void)stride;
    (void)out;
    /* TODO */
}

int main(int argc, char **argv) {
    long n      = argc > 1 ? atol(argv[1]) : (1L << 24);
    long stride = argc > 2 ? atol(argv[2]) : 16;

    float *h_a = (float *)malloc((size_t)n * sizeof(float));
    if (!h_a) { fprintf(stderr, "host alloc failed\n"); return 1; }
    unsigned int s = 123456789u;
    for (long i = 0; i < n; ++i) {
        s = s * 1664525u + 1013904223u;
        h_a[i] = (float)(s >> 8) * (1.0f / 16777216.0f);
    }

    float *d_a = NULL, *d_out = NULL;
    CUDA_CHECK(cudaMalloc(&d_a, (size_t)n * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&d_out, sizeof(float)));
    CUDA_CHECK(cudaMemcpy(d_a, h_a, (size_t)n * sizeof(float), cudaMemcpyHostToDevice));

    const int threads = 256;
    const int blocks  = 1024;

    good_kernel<<<blocks, threads>>>(d_a, n, stride, d_out); /* warmup */
    CUDA_CHECK(cudaDeviceSynchronize());

    cudaEvent_t t0, t1;
    CUDA_CHECK(cudaEventCreate(&t0));
    CUDA_CHECK(cudaEventCreate(&t1));
    const int R = 7;
    float ms[R];
    for (int r = 0; r < R; ++r) {
        CUDA_CHECK(cudaEventRecord(t0));
        good_kernel<<<blocks, threads>>>(d_a, n, stride, d_out);
        CUDA_CHECK(cudaEventRecord(t1));
        CUDA_CHECK(cudaEventSynchronize(t1));
        CUDA_CHECK(cudaEventElapsedTime(&ms[r], t0, t1));
    }
    /* median */
    for (int i = 0; i < R; ++i)
        for (int j = i + 1; j < R; ++j)
            if (ms[j] < ms[i]) { float tmp = ms[i]; ms[i] = ms[j]; ms[j] = tmp; }
    double med = ms[R / 2];

    float out = 0.0f;
    CUDA_CHECK(cudaMemcpy(&out, d_out, sizeof(float), cudaMemcpyDeviceToHost));

    long elems = n / stride;
    double gbs = ((double)elems * sizeof(float)) / (med * 1e-3) / 1e9;
    double nspe = (med * 1e6) / (double)elems;

    printf("%-10s n=%-10ld stride=%-4ld  %8.3f ms  %7.2f GB/s  %6.2f ns/elem  (sink=%.1f)\n",
           "remedy", n, stride, med, gbs, nspe, (double)out);

    cudaFree(d_a);
    cudaFree(d_out);
    free(h_a);
    return 0;
}
