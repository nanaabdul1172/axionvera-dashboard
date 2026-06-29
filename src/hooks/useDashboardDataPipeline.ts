import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardDataPipeline, PipelineReadResult } from "@/data";

type PipelineState<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  source: PipelineReadResult<T>["source"] | null;
  updatedAt: number | null;
};

export function useDashboardDataPipeline<TInput, TOutput>(
  pipeline: DashboardDataPipeline<TInput, TOutput>,
  options: { enabled?: boolean } = {},
) {
  const enabled = options.enabled ?? true;
  const [state, setState] = useState<PipelineState<TOutput>>({
    data: pipeline.peek(),
    isLoading: enabled,
    error: null,
    source: null,
    updatedAt: null,
  });

  const refresh = useCallback(async (force = true) => {
    setState((current) => ({ ...current, isLoading: true, error: null }));

    try {
      const result = await pipeline.read({ force });
      setState({
        data: result.data,
        isLoading: false,
        error: null,
        source: result.source,
        updatedAt: result.updatedAt,
      });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load dashboard data";
      setState((current) => ({ ...current, isLoading: false, error: message }));
      throw error;
    }
  }, [pipeline]);

  const invalidate = useCallback(() => {
    pipeline.invalidate();
    setState((current) => ({ ...current, data: null, source: null, updatedAt: null }));
  }, [pipeline]);

  useEffect(() => {
    if (!enabled) return undefined;

    const unsubscribe = pipeline.subscribe((entry) => {
      setState({ data: entry.data, isLoading: false, error: null, source: "network", updatedAt: entry.updatedAt });
    });
    void refresh(false);

    return unsubscribe;
  }, [enabled, pipeline, refresh]);

  return useMemo(() => ({ ...state, refresh, invalidate }), [state, refresh, invalidate]);
}
