import { useEffect, useRef, useCallback, useState } from 'react';
import { profilerInstance } from './profiler';
import type { ProfilingReport } from './types';

export function useProfileRender(componentName: string): void {
  const renderStart = useRef<number>(0);
  renderStart.current = performance.now();

  useEffect(() => {
    const duration = performance.now() - renderStart.current;
    profilerInstance.trackRender(componentName, duration);
  });
}

export function useProfileNetwork<T>(
  name: string,
  fn: () => Promise<T>
): () => Promise<T> {
  return useCallback(async () => {
    const start = performance.now();
    try {
      const result = await fn();
      profilerInstance.trackNetwork(name, 'GET', performance.now() - start, 200);
      return result;
    } catch (error) {
      profilerInstance.trackNetwork(name, 'GET', performance.now() - start, 0);
      throw error;
    }
  }, [name, fn]);
}

export function useProfilingReport(): {
  report: ProfilingReport | null;
  refresh: () => void;
  reset: () => void;
} {
  const [report, setReport] = useState<ProfilingReport | null>(null);

  const refresh = useCallback(() => {
    setReport(profilerInstance.generateReport());
  }, []);

  const reset = useCallback(() => {
    profilerInstance.reset();
    setReport(profilerInstance.generateReport());
  }, []);

  return { report, refresh, reset };
}
