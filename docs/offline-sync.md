# Offline Synchronization Lifecycle

## Overview

The dashboard now tracks supported vault actions while the browser is offline and replays them when connectivity returns.

## Lifecycle

1. User performs a supported action while offline.
2. The action is persisted in the local sync queue.
3. The UI marks the action as pending and keeps the user informed.
4. When the browser comes back online, the queued action is replayed automatically.
5. If the replay fails, the item is marked as a conflict and surfaced to the user without crashing the app.

## Storage

Pending actions are stored in browser storage so they survive refreshes and temporary disconnects.

## Conflict Handling

Conflicts are represented as queued items with a conflict status and are surfaced through the existing notification system.
