import {
  createDefaultWorkspace,
  normalizeWorkspaceState,
  WORKSPACE_STORAGE_KEY,
  WorkspaceStore,
} from "@/workspaces";

function createMemoryStorage(initial?: string) {
  const data = new Map<string, string>();
  if (initial) data.set(WORKSPACE_STORAGE_KEY, initial);
  return {
    getItem: jest.fn((key: string) => data.get(key) ?? null),
    setItem: jest.fn((key: string, value: string) => {
      data.set(key, value);
    }),
    removeItem: jest.fn((key: string) => {
      data.delete(key);
    }),
  };
}

describe("WorkspaceStore", () => {
  test("creates a default workspace when storage is empty", () => {
    const storage = createMemoryStorage();
    const store = new WorkspaceStore(storage);

    expect(store.getSnapshot().workspaces).toHaveLength(1);
    expect(store.getActiveWorkspace().name).toBe("Default workspace");
    expect(storage.getItem).toHaveBeenCalledWith(WORKSPACE_STORAGE_KEY);
  });

  test("creates and switches workspaces while persisting state", () => {
    const storage = createMemoryStorage();
    const store = new WorkspaceStore(storage);

    const workspace = store.createWorkspace("Trading desk", {
      preferences: { network: "mainnet" },
      layout: { sidebarOpen: false },
    });

    expect(store.getSnapshot().workspaces).toHaveLength(2);
    expect(store.getActiveWorkspace().id).toBe(workspace.id);
    expect(store.getActiveWorkspace().preferences.network).toBe("mainnet");
    expect(storage.setItem).toHaveBeenCalledWith(
      WORKSPACE_STORAGE_KEY,
      expect.stringContaining("Trading desk"),
    );

    store.switchWorkspace("default");
    expect(store.getActiveWorkspace().id).toBe("default");
  });

  test("keeps layout and preferences isolated per workspace", () => {
    const store = new WorkspaceStore(createMemoryStorage());
    const research = store.createWorkspace("Research");
    store.updateWorkspace(research.id, {
      layout: { sidebarOpen: false, defaultView: "analytics" },
      preferences: { theme: "dark", pinnedWallets: ["GABC"] },
    });

    store.switchWorkspace("default");
    expect(store.getActiveWorkspace().layout.sidebarOpen).toBe(true);
    expect(store.getActiveWorkspace().preferences.theme).toBe("system");

    store.switchWorkspace(research.id);
    expect(store.getActiveWorkspace().layout.sidebarOpen).toBe(false);
    expect(store.getActiveWorkspace().layout.defaultView).toBe("analytics");
    expect(store.getActiveWorkspace().preferences.pinnedWallets).toEqual(["GABC"]);
  });

  test("normalizes invalid persisted state", () => {
    const state = normalizeWorkspaceState({
      version: 1,
      activeWorkspaceId: "missing",
      workspaces: [
        {
          ...createDefaultWorkspace("2026-01-01T00:00:00.000Z"),
          id: "",
          name: "",
          layout: { visibleViews: [] },
          preferences: { pinnedWallets: "invalid" },
        },
      ],
    });

    expect(state.activeWorkspaceId).toBe("default");
    expect(state.workspaces[0].name).toBe("Default workspace");
    expect(state.workspaces[0].layout.visibleViews).toContain("vault");
    expect(state.workspaces[0].preferences.pinnedWallets).toEqual([]);
  });

  test("falls back when storage contains invalid JSON", () => {
    const storage = createMemoryStorage("{bad json");
    const store = new WorkspaceStore(storage);

    const snapshot = store.getSnapshot();
    expect(snapshot).toMatchObject({
      version: 1,
      activeWorkspaceId: "default",
    });
    expect(snapshot.workspaces).toHaveLength(1);
    expect(snapshot.workspaces[0]).toMatchObject({
      id: "default",
      name: "Default workspace",
      layout: {
        sidebarOpen: true,
        defaultView: "vault",
      },
      preferences: {
        theme: "system",
        network: "testnet",
        pinnedWallets: [],
      },
    });
    expect(storage.removeItem).toHaveBeenCalledWith(WORKSPACE_STORAGE_KEY);
  });
});
