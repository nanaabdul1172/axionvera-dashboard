import type {
  Workspace,
  WorkspaceLayoutSettings,
  WorkspacePreferences,
  WorkspaceSeed,
  WorkspaceState,
  WorkspaceUpdate,
  WorkspaceView,
} from "./types";

export const WORKSPACE_STORAGE_KEY = "axionvera-workspaces";
export const DEFAULT_WORKSPACE_ID = "default";
const MAX_WORKSPACES = 12;

const DEFAULT_VISIBLE_VIEWS: WorkspaceView[] = [
  "vault",
  "analytics",
  "governance",
  "monitoring",
];

const DEFAULT_LAYOUT: WorkspaceLayoutSettings = {
  sidebarOpen: true,
  defaultView: "vault",
  visibleViews: DEFAULT_VISIBLE_VIEWS,
};

const DEFAULT_PREFERENCES: WorkspacePreferences = {
  theme: "system",
  network: "testnet",
  pinnedWallets: [],
};

const WORKSPACE_THEMES: WorkspacePreferences["theme"][] = ["light", "dark", "system"];
const WORKSPACE_NETWORKS: WorkspacePreferences["network"][] = ["testnet", "mainnet", "custom"];

export function createDefaultWorkspace(now = new Date().toISOString()): Workspace {
  return {
    id: DEFAULT_WORKSPACE_ID,
    name: "Default workspace",
    createdAt: now,
    updatedAt: now,
    layout: { ...DEFAULT_LAYOUT, visibleViews: [...DEFAULT_VISIBLE_VIEWS] },
    preferences: { ...DEFAULT_PREFERENCES, pinnedWallets: [] },
  };
}

export function createInitialWorkspaceState(now = new Date().toISOString()): WorkspaceState {
  return {
    version: 1,
    activeWorkspaceId: DEFAULT_WORKSPACE_ID,
    workspaces: [createDefaultWorkspace(now)],
  };
}

type WorkspaceStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function canUseStorage(storage?: WorkspaceStorage): storage is WorkspaceStorage {
  return Boolean(storage);
}

function normalizeWorkspace(input: Partial<Workspace>, fallback: Workspace): Workspace {
  const now = new Date().toISOString();
  const layout = input.layout as Partial<WorkspaceLayoutSettings> | undefined;
  const preferences = input.preferences as Partial<WorkspacePreferences> | undefined;

  return {
    id: typeof input.id === "string" && input.id.trim() ? input.id : fallback.id,
    name: typeof input.name === "string" && input.name.trim() ? input.name : fallback.name,
    createdAt: typeof input.createdAt === "string" ? input.createdAt : fallback.createdAt,
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : now,
    layout: {
      sidebarOpen: typeof layout?.sidebarOpen === "boolean" ? layout.sidebarOpen : fallback.layout.sidebarOpen,
      defaultView: isWorkspaceView(layout?.defaultView) ? layout.defaultView : fallback.layout.defaultView,
      visibleViews: normalizeVisibleViews(layout?.visibleViews, fallback.layout.visibleViews),
    },
    preferences: {
      theme: isWorkspaceTheme(preferences?.theme) ? preferences.theme : fallback.preferences.theme,
      network: isWorkspaceNetwork(preferences?.network) ? preferences.network : fallback.preferences.network,
      pinnedWallets: normalizePinnedWallets(preferences?.pinnedWallets),
    },
  };
}

export function normalizeWorkspaceState(input: unknown): WorkspaceState {
  const fallback = createInitialWorkspaceState();
  if (!input || typeof input !== "object") return fallback;

  const candidate = input as Partial<WorkspaceState>;
  if (!Array.isArray(candidate.workspaces) || candidate.workspaces.length === 0) {
    return fallback;
  }

  const ids = new Set<string>();
  const workspaces = candidate.workspaces
    .slice(0, MAX_WORKSPACES)
    .map((workspace, index) =>
      normalizeWorkspace(
        workspace && typeof workspace === "object" ? workspace : {},
        createFallbackWorkspace(index),
      ),
    )
    .filter((workspace) => {
      if (ids.has(workspace.id)) return false;
      ids.add(workspace.id);
      return true;
    });

  if (workspaces.length === 0) return fallback;

  const activeWorkspaceId = workspaces.some((workspace) => workspace.id === candidate.activeWorkspaceId)
    ? candidate.activeWorkspaceId!
    : workspaces[0].id;

  return {
    version: 1,
    activeWorkspaceId,
    workspaces,
  };
}

export class WorkspaceStore {
  private state: WorkspaceState;
  private readonly listeners = new Set<() => void>();
  private readonly storage?: WorkspaceStorage;
  private readonly storageKey: string;

  constructor(storage?: WorkspaceStorage, storageKey = WORKSPACE_STORAGE_KEY) {
    this.storage = storage;
    this.storageKey = storageKey;
    this.state = this.load();
    this.subscribe = this.subscribe.bind(this);
    this.getSnapshot = this.getSnapshot.bind(this);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): WorkspaceState {
    return this.state;
  }

  getActiveWorkspace(): Workspace {
    return (
      this.state.workspaces.find((workspace) => workspace.id === this.state.activeWorkspaceId) ??
      this.state.workspaces[0]
    );
  }

  createWorkspace(name: string, seed?: WorkspaceSeed): Workspace {
    if (this.state.workspaces.length >= MAX_WORKSPACES) {
      throw new Error(`Workspace limit of ${MAX_WORKSPACES} reached`);
    }

    const now = new Date().toISOString();
    const base = this.getActiveWorkspace();
    const workspace: Workspace = {
      id: createUniqueWorkspaceId(seed?.id ?? name, now, this.state.workspaces),
      name: sanitizeWorkspaceName(seed?.name ?? name),
      createdAt: seed?.createdAt ?? now,
      updatedAt: seed?.updatedAt ?? now,
      layout: {
        ...base.layout,
        ...(seed?.layout ?? {}),
        visibleViews: [...(seed?.layout?.visibleViews ?? base.layout.visibleViews)],
      },
      preferences: {
        ...base.preferences,
        ...(seed?.preferences ?? {}),
        pinnedWallets: [...(seed?.preferences?.pinnedWallets ?? base.preferences.pinnedWallets)],
      },
    };

    this.setState({
      ...this.state,
      activeWorkspaceId: workspace.id,
      workspaces: [...this.state.workspaces, workspace],
    });
    return workspace;
  }

  switchWorkspace(workspaceId: string): void {
    if (!this.state.workspaces.some((workspace) => workspace.id === workspaceId)) {
      throw new Error(`Workspace "${workspaceId}" does not exist`);
    }
    if (this.state.activeWorkspaceId === workspaceId) return;
    this.setState({ ...this.state, activeWorkspaceId: workspaceId });
  }

  updateWorkspace(workspaceId: string, update: WorkspaceUpdate): Workspace {
    let updatedWorkspace: Workspace | null = null;
    const now = new Date().toISOString();
    const workspaces = this.state.workspaces.map((workspace) => {
      if (workspace.id !== workspaceId) return workspace;
      updatedWorkspace = {
        ...workspace,
        name: update.name ? sanitizeWorkspaceName(update.name) : workspace.name,
        updatedAt: now,
        layout: {
          ...workspace.layout,
          ...(update.layout ?? {}),
          visibleViews: update.layout?.visibleViews
            ? [...update.layout.visibleViews]
            : [...workspace.layout.visibleViews],
        },
        preferences: {
          ...workspace.preferences,
          ...(update.preferences ?? {}),
          pinnedWallets: update.preferences?.pinnedWallets
            ? [...update.preferences.pinnedWallets]
            : [...workspace.preferences.pinnedWallets],
        },
      };
      return updatedWorkspace;
    });

    if (!updatedWorkspace) {
      throw new Error(`Workspace "${workspaceId}" does not exist`);
    }

    this.setState({ ...this.state, workspaces });
    return updatedWorkspace;
  }

  deleteWorkspace(workspaceId: string): void {
    if (this.state.workspaces.length === 1) {
      throw new Error("Cannot delete the final workspace");
    }

    const workspaces = this.state.workspaces.filter((workspace) => workspace.id !== workspaceId);
    if (workspaces.length === this.state.workspaces.length) {
      throw new Error(`Workspace "${workspaceId}" does not exist`);
    }

    const activeWorkspaceId =
      this.state.activeWorkspaceId === workspaceId ? workspaces[0].id : this.state.activeWorkspaceId;
    this.setState({ ...this.state, activeWorkspaceId, workspaces });
  }

  private load(): WorkspaceState {
    if (!canUseStorage(this.storage)) return createInitialWorkspaceState();

    const raw = this.storage.getItem(this.storageKey);
    if (!raw) return createInitialWorkspaceState();

    try {
      return normalizeWorkspaceState(JSON.parse(raw));
    } catch {
      this.storage.removeItem(this.storageKey);
      return createInitialWorkspaceState();
    }
  }

  private setState(nextState: WorkspaceState): void {
    this.state = normalizeWorkspaceState(nextState);
    this.persist();
    this.listeners.forEach((listener) => listener());
  }

  private persist(): void {
    if (!canUseStorage(this.storage)) return;
    this.storage.setItem(this.storageKey, JSON.stringify(this.state));
  }
}

export function createWorkspaceStore(storage?: WorkspaceStorage): WorkspaceStore {
  return new WorkspaceStore(storage);
}

export function getBrowserWorkspaceStorage(): WorkspaceStorage | undefined {
  if (typeof window === "undefined") return undefined;
  return window.localStorage;
}

function sanitizeWorkspaceName(name: string): string {
  const trimmed = name.trim();
  return trimmed || "Untitled workspace";
}

function createFallbackWorkspace(index: number): Workspace {
  if (index === 0) return createDefaultWorkspace();

  const now = new Date().toISOString();
  return {
    ...createDefaultWorkspace(now),
    id: `workspace-${index + 1}`,
    name: `Workspace ${index + 1}`,
  };
}

function isWorkspaceView(value: unknown): value is WorkspaceView {
  return DEFAULT_VISIBLE_VIEWS.includes(value as WorkspaceView);
}

function isWorkspaceTheme(value: unknown): value is WorkspacePreferences["theme"] {
  return WORKSPACE_THEMES.includes(value as WorkspacePreferences["theme"]);
}

function isWorkspaceNetwork(value: unknown): value is WorkspacePreferences["network"] {
  return WORKSPACE_NETWORKS.includes(value as WorkspacePreferences["network"]);
}

function normalizeVisibleViews(
  views: unknown,
  fallback: WorkspaceView[],
): WorkspaceView[] {
  if (!Array.isArray(views)) return [...fallback];

  const validViews = views.filter(isWorkspaceView);
  return validViews.length > 0 ? Array.from(new Set(validViews)) : [...fallback];
}

function normalizePinnedWallets(wallets: unknown): string[] {
  if (!Array.isArray(wallets)) return [];

  return Array.from(
    new Set(
      wallets
        .filter((wallet): wallet is string => typeof wallet === "string" && wallet.trim().length > 0)
        .map((wallet) => wallet.trim()),
    ),
  );
}

function createUniqueWorkspaceId(name: string, now: string, workspaces: Workspace[]): string {
  const baseId = createWorkspaceId(name, now);
  const existingIds = new Set(workspaces.map((workspace) => workspace.id));
  if (!existingIds.has(baseId)) return baseId;

  let index = 2;
  let candidateId = `${baseId}-${index}`;
  while (existingIds.has(candidateId)) {
    index += 1;
    candidateId = `${baseId}-${index}`;
  }
  return candidateId;
}

function createWorkspaceId(name: string, now: string): string {
  const slug = sanitizeWorkspaceName(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32);
  return `workspace-${slug || "untitled"}-${Date.parse(now).toString(36)}`;
}
