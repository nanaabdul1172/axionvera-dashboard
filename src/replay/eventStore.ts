import type { ProtocolEvent, EventStore, InMemoryEventStoreOptions } from './types';

export class InMemoryEventStore implements EventStore {
  private events: ProtocolEvent[] = [];

  constructor(options?: InMemoryEventStoreOptions) {
    if (options?.events) {
      this.events = [...options.events].sort((a, b) => a.timestamp - b.timestamp);
    }
  }

  async getEvents(options?: {
    startId?: string;
    endId?: string;
    limit?: number;
    types?: string[];
  }): Promise<ProtocolEvent[]> {
    let filteredEvents = [...this.events];

    if (options?.types && options.types.length > 0) {
      filteredEvents = filteredEvents.filter(e => options.types!.includes(e.type));
    }

    if (options?.startId) {
      const startIndex = this.events.findIndex(e => e.id === options.startId);
      if (startIndex !== -1) {
        filteredEvents = filteredEvents.slice(startIndex);
      }
    }

    if (options?.endId) {
      const endIndex = this.events.findIndex(e => e.id === options.endId);
      if (endIndex !== -1) {
        filteredEvents = filteredEvents.slice(0, endIndex + 1);
      }
    }

    if (options?.limit) {
      filteredEvents = filteredEvents.slice(0, options.limit);
    }

    return filteredEvents;
  }

  async addEvent(event: ProtocolEvent): Promise<void> {
    const insertIndex = this.events.findIndex(e => e.timestamp > event.timestamp);
    if (insertIndex === -1) {
      this.events.push(event);
    } else {
      this.events.splice(insertIndex, 0, event);
    }
  }
}
