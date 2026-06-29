import { useState, useCallback, useRef } from 'react';

/**
 * Hook for managing incremental updates to a data structure.
 * It ensures that updates only trigger re-renders if the value actually changed.
 */
export function useIncrementalUpdate<T>(initialValue: T) {
  const [state, setState] = useState<T>(initialValue);
  const stateRef = useRef(state);

  /**
   * Update the state only if the new value is different.
   * Supports both direct values and updater functions.
   */
  const update = useCallback((newValue: T | ((prev: T) => T)) => {
    setState((prev) => {
      const nextValue = typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(prev)
        : newValue;

      if (!Object.is(nextValue, prev)) {
        stateRef.current = nextValue;
        return nextValue;
      }
      return prev;
    });
  }, []);

  /**
   * Partial update for object states.
   */
  const patch = useCallback((partial: Partial<T>) => {
    setState((prev) => {
      if (typeof prev !== 'object' || prev === null) {
        return prev;
      }

      const nextValue = { ...prev, ...partial };

      // Simple shallow comparison for patches
      const hasChanged = Object.keys(partial).some(
        (key) => !Object.is((prev as any)[key], (nextValue as any)[key])
      );

      if (hasChanged) {
        stateRef.current = nextValue;
        return nextValue;
      }
      return prev;
    });
  }, []);

  return [state, update, patch, stateRef] as const;
}
