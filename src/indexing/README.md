# Event Indexing System

The Event Indexing System is a frontend service that organizes protocol events for efficient querying, filtering, and analytics. It complements the `EventSubscriptionService` by providing a searchable history of events received during the application lifecycle.

## Features

- **Efficient Querying**: Filter events by type, contract ID, event name, and date range.
- **Pagination Support**: Built-in support for paginated results.
- **Real-time Integration**: Automatically indexes events as they are emitted by the `EventSubscriptionService`.
- **Historical Lookups**: Ability to fetch and index historical events from the Soroban RPC.
- **Automatic Retention**: Configurable limits on memory usage via event count and age-based retention policies.
- **Basic Analytics**: Grouped event counts and time range summaries.

## Architecture

### `EventIndexer`
The core service that maintains an in-memory collection of normalized `ActivityEvent` objects. It provides methods for adding events, querying with filters, and generating analytics.

### `EventSubscriptionService` Integration
The `EventSubscriptionService` has been updated to automatically push every new event to the shared `EventIndexer` instance.

## Usage

### Querying Events

```typescript
import { getEventIndexer } from '@/indexing/eventIndexer';

const indexer = getEventIndexer();

const result = indexer.query({
  types: ['deposit', 'withdrawal'],
  startDate: '2026-01-01T00:00:00Z',
  limit: 20,
  order: 'desc'
});

console.log(`Found ${result.total} events:`, result.events);
```

### Getting Analytics

```typescript
const stats = indexer.getAnalytics();
console.log('Total deposits:', stats.countByType.deposit);
```

### Fetching History

```typescript
import { createSorobanRpcFetcher } from '@/services/events';

await indexer.fetchHistory({
  fetcher: createSorobanRpcFetcher(),
  startLedger: 123456,
  contractIds: ['...'],
  limit: 100
});
```

## Retention Policy

By default, the indexer keeps up to 10,000 events or events from the last 7 days. These can be customized during instantiation:

```typescript
const customIndexer = new EventIndexer({
  maxEvents: 1000,
  retentionPeriodMs: 24 * 60 * 60 * 1000 // 1 day
});
```
