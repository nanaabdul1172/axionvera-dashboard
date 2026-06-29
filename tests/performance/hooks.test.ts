import { renderHook, act } from '@testing-library/react';
import { useProfileRender, useProfileNetwork, useProfilingReport } from '../../src/performance/hooks';
import { profilerInstance } from '../../src/performance/profiler';

beforeEach(() => {
  profilerInstance.enable();
  profilerInstance.reset();
});

afterEach(() => {
  jest.restoreAllMocks();
  profilerInstance.disable();
  profilerInstance.reset();
});

describe('useProfileRender', () => {
  it('calls profilerInstance.trackRender after render', () => {
    const spy = jest.spyOn(profilerInstance, 'trackRender');
    renderHook(() => useProfileRender('TestComponent'));
    expect(spy).toHaveBeenCalledWith('TestComponent', expect.any(Number));
  });
});

describe('useProfileNetwork', () => {
  it('wraps fn and tracks on success', async () => {
    const spy = jest.spyOn(profilerInstance, 'trackNetwork');
    const fn = jest.fn().mockResolvedValue('result');
    const { result } = renderHook(() => useProfileNetwork('/api/test', fn));
    await act(async () => {
      await result.current();
    });
    expect(spy).toHaveBeenCalledWith('/api/test', 'GET', expect.any(Number), 200);
  });

  it('tracks on error with status 0', async () => {
    const spy = jest.spyOn(profilerInstance, 'trackNetwork');
    const fn = jest.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useProfileNetwork('/api/fail', fn));
    await act(async () => {
      await result.current().catch(() => {});
    });
    expect(spy).toHaveBeenCalledWith('/api/fail', 'GET', expect.any(Number), 0);
  });
});

describe('useProfilingReport', () => {
  it('refresh returns updated report', () => {
    const { result } = renderHook(() => useProfilingReport());
    expect(result.current.report).toBeNull();
    act(() => {
      result.current.refresh();
    });
    expect(result.current.report).not.toBeNull();
    expect(Array.isArray(result.current.report?.renders)).toBe(true);
  });

  it('reset clears profiler state', () => {
    profilerInstance.trackRender('SomeComp', 10);
    const { result } = renderHook(() => useProfilingReport());
    act(() => {
      result.current.refresh();
    });
    expect(result.current.report?.renders).toHaveLength(1);
    act(() => {
      result.current.reset();
    });
    expect(result.current.report?.renders).toHaveLength(0);
  });
});
