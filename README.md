# Hardware-Aware Visualizer

An interactive visualizer for the things that actually decide performance:
cache lines, memory access patterns, and GPU reductions. Meant to be a real
educational tool you poke at, not a generic dashboard.

## Purpose

Make the memory hierarchy tangible. You should be able to *see* why a strided
walk misses cache, why adjacent writes from two threads false-share, and how a
reduction folds a warp.

## Planned scenes

- **Cache lines** — watch a memory array get pulled in 64-byte lines, hit/miss counters.
- **Access patterns** — sequential vs. strided vs. blocked traversal, side by side.
- **False sharing** — two threads touching neighbors in one line, ping-ponging it.
- **GPU reduction** — sequential vs. tree/shuffle reduction of a warp, step by step.

Planned form: an interactive terminal UI (Python, curses) so it runs anywhere.
Status: intent only. Implementation to follow.
