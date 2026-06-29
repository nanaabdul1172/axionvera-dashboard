# Dashboard Client-Side Query Engine

The dashboard query engine provides a single in-memory interface for modules that need to filter, sort, paginate, aggregate, or project protocol data before rendering it.

## Basic usage

```ts
import { QueryEngine } from '@/query';

const engine = new QueryEngine<{ account: string; balance: number; status: string }>();

const result = engine.execute(rows, {
  filters: [{ field: 'status', op: 'eq', value: 'active' }],
  sort: [{ field: 'balance', direction: 'desc' }],
  pagination: { page: 1, pageSize: 25 },
  aggregations: [
    { op: 'count', as: 'activeAccounts' },
    { op: 'sum', field: 'balance', as: 'totalBalance' },
  ],
});
```

`result.rows` contains the transformed rows, `result.total` contains the filtered row count before pagination, and `result.aggregations` contains named aggregation outputs.

## Query syntax

### Filters

Filters are combined with logical `AND`. Nested fields can be referenced with dot notation, such as `metadata.network`.

Supported operators:

- `eq`, `neq`
- `gt`, `gte`, `lt`, `lte`
- `in`, `nin`
- `contains`, `startsWith`, `endsWith`
- `exists`

### Sorting and pagination

Sorting accepts multiple fields and applies them in order. Pagination supports either `{ page, pageSize }` or `{ offset, limit }`.

### Aggregations

Supported aggregation operators are `count`, `sum`, `avg`, `min`, `max`, and `distinct`. Aggregations are computed after filtering and before pagination so summary cards remain consistent with the visible query scope.

### Projection

Use `select` to return only the fields a component needs:

```ts
engine.execute(rows, { select: ['account', 'balance'] });
```

## Caching

`QueryEngine` caches repeated queries with an LRU cache. The cache key includes the query specification and a stable fingerprint of the input data, so repeated dashboard renders can reuse previous results while data changes still invalidate stale entries.

```ts
const engine = new QueryEngine({ cacheSize: 50 });
const first = engine.execute(rows, query); // first.cacheHit === false
const second = engine.execute(rows, query); // second.cacheHit === true
```

Call `engine.clearCache()` when a module needs to eagerly release cached results.
