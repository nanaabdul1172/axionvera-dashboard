import { useEffect } from "react";
import { eventBus } from "@/events";
import type { DashboardEventMap, EventHandler, SubscribeOptions } from "@/events";

export function useEventBus<TType extends keyof DashboardEventMap & string>(
  type: TType,
  handler: EventHandler<DashboardEventMap[TType], TType>,
  options: SubscribeOptions = {},
): void {
  useEffect(() => {
    return eventBus.subscribe(type, handler, options);
  }, [type, handler, options.priority, options.subscriberId]);
}
