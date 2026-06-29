export type QueryPrimitive = string | number | boolean | Date | null | undefined;
export type QueryRecord = Record<string, unknown>;

export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'exists';

export interface QueryFilter<T extends QueryRecord = QueryRecord> {
  field: keyof T | string;
  op: FilterOperator;
  value?: QueryPrimitive | QueryPrimitive[];
}

export interface QuerySort<T extends QueryRecord = QueryRecord> {
  field: keyof T | string;
  direction?: 'asc' | 'desc';
}

export interface QueryPagination {
  page?: number;
  pageSize?: number;
  offset?: number;
  limit?: number;
}

export type AggregationOperator = 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct';

export interface QueryAggregation<T extends QueryRecord = QueryRecord> {
  op: AggregationOperator;
  field?: keyof T | string;
  as?: string;
}

export interface QuerySpec<T extends QueryRecord = QueryRecord> {
  filters?: QueryFilter<T>[];
  sort?: QuerySort<T>[];
  pagination?: QueryPagination;
  aggregations?: QueryAggregation<T>[];
  select?: Array<keyof T | string>;
}

export interface QueryResult<T extends QueryRecord = QueryRecord> {
  rows: Partial<T>[];
  total: number;
  page?: number;
  pageSize?: number;
  aggregations: Record<string, number | string[] | null>;
  cacheHit: boolean;
}
