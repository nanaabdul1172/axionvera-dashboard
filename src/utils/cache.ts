/**
 * Scalable in-memory cache with TTL, invalidation, and stale-while-revalidate (SWR).
 *
 * - Entries expire after `ttl` ms; stale entries can still be served while a background
 *   revalidation runs when `swr` is enabled.
 * - Tags allow bulk invalidation of logically-related keys (e.g. all data for a wallet).
 * - The singleton `cache` instance is used by the SDK; tests instantiate their own `Cache`.
 */

export interface CacheOptions {
  /** Time-to-live in milliseconds before an entry is considered stale. Default: 30 000 */
  ttl?: number;
  /** When true, a stale entry is returned immediately while a background refresh runs. */
  swr?: boolean;
  /** Tags for group invalidation (e.g. ['wallet:G123', 'balances']). */
  tags?: string[];
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
}

export class Cache {
  private store = new Map<string, CacheEntry<unknown>>();
  private revalidating = new Set<string>();

  /** Returns the cached value, or `undefined` if missing/expired (and SWR is off). */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return undefined;
    if (Date.now() < entry.expiresAt) return entry.value;
    // Stale but not yet evicted – caller must check isFresh separately for SWR logic
    return undefined;
  }

  /** Returns the raw entry (including stale ones) for SWR use. */
  getEntry<T>(key: string): CacheEntry<T> | undefined {
    return this.store.get(key) as CacheEntry<T> | undefined;
  }

  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const ttl = options.ttl ?? 30_000;
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl,
      tags: options.tags ?? [],
    });
  }

  /** Returns true when the entry exists and has not expired. */
  isFresh(key: string): boolean {
    const entry = this.store.get(key);
    return !!entry && Date.now() < entry.expiresAt;
  }

  delete(key: string): void {
    this.store.delete(key);
    this.revalidating.delete(key);
  }

  /** Invalidate all entries whose tag list includes `tag`. */
  invalidateByTag(tag: string): void {
    for (const [key, entry] of this.store) {
      if (entry.tags.includes(tag)) {
        this.store.delete(key);
        this.revalidating.delete(key);
      }
    }
  }

  /** Remove all entries. */
  clear(): void {
    this.store.clear();
    this.revalidating.clear();
  }

  /**
   * Wraps an async factory with cache + optional stale-while-revalidate.
   *
   * Behaviour:
   * 1. Fresh entry  → return cached value immediately.
   * 2. Stale entry + swr:true → return stale value, schedule background refresh.
   * 3. No entry / swr:false  → await factory, populate cache, return result.
   */
  async getOrFetch<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T> {
    if (this.isFresh(key)) {
      return (this.store.get(key) as CacheEntry<T>).value;
    }

    const staleEntry = this.getEntry<T>(key);

    if (staleEntry && options.swr && !this.revalidating.has(key)) {
      // Serve stale immediately, revalidate in background
      this.revalidating.add(key);
      void factory()
        .then((value) => this.set(key, value, options))
        .catch(() => { /* background revalidation failures are silently swallowed */ })
        .finally(() => this.revalidating.delete(key));
      return staleEntry.value;
    }

    // Await fresh data
    const value = await factory();
    this.set(key, value, options);
    return value;
  }
}

/** Shared singleton used across the application. */
export const cache = new Cache();
