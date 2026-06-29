export type PipelineFetchContext = {
  signal?: AbortSignal;
  now: () => number;
};

export type PipelineCacheEntry<T> = {
  data: T;
  updatedAt: number;
  expiresAt: number;
};

export type PipelineSource<TInput> = (context: PipelineFetchContext) => Promise<TInput>;
export type PipelineTransformer<TInput, TOutput> = (input: TInput) => TOutput;
export type PipelineSubscriber<TOutput> = (entry: PipelineCacheEntry<TOutput>) => void;

export type PipelineCacheAdapter = {
  read<T>(key: string): PipelineCacheEntry<T> | null;
  write<T>(key: string, entry: PipelineCacheEntry<T>): void;
  delete(key: string): void;
};

export type DashboardPipelineOptions<TInput, TOutput> = {
  key: string;
  ttlMs: number;
  fetcher: PipelineSource<TInput>;
  transform?: PipelineTransformer<TInput, TOutput>;
  cache?: PipelineCacheAdapter;
  now?: () => number;
};

export type PipelineReadOptions = {
  force?: boolean;
  signal?: AbortSignal;
};

export type PipelineReadResult<T> = {
  data: T;
  source: "cache" | "network";
  updatedAt: number;
};

export class MemoryPipelineCache implements PipelineCacheAdapter {
  private readonly entries = new Map<string, PipelineCacheEntry<unknown>>();

  read<T>(key: string): PipelineCacheEntry<T> | null {
    return (this.entries.get(key) as PipelineCacheEntry<T> | undefined) ?? null;
  }

  write<T>(key: string, entry: PipelineCacheEntry<T>): void {
    this.entries.set(key, entry);
  }

  delete(key: string): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }
}

export class LocalStoragePipelineCache implements PipelineCacheAdapter {
  constructor(private readonly prefix = "axionvera:pipeline") {}

  read<T>(key: string): PipelineCacheEntry<T> | null {
    if (typeof window === "undefined") return null;

    try {
      const raw = window.localStorage.getItem(this.storageKey(key));
      return raw ? (JSON.parse(raw) as PipelineCacheEntry<T>) : null;
    } catch {
      return null;
    }
  }

  write<T>(key: string, entry: PipelineCacheEntry<T>): void {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(this.storageKey(key), JSON.stringify(entry));
    } catch {
      // Cache writes are best effort and should not break dashboard reads.
    }
  }

  delete(key: string): void {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.removeItem(this.storageKey(key));
    } catch {
      // Cache deletes are best effort.
    }
  }

  private storageKey(key: string): string {
    return `${this.prefix}:${key}`;
  }
}

export class DashboardDataPipeline<TInput, TOutput = TInput> {
  private readonly subscribers = new Set<PipelineSubscriber<TOutput>>();
  private inFlight: Promise<PipelineReadResult<TOutput>> | null = null;
  private readonly cache: PipelineCacheAdapter;
  private readonly now: () => number;
  private readonly transform: PipelineTransformer<TInput, TOutput>;

  constructor(private readonly options: DashboardPipelineOptions<TInput, TOutput>) {
    this.cache = options.cache ?? new MemoryPipelineCache();
    this.now = options.now ?? Date.now;
    this.transform = options.transform ?? ((input) => input as unknown as TOutput);
  }

  async read(readOptions: PipelineReadOptions = {}): Promise<PipelineReadResult<TOutput>> {
    const cached = this.cache.read<TOutput>(this.options.key);
    if (!readOptions.force && cached && cached.expiresAt > this.now()) {
      return { data: cached.data, source: "cache", updatedAt: cached.updatedAt };
    }

    if (this.inFlight) return this.inFlight;

    this.inFlight = this.fetchAndCache(readOptions.signal).finally(() => {
      this.inFlight = null;
    });

    return this.inFlight;
  }

  peek(): TOutput | null {
    return this.cache.read<TOutput>(this.options.key)?.data ?? null;
  }

  invalidate(): void {
    this.cache.delete(this.options.key);
  }

  subscribe(subscriber: PipelineSubscriber<TOutput>): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  private async fetchAndCache(signal?: AbortSignal): Promise<PipelineReadResult<TOutput>> {
    const raw = await this.options.fetcher({ signal, now: this.now });
    const data = this.transform(raw);
    const updatedAt = this.now();
    const entry: PipelineCacheEntry<TOutput> = {
      data,
      updatedAt,
      expiresAt: updatedAt + this.options.ttlMs,
    };

    this.cache.write(this.options.key, entry);
    this.subscribers.forEach((subscriber) => subscriber(entry));

    return { data, source: "network", updatedAt };
  }
}

export function normalizeArrayById<T extends Record<string, unknown>, TId extends keyof T>(
  records: T[],
  idKey: TId,
): Record<string, T> {
  return records.reduce<Record<string, T>>((entities, record) => {
    const id = String(record[idKey]);
    entities[id] = { ...record };
    return entities;
  }, {});
}

export const defaultDashboardPipelineCache = new LocalStoragePipelineCache();
