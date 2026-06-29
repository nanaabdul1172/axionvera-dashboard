import { useMemo } from "react";
import type { PortfolioAnalytics } from "@/hooks/useAnalytics";
import { generateProtocolInsights } from "@/insights/generator";

export function useProtocolInsights(analytics: PortfolioAnalytics | null) {
  return useMemo(() => {
    if (!analytics) return null;
    return generateProtocolInsights(analytics);
  }, [analytics]);
}
