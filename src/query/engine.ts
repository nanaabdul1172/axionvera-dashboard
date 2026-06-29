import { createQueryKey, QueryCache } from './cache';
import type { QueryAggregation, QueryFilter, QueryPrimitive, QueryRecord, QueryResult, QuerySpec, QuerySort } from './types';

export interface QueryEngineOptions {
  cacheSize?: number;
}

export class QueryEngine<T extends QueryRecord = QueryRecord> {
  private readonly cache: QueryCache<T>;

  constructor(options: QueryEngineOptions = {}) {
    this.cache = new QueryCache<T>({ maxEntries: options.cacheSize });
  }

  execute(data: readonly T[], query: QuerySpec<T> = {}): QueryResult<T> {
    const cacheKey = createQueryKey(data, query);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const filteredRows = applyFilters(data, query.filters ?? []);
    const sortedRows = applySorting(filteredRows, query.sort ?? []);
    const aggregations = applyAggregations(filteredRows, query.aggregations ?? []);
    const { rows, page, pageSize } = applyPagination(sortedRows, query.pagination);
    const selectedRows = applySelect(rows, query.select);

    const result: QueryResult<T> = {
      rows: selectedRows,
      total: filteredRows.length,
      page,
      pageSize,
      aggregations,
      cacheHit: false,
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  clearCache(): void {
    this.cache.clear();
  }

  get cacheSize(): number {
    return this.cache.size;
  }
}

export function queryData<T extends QueryRecord>(data: readonly T[], query: QuerySpec<T> = {}, engine = new QueryEngine<T>()): QueryResult<T> {
  return engine.execute(data, query);
}

export function applyFilters<T extends QueryRecord>(data: readonly T[], filters: QueryFilter<T>[]): T[] {
  if (filters.length === 0) return [...data];
  return data.filter((row) => filters.every((filter) => matchesFilter(row, filter)));
}

function matchesFilter<T extends QueryRecord>(row: T, filter: QueryFilter<T>): boolean {
  const actual = getValue(row, String(filter.field));
  const expected = filter.value;

  switch (filter.op) {
    case 'eq': return compareValues(actual, expected) === 0;
    case 'neq': return compareValues(actual, expected) !== 0;
    case 'gt': return compareValues(actual, expected) > 0;
    case 'gte': return compareValues(actual, expected) >= 0;
    case 'lt': return compareValues(actual, expected) < 0;
    case 'lte': return compareValues(actual, expected) <= 0;
    case 'in': return Array.isArray(expected) && expected.some((item) => compareValues(actual, item) === 0);
    case 'nin': return Array.isArray(expected) && expected.every((item) => compareValues(actual, item) !== 0);
    case 'contains': return String(actual ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase());
    case 'startsWith': return String(actual ?? '').toLowerCase().startsWith(String(expected ?? '').toLowerCase());
    case 'endsWith': return String(actual ?? '').toLowerCase().endsWith(String(expected ?? '').toLowerCase());
    case 'exists': return Boolean(expected) ? actual !== undefined && actual !== null : actual === undefined || actual === null;
    default: return false;
  }
}

export function applySorting<T extends QueryRecord>(data: readonly T[], sort: QuerySort<T>[]): T[] {
  if (sort.length === 0) return [...data];
  return [...data].sort((left, right) => {
    for (const rule of sort) {
      const direction = rule.direction === 'desc' ? -1 : 1;
      const comparison = compareValues(getValue(left, String(rule.field)), getValue(right, String(rule.field)));
      if (comparison !== 0) return comparison * direction;
    }
    return 0;
  });
}

function applyPagination<T extends QueryRecord>(data: readonly T[], pagination: QuerySpec<T>['pagination']): { rows: T[]; page?: number; pageSize?: number } {
  if (!pagination) return { rows: [...data] };
  const pageSize = pagination.pageSize ?? pagination.limit ?? data.length;
  const offset = pagination.offset ?? (((pagination.page ?? 1) - 1) * pageSize);
  return { rows: data.slice(Math.max(0, offset), Math.max(0, offset) + Math.max(0, pageSize)), page: pagination.page, pageSize };
}

function applySelect<T extends QueryRecord>(data: readonly T[], select?: Array<keyof T | string>): Partial<T>[] {
  if (!select || select.length === 0) return [...data];
  return data.map((row) => Object.fromEntries(select.map((field) => [field, getValue(row, String(field))])) as Partial<T>);
}

export function applyAggregations<T extends QueryRecord>(data: readonly T[], aggregations: QueryAggregation<T>[]): Record<string, number | string[] | null> {
  return Object.fromEntries(aggregations.map((aggregation) => [aggregation.as ?? aggregationName(aggregation), aggregate(data, aggregation)]));
}

function aggregate<T extends QueryRecord>(data: readonly T[], aggregation: QueryAggregation<T>): number | string[] | null {
  if (aggregation.op === 'count') return data.length;
  const values = data.map((row) => getValue(row, String(aggregation.field))).filter((value): value is QueryPrimitive => value !== undefined && value !== null);
  if (aggregation.op === 'distinct') return Array.from(new Set(values.map(String))).sort();
  const numbers = values.map(Number).filter(Number.isFinite);
  if (numbers.length === 0) return null;
  if (aggregation.op === 'sum') return numbers.reduce((sum, value) => sum + value, 0);
  if (aggregation.op === 'avg') return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
  if (aggregation.op === 'min') return Math.min(...numbers);
  if (aggregation.op === 'max') return Math.max(...numbers);
  return null;
}

function aggregationName<T extends QueryRecord>(aggregation: QueryAggregation<T>): string {
  return aggregation.field ? `${aggregation.op}_${String(aggregation.field)}` : aggregation.op;
}

function getValue(row: QueryRecord, path: string): unknown {
  return path.split('.').reduce<unknown>((value, segment) => (value && typeof value === 'object' ? (value as QueryRecord)[segment] : undefined), row);
}

function compareValues(left: unknown, right: unknown): number {
  const normalizedLeft = normalizeComparable(left);
  const normalizedRight = normalizeComparable(right);
  if (normalizedLeft === normalizedRight) return 0;
  if (normalizedLeft === undefined || normalizedLeft === null) return -1;
  if (normalizedRight === undefined || normalizedRight === null) return 1;
  return normalizedLeft > normalizedRight ? 1 : -1;
}

function normalizeComparable(value: unknown): string | number | boolean | null | undefined {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const date = Date.parse(value);
    return Number.isNaN(date) ? value.toLowerCase() : date;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || value === null || value === undefined) return value;
  return String(value).toLowerCase();
}
