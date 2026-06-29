import type { QueryRecord, QueryResult, QuerySpec } from './types';

export interface QueryCacheOptions {
  maxEntries?: number;
}

const DEFAULT_MAX_ENTRIES = 100;

export class QueryCache<T extends QueryRecord = QueryRecord> {
  private readonly maxEntries: number;
  private readonly entries = new Map<string, QueryResult<T>>();

  constructor(options: QueryCacheOptions = {}) {
    this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
  }

  get(key: string): QueryResult<T> | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    this.entries.delete(key);
    this.entries.set(key, entry);
    return { ...entry, cacheHit: true };
  }

  set(key: string, value: QueryResult<T>): void {
    if (this.entries.has(key)) this.entries.delete(key);
    this.entries.set(key, { ...value, cacheHit: false });
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}

export function createQueryKey<T extends QueryRecord>(data: readonly T[], query: QuerySpec<T>): string {
  return stableStringify({ dataVersion: fingerprintData(data), query });
}

function fingerprintData<T extends QueryRecord>(data: readonly T[]): string {
  return `${data.length}:${stableStringify(data)}`;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}
