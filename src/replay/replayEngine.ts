import type {
  ProtocolEvent,
  StateReconstructor,
  EventStore,
  ReplayStep,
  ReplayReport,
  ReplayOptions
} from './types';

export class ReplayEngine<S> {
  private store: EventStore;
  private reconstructor: StateReconstructor<S>;

  constructor(store: EventStore, reconstructor: StateReconstructor<S>) {
    this.store = store;
    this.reconstructor = reconstructor;
  }

  async replay(options?: ReplayOptions): Promise<ReplayReport> {
    const startedAt = Date.now();
    const steps: ReplayStep[] = [];
    let currentState = this.reconstructor.initialState;

    const events = await this.store.getEvents({
      limit: options?.maxEvents,
      types: options?.eventTypes
    });

    for (let index = 0; index < events.length; index++) {
      const event = events[index];
      const stateBefore = structuredClone(currentState);
      let stateAfter = stateBefore;
      let success = true;
      let error: Error | undefined;

      try {
        stateAfter = this.reconstructor.applyEvent(currentState, event);
        currentState = stateAfter;
      } catch (err) {
        success = false;
        error = err instanceof Error ? err : new Error(String(err));
      }

      const step: ReplayStep = {
        index,
        event,
        stateBefore,
        stateAfter,
        success,
        error
      };

      steps.push(step);
      options?.onStep?.(step);
    }

    const successCount = steps.filter(s => s.success).length;
    const errorCount = steps.length - successCount;

    return {
      startedAt,
      finishedAt: Date.now(),
      totalEvents: steps.length,
      successCount,
      errorCount,
      steps,
      finalState: currentState
    };
  }
}
