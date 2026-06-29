import {
  DashboardEventMap,
  EventBusOptions,
  EventEnvelope,
  EventHandler,
  EventLoopPreventedError,
  PublishOptions,
  SubscribeOptions,
  Unsubscribe,
} from "./types";

type EventMap = object;
type AnyHandler = EventHandler<unknown, string>;

interface Subscription {
  id: string;
  priority: number;
  order: number;
  handler: AnyHandler;
}

interface PublishContext {
  depth: number;
  path: string[];
}

const DEFAULT_MAX_PUBLISH_DEPTH = 10;

export class EventBus<TEvents extends EventMap = DashboardEventMap> {
  private readonly subscribers = new Map<keyof TEvents & string, Subscription[]>();
  private readonly maxPublishDepth: number;
  private readonly idFactory: () => string;
  private readonly now: () => number;
  private readonly onLoopPrevented?: (event: EventEnvelope, reason: string) => void;
  private publishStack: PublishContext[] = [];
  private nextOrder = 0;

  constructor(options: EventBusOptions = {}) {
    this.maxPublishDepth = options.maxPublishDepth ?? DEFAULT_MAX_PUBLISH_DEPTH;
    this.idFactory = options.idFactory ?? (() => globalThis.crypto?.randomUUID?.() ?? `event-${Date.now()}-${Math.random()}`);
    this.now = options.now ?? (() => Date.now());
    this.onLoopPrevented = options.onLoopPrevented;
  }

  subscribe<TType extends keyof TEvents & string>(
    type: TType,
    handler: EventHandler<TEvents[TType], TType>,
    options: SubscribeOptions = {},
  ): Unsubscribe {
    const subscription: Subscription = {
      id: options.subscriberId ?? `${type}:subscriber:${this.nextOrder}`,
      priority: options.priority ?? 0,
      order: this.nextOrder++,
      handler: handler as AnyHandler,
    };

    const subscriptions = this.subscribers.get(type) ?? [];
    subscriptions.push(subscription);
    subscriptions.sort((a, b) => b.priority - a.priority || a.order - b.order);
    this.subscribers.set(type, subscriptions);

    let active = true;
    return () => {
      if (!active) return;
      active = false;
      const current = this.subscribers.get(type) ?? [];
      const next = current.filter((item) => item !== subscription);
      if (next.length === 0) {
        this.subscribers.delete(type);
      } else {
        this.subscribers.set(type, next);
      }
    };
  }

  async publish<TType extends keyof TEvents & string>(
    type: TType,
    payload: TEvents[TType],
    options: PublishOptions = {},
  ): Promise<EventEnvelope<TType, TEvents[TType]>> {
    const parent = this.publishStack[this.publishStack.length - 1];
    const depth = parent ? parent.depth + 1 : 0;
    const path = [...(parent?.path ?? []), type];
    const envelope: EventEnvelope<TType, TEvents[TType]> = Object.freeze({
      id: this.idFactory(),
      type,
      payload,
      timestamp: this.now(),
      source: options.source,
      correlationId: options.correlationId,
      depth,
      path,
    });

    this.assertPublishAllowed(envelope);

    const subscriptions = [...(this.subscribers.get(type) ?? [])];
    this.publishStack.push({ depth, path });
    try {
      for (const subscription of subscriptions) {
        await subscription.handler(envelope as EventEnvelope<string, unknown>);
      }
    } finally {
      this.publishStack.pop();
    }

    return envelope;
  }

  listenerCount<TType extends keyof TEvents & string>(type?: TType): number {
    if (type) return this.subscribers.get(type)?.length ?? 0;
    return [...this.subscribers.values()].reduce((total, subscriptions) => total + subscriptions.length, 0);
  }

  clear(): void {
    this.subscribers.clear();
    this.publishStack = [];
  }

  private assertPublishAllowed(event: EventEnvelope): void {
    if (event.depth > this.maxPublishDepth) {
      this.preventLoop(event, `Maximum publish depth of ${this.maxPublishDepth} exceeded`);
    }

    const previousOccurrences = event.path.slice(0, -1).filter((item) => item === event.type).length;
    if (previousOccurrences > 0) {
      this.preventLoop(event, `Event loop detected for ${event.type}`);
    }
  }

  private preventLoop(event: EventEnvelope, reason: string): never {
    this.onLoopPrevented?.(event, reason);
    throw new EventLoopPreventedError(reason);
  }
}

export const eventBus = new EventBus<DashboardEventMap>();
