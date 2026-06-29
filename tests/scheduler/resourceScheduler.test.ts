import { ResourceScheduler } from '@/scheduler';

function createScheduler() {
  return new ResourceScheduler({
    maxConcurrent: 1,
    frameBudgetMs: 100,
    backgroundDelayMs: 25,
    now: () => Date.now(),
  });
}

describe('ResourceScheduler', () => {
  it('executes tasks according to priority', async () => {
    const scheduler = createScheduler();
    const order: string[] = [];

    const background = scheduler.schedule({
      id: 'background',
      name: 'Background sync',
      type: 'sync',
      priority: 'background',
      run: () => order.push('background'),
    });
    const render = scheduler.schedule({
      id: 'render',
      name: 'Render update',
      type: 'render',
      priority: 'user-blocking',
      run: () => order.push('render'),
    });

    await Promise.all([background, render]);

    expect(order).toEqual(['render', 'background']);
  });

  it('defers background work while interactive', async () => {
    jest.useFakeTimers();
    const scheduler = new ResourceScheduler({
      maxConcurrent: 1,
      frameBudgetMs: 100,
      backgroundDelayMs: 100,
      now: () => Date.now(),
    });
    scheduler.setState('interactive');
    const run = jest.fn();

    const scheduled = scheduler.schedule({
      id: 'sync',
      name: 'Offline sync',
      type: 'sync',
      run,
    });

    await Promise.resolve();
    jest.advanceTimersByTime(99);
    await Promise.resolve();
    expect(run).not.toHaveBeenCalled();

    scheduler.setState('settled');
    jest.advanceTimersByTime(0);
    await scheduled;

    expect(run).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('records execution history and snapshot counts', async () => {
    const scheduler = createScheduler();

    await scheduler.schedule({
      id: 'api',
      name: 'Load portfolio',
      type: 'api',
      run: () => 'ok',
    });

    const snapshot = scheduler.getSnapshot();
    expect(snapshot.completed).toBe(1);
    expect(snapshot.lastExecution).toMatchObject({
      id: 'api',
      type: 'api',
      status: 'completed',
    });
  });
});
