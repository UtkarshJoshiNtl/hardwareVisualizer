# seam 01 — Compute -> Memory
#
# Build the C trigger/remedy and the CUDA remedy, run benchmarks, profile.
# The learner fills in the TODO kernels; this Makefile is scaffolding.

CC      ?= gcc
NVCC    ?= nvcc
CFLAGS  ?= -O2 -march=native -Wall -Wextra -Icommon
NVFLAGS ?= -O2 -arch=native

N       ?= 16777216
STRIDE  ?= 16
BUILD   := build

.PHONY: all trigger-c remedy-c remedy-cuda run-trigger run-remedy \
        run-py-trigger run-py-remedy cachegrind plot clean

all: trigger-c remedy-c remedy-cuda

$(BUILD):
	mkdir -p $(BUILD)

trigger-c: trigger/c/main.c common/harness.h | $(BUILD)
	$(CC) $(CFLAGS) -o $(BUILD)/$@ trigger/c/main.c -lm

remedy-c: remedy/c/main.c common/harness.h | $(BUILD)
	$(CC) $(CFLAGS) -o $(BUILD)/$@ remedy/c/main.c -lm

# Use  -arch=sm_86  if  -arch=native  is not supported by your nvcc.
remedy-cuda: remedy/cuda/main.cu | $(BUILD)
	$(NVCC) $(NVFLAGS) -o $(BUILD)/$@ remedy/cuda/main.cu

run-trigger: trigger-c
	./$(BUILD)/trigger-c $(N) $(STRIDE)

run-remedy: remedy-c
	./$(BUILD)/remedy-c $(N) $(STRIDE)

run-py-trigger:
	python3 trigger/python/main.py $(N) $(STRIDE)

run-py-remedy:
	python3 remedy/python/main.py $(N) $(STRIDE)

cachegrind: trigger-c
	valgrind --tool=cachegrind --cache-sim=yes ./$(BUILD)/trigger-c $(N) $(STRIDE)

plot:
	python3 results/plot.py

clean:
	rm -rf $(BUILD)
