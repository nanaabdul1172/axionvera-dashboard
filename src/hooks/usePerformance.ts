/**
 * @module hooks/usePerformance
 *
 * React hooks for performance monitoring and optimization.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DependencyList,
} from "react";
import { performanceMonitor, MetricType } from "@/utils/performance";

/**
 * Hook to measure component render time.
 */
export function useRenderPerformance(componentName: string): void {
  const renderStart = useRef<number>(0);

  // Measure render start
  renderStart.current = performance.now();

  useEffect(() => {
    // Measure render end
    const duration = performance.now() - renderStart.current;
    performanceMonitor.start(componentName, MetricType.RENDER);
    performanceMonitor.end(componentName, { duration });
  });
}

/**
 * Hook to track component mount/unmount lifecycle.
 */
export function useComponentLifecycle(componentName: string): void {
  useEffect(() => {
    performanceMonitor.start(`${componentName}-mount`, MetricType.COMPONENT_MOUNT);

    return () => {
      performanceMonitor.end(`${componentName}-mount`);
    };
  }, [componentName]);
}

/**
 * Hook to measure async operation performance.
 */
export function useMeasureAsync<T extends (...args: any[]) => Promise<any>>(
  name: string,
  asyncFn: T
): T {
  return useCallback(
    (async (...args: Parameters<T>) => {
      return performanceMonitor.measureAsync(name, MetricType.API_CALL, () => asyncFn(...args));
    }) as T,
    [name, asyncFn]
  );
}

/**
 * Hook for debounced callback.
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

/**
 * Hook for throttled callback.
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const inThrottle = useRef(false);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      if (!inThrottle.current) {
        callbackRef.current(...args);
        inThrottle.current = true;

        setTimeout(() => {
          inThrottle.current = false;
        }, delay);
      }
    },
    [delay]
  );
}

/**
 * Hook to track render count (development only).
 */
export function useRenderCount(componentName: string): number {
  const renderCount = useRef(0);

  renderCount.current += 1;

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[${componentName}] Render #${renderCount.current}`);
    }
  });

  return renderCount.current;
}

/**
 * Hook to detect slow renders.
 */
export function useSlowRenderDetection(
  componentName: string,
  threshold: number = 16
): void {
  const renderStart = useRef<number>(0);

  renderStart.current = performance.now();

  useEffect(() => {
    const duration = performance.now() - renderStart.current;

    if (duration > threshold) {
      console.warn(
        `[Performance Warning] ${componentName} took ${duration.toFixed(2)}ms to render (threshold: ${threshold}ms)`
      );
    }
  });
}

/**
 * Hook for lazy initialization of expensive values.
 */
export function useLazyMemo<T>(factory: () => T, deps: DependencyList): T {
  const valueRef = useRef<T | null>(null);
  const depsRef = useRef<DependencyList | null>(null);

  if (
    valueRef.current === null ||
    depsRef.current === null ||
    !deps.every((dep, i) => Object.is(dep, depsRef.current![i]))
  ) {
    valueRef.current = factory();
    depsRef.current = deps;
  }

  return valueRef.current;
}

/**
 * Hook to memoize async function results.
 */
export function useAsyncMemo<T>(
  factory: () => Promise<T>,
  deps: DependencyList,
  initialValue: T
): T {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    let cancelled = false;

    factory().then((result) => {
      if (!cancelled) {
        setValue(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, deps);

  return value;
}

/**
 * Hook to batch state updates.
 */
export function useBatchedState<T>(
  initialState: T
): [T, (update: Partial<T>) => void, () => void] {
  const [state, setState] = useState<T>(initialState);
  const pendingUpdates = useRef<Partial<T>[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const batchUpdate = useCallback((update: Partial<T>) => {
    pendingUpdates.current.push(update);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const merged = Object.assign({}, state, ...pendingUpdates.current);
      pendingUpdates.current = [];
      setState(merged);
    }, 0);
  }, [state]);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (pendingUpdates.current.length > 0) {
      const merged = Object.assign({}, state, ...pendingUpdates.current);
      pendingUpdates.current = [];
      setState(merged);
    }
  }, [state]);

  return [state, batchUpdate, flush];
}

/**
 * Hook to optimize expensive computations with Web Workers (if available).
 */
export function useWebWorker<TInput, TOutput>(
  workerFactory: () => Worker,
  input: TInput
): {
  result: TOutput | null;
  loading: boolean;
  error: Error | null;
} {
  const [result, setResult] = useState<TOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (typeof Worker === "undefined") {
      setError(new Error("Web Workers not supported"));
      return;
    }

    if (!workerRef.current) {
      workerRef.current = workerFactory();
    }

    const worker = workerRef.current;

    setLoading(true);
    setError(null);

    const handleMessage = (e: MessageEvent<TOutput>) => {
      setResult(e.data);
      setLoading(false);
    };

    const handleError = (e: ErrorEvent) => {
      setError(new Error(e.message));
      setLoading(false);
    };

    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleError);

    worker.postMessage(input);

    return () => {
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);
    };
  }, [input, workerFactory]);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  return { result, loading, error };
}
