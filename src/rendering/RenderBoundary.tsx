import React, { memo, ReactNode, useRef, useEffect } from 'react';
import { performanceMonitor, MetricType } from '@/utils/performance';

interface RenderBoundaryProps {
  children: ReactNode;
  /**
   * List of dependencies that should trigger a re-render.
   * If not provided, it will re-render on every parent render (default React behavior).
   */
  dependencies?: any[];
  /**
   * Name of the boundary for performance tracking.
   */
  name?: string;
  /**
   * Optional fallback to show during heavy renders (if using Concurrent Mode features).
   */
  fallback?: ReactNode;
}

/**
 * RenderBoundary isolates a component tree and prevents cascading re-renders
 * unless the specified dependencies change.
 */
const RenderBoundaryComponent = ({ children, name }: RenderBoundaryProps) => {
  const renderCount = useRef(0);
  const startTime = useRef(0);

  startTime.current = performance.now();

  useEffect(() => {
    renderCount.current += 1;
    const duration = performance.now() - startTime.current;

    if (name) {
      performanceMonitor.start(`${name}-render`, MetricType.RENDER, { renderCount: renderCount.current });
      performanceMonitor.end(`${name}-render`, { duration });
    }
  });

  return <>{children}</>;
};

export const RenderBoundary = memo(RenderBoundaryComponent, (prev, next) => {
  // If no dependencies provided, we follow React's default behavior (always re-render if props change)
  // But here we are a memoized component, so if dependencies is undefined,
  // we check if other props changed. Since children is a prop, it usually changes every render.

  if (!next.dependencies || !prev.dependencies) {
    return false; // Re-render if dependencies are missing (conservative)
  }

  if (next.dependencies.length !== prev.dependencies.length) {
    return false;
  }

  // Only skip re-render if all dependencies are the same
  return next.dependencies.every((dep, i) => Object.is(dep, prev.dependencies![i]));
});

RenderBoundary.displayName = 'RenderBoundary';
