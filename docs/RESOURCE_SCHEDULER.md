# Dashboard Resource Scheduler

The resource scheduler coordinates render-adjacent work, API requests, background synchronization, and heavy computations so interactive work stays responsive while non-urgent work is deferred.

## Architecture

- `ResourceScheduler` owns a priority queue, execution history, concurrency limits, and frame-budget checks.
- `resourceScheduler` is the shared dashboard instance for application code.
- `useResourceScheduler` exposes React helpers for scheduling render, API, sync, and compute work.
- Completed tasks are recorded through the performance telemetry pipeline as `scheduler.<type>` resource-load metrics.

## Priority model

Priorities are ordered as follows:

1. `immediate` for urgent internal work.
2. `user-blocking` for render and directly interactive updates.
3. `normal` for visible API requests and settled-state tasks.
4. `background` for sync operations that should not compete with interaction.
5. `idle` for heavyweight computations that can wait for spare time.

The default policy promotes render work during interactive states, keeps API work at normal priority, and defers synchronization or compute tasks until the dashboard is settled or backgrounded.

## Scheduling policies

- Interactive state defers `background` and `idle` work by `backgroundDelayMs`.
- The scheduler respects `maxConcurrent` to avoid flooding the main thread or network.
- The scheduler checks `frameBudgetMs` before starting another non-immediate task.
- Task execution records include status, duration, type, priority, and optional metadata for diagnostics.
- Timed-out tasks receive an aborted signal so cooperative task bodies can stop early.

## Usage

```ts
import { resourceScheduler } from '@/scheduler';

await resourceScheduler.schedule({
  id: 'refresh-vaults',
  name: 'Refresh vaults',
  type: 'api',
  run: () => fetch('/api/vaults').then(response => response.json()),
});
```

React components can use `useSchedulerState('interactive')` while users are dragging, typing, or navigating, and return to `settled` when the interaction completes.
