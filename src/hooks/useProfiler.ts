import { useEffect, useRef, useState } from 'react';
import { recordRenderMetric, recordLifecycleEvent } from '../utils/profilerUtils';

interface ProfilerOptions {
  componentName: string;
  trackStateUpdates?: boolean;
}

export function useProfiler({ componentName, trackStateUpdates = true }: ProfilerOptions) {
  const renderCount = useRef(0);
  const mountTime = useRef(performance.now());
  const lastRenderTime = useRef(performance.now());
  
  // Track render count and frequency
  renderCount.current += 1;
  const currentRenderTime = performance.now();
  const renderDuration = currentRenderTime - lastRenderTime.current;
  lastRenderTime.current = currentRenderTime;

  if (renderCount.current > 1) {
    recordRenderMetric(componentName, renderDuration);
  }

  useEffect(() => {
    // Mount
    const mountDuration = performance.now() - mountTime.current;
    recordLifecycleEvent(componentName, 'mount', mountDuration);

    return () => {
      // Unmount
      recordLifecycleEvent(componentName, 'unmount', performance.now());
    };
  }, [componentName]);

  // Optional: A helper to wrap state setters to track when state changes triggered the render
  const trackState = <T,>(initialValue: T): [T, (val: T) => void] => {
    const [state, setState] = useState<T>(initialValue);
    const setTrackedState = (val: T) => {
      if (trackStateUpdates) {
        recordLifecycleEvent(componentName, 'stateUpdate', performance.now());
      }
      setState(val);
    };
    return [state, setTrackedState];
  };

  return {
    renderCount: renderCount.current,
    trackState
  };
}
