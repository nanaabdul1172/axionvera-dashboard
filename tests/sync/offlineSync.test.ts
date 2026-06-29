import { createOfflineSyncManager } from "../../src/sync/offlineSync";

describe("offline sync manager", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("queues actions while offline and flushes them once connectivity returns", async () => {
    const onSync = jest.fn().mockResolvedValue(undefined);
    const manager = createOfflineSyncManager({
      storageKey: "test-sync",
      isOnline: () => false,
      onSync,
    });

    const queued = manager.queueAction({
      type: "deposit",
      payload: { amount: "10" },
    });

    expect(queued.status).toBe("queued");
    expect(manager.getPendingActions()).toHaveLength(1);

    manager.setOnline(true);
    await manager.flushPendingActions();

    expect(onSync).toHaveBeenCalledTimes(1);
    expect(manager.getPendingActions()[0].status).toBe("synced");
  });

  it("marks conflicts gracefully without crashing the sync loop", async () => {
    const onConflict = jest.fn();
    const manager = createOfflineSyncManager({
      storageKey: "test-sync-conflicts",
      isOnline: () => true,
      onSync: jest.fn().mockRejectedValue(new Error("Conflict detected")),
      onConflict,
    });

    manager.queueAction({
      type: "withdraw",
      payload: { amount: "3" },
    });

    await manager.flushPendingActions();

    const [pending] = manager.getPendingActions();
    expect(pending.status).toBe("conflict");
    expect(onConflict).toHaveBeenCalledTimes(1);
  });
});
