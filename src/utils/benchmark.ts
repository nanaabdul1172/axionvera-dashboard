/**
 * @module utils/benchmark
 *
 * Performance benchmarking utilities for measuring and comparing performance.
 */

import { performanceMonitor, MetricType } from "./performance";

/**
 * Benchmark result.
 */
export interface BenchmarkResult {
  name: string;
  duration: number;
  iterations: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  medianDuration: number;
  ops: number; // Operations per second
}

/**
 * Run a benchmark with multiple iterations.
 */
export async function benchmark(
  name: string,
  fn: () => void | Promise<void>,
  iterations: number = 100
): Promise<BenchmarkResult> {
  const durations: number[] = [];

  console.log(`Running benchmark: ${name} (${iterations} iterations)...`);

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();

    if (fn.constructor.name === "AsyncFunction") {
      await fn();
    } else {
      fn();
    }

    const end = performance.now();
    durations.push(end - start);
  }

  const totalDuration = durations.reduce((sum, d) => sum + d, 0);
  const avgDuration = totalDuration / iterations;
  const sortedDurations = [...durations].sort((a, b) => a - b);
  const medianDuration =
    sortedDurations[Math.floor(sortedDurations.length / 2)];

  const result: BenchmarkResult = {
    name,
    duration: totalDuration,
    iterations,
    avgDuration,
    minDuration: Math.min(...durations),
    maxDuration: Math.max(...durations),
    medianDuration,
    ops: 1000 / avgDuration, // ops per second
  };

  console.log(`✅ ${name}:`);
  console.log(`   Avg: ${result.avgDuration.toFixed(2)}ms`);
  console.log(`   Min: ${result.minDuration.toFixed(2)}ms`);
  console.log(`   Max: ${result.maxDuration.toFixed(2)}ms`);
  console.log(`   Median: ${result.medianDuration.toFixed(2)}ms`);
  console.log(`   Ops/sec: ${result.ops.toFixed(0)}`);

  return result;
}

/**
 * Compare two implementations.
 */
export async function compare(
  name1: string,
  fn1: () => void | Promise<void>,
  name2: string,
  fn2: () => void | Promise<void>,
  iterations: number = 100
): Promise<{
  baseline: BenchmarkResult;
  optimized: BenchmarkResult;
  improvement: number;
  fasterBy: string;
}> {
  console.log("\n📊 Running comparison benchmark...\n");

  const baseline = await benchmark(name1, fn1, iterations);
  const optimized = await benchmark(name2, fn2, iterations);

  const improvement =
    ((baseline.avgDuration - optimized.avgDuration) / baseline.avgDuration) *
    100;

  const faster =
    improvement > 0
      ? `${name2} is ${improvement.toFixed(1)}% faster`
      : `${name1} is ${Math.abs(improvement).toFixed(1)}% faster`;

  console.log(`\n✨ Result: ${faster}\n`);

  return {
    baseline,
    optimized,
    improvement,
    fasterBy: faster,
  };
}

/**
 * Benchmark suite for running multiple benchmarks.
 */
export class BenchmarkSuite {
  private results: BenchmarkResult[] = [];
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Add a benchmark to the suite.
   */
  async add(
    name: string,
    fn: () => void | Promise<void>,
    iterations: number = 100
  ): Promise<this> {
    const result = await benchmark(name, fn, iterations);
    this.results.push(result);
    return this;
  }

  /**
   * Run all benchmarks and display results.
   */
  async run(): Promise<BenchmarkResult[]> {
    console.log(`\n🏃 Running benchmark suite: ${this.name}\n`);
    console.log("=".repeat(60));

    // Results already collected from add() calls
    this.displaySummary();

    return this.results;
  }

  /**
   * Display summary of all benchmarks.
   */
  private displaySummary(): void {
    console.log("\n📊 Summary:");
    console.log("=".repeat(60));

    // Sort by avg duration (fastest first)
    const sorted = [...this.results].sort(
      (a, b) => a.avgDuration - b.avgDuration
    );

    sorted.forEach((result, index) => {
      const rank = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
      console.log(`${rank} ${result.name}`);
      console.log(`   ${result.avgDuration.toFixed(2)}ms avg (${result.ops.toFixed(0)} ops/sec)`);
    });

    console.log("=".repeat(60));
  }

  /**
   * Get all results.
   */
  getResults(): BenchmarkResult[] {
    return this.results;
  }

  /**
   * Clear all results.
   */
  clear(): void {
    this.results = [];
  }
}

/**
 * Measure memory usage before and after a function.
 */
export async function measureMemory<T>(
  name: string,
  fn: () => T | Promise<T>
): Promise<{
  result: T;
  memoryBefore: number;
  memoryAfter: number;
  memoryDelta: number;
}> {
  if (typeof performance === "undefined" || !(performance as any).memory) {
    throw new Error("Memory measurement not available in this environment");
  }

  // Force garbage collection if available
  if (typeof (global as any).gc === "function") {
    (global as any).gc();
  }

  const memoryBefore = (performance as any).memory.usedJSHeapSize;
  const result = fn instanceof Promise ? await fn : fn();
  const memoryAfter = (performance as any).memory.usedJSHeapSize;
  const memoryDelta = memoryAfter - memoryBefore;

  console.log(`\n💾 Memory measurement: ${name}`);
  console.log(`   Before: ${(memoryBefore / 1024 / 1024).toFixed(2)}MB`);
  console.log(`   After: ${(memoryAfter / 1024 / 1024).toFixed(2)}MB`);
  console.log(`   Delta: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);

  return {
    result,
    memoryBefore,
    memoryAfter,
    memoryDelta,
  };
}

/**
 * Profile a function and log detailed metrics.
 */
export async function profile<T>(
  name: string,
  fn: () => T | Promise<T>
): Promise<T> {
  console.log(`\n🔍 Profiling: ${name}`);
  console.time(name);

  performanceMonitor.start(name, MetricType.API_CALL);

  try {
    const result = fn instanceof Promise ? await fn : fn();
    return result;
  } finally {
    const duration = performanceMonitor.end(name);

    console.timeEnd(name);

    if (duration) {
      console.log(`   Duration: ${duration.toFixed(2)}ms`);
    }
  }
}

/**
 * Benchmark data structure operations.
 */
export async function benchmarkDataStructure(
  operations: Array<{
    name: string;
    fn: () => void;
  }>,
  iterations: number = 1000
): Promise<BenchmarkResult[]> {
  console.log(`\n🗂️  Benchmarking data structure operations...\n`);

  const results: BenchmarkResult[] = [];

  for (const op of operations) {
    const result = await benchmark(op.name, op.fn, iterations);
    results.push(result);
  }

  return results;
}
