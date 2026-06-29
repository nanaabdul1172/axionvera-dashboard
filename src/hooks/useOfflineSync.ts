import { useEffect, useMemo, useState } from "react";
import { createOfflineSyncManager, type SyncAction } from "@/sync/offlineSync";
import { cacheSyncQueue, getCachedSyncQueue, clearSyncQueue } from "@/cache/offlineCache";

interface UseOfflineSyncOptions<T = Record<string, unknown>> {
  storageKey?: string;
  onSync: (action: SyncAction<T>) => Promise<void>;
  onConflict?: (action: SyncAction<T>, error: Error) => void;
}

export function useOfflineSync<T = Record<string, unknown>>({
  storageKey,
  onSync,
  onConflict,
}: UseOfflineSyncOptions<T>) {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);

  const manager = useMemo(() => {
    return createOfflineSyncManager<T>({
      storageKey,
      isOnline: () => isOnline,
      onSync: async (action) => {
        await onSync(action as SyncAction<T>);
      },
      onConflict: (action, error) => {
        onConflict?.(action as SyncAction<T>, error);
      },
    });
  }, [isOnline, storageKey, onSync, onConflict]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedQueue = getCachedSyncQueue<SyncAction<T>>();
    if (storedQueue?.length) {
      cacheSyncQueue(storedQueue);
    }

    const handleOnline = () => {
      setIsOnline(true);
      void manager.flushPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (isOnline) {
      void manager.flushPendingActions();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [manager, isOnline]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const pending = manager.getPendingActions();
    if (!pending.length) {
      clearSyncQueue();
      return;
    }
    cacheSyncQueue(pending);
  }, [manager, isOnline]);

  return {
    isOnline,
    queueAction: manager.queueAction,
    flushPendingActions: manager.flushPendingActions,
    getPendingActions: manager.getPendingActions,
    setOnline: manager.setOnline,
  };
}
