export type WorkspaceView = "vault" | "analytics" | "governance" | "monitoring";

export type WorkspaceThemePreference = "light" | "dark" | "system";

export interface WorkspaceLayoutSettings {
  sidebarOpen: boolean;
  defaultView: WorkspaceView;
  visibleViews: WorkspaceView[];
}

export interface WorkspacePreferences {
  theme: WorkspaceThemePreference;
  network: "testnet" | "mainnet" | "custom";
  pinnedWallets: string[];
}

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  layout: WorkspaceLayoutSettings;
  preferences: WorkspacePreferences;
}

export interface WorkspaceState {
  version: 1;
  activeWorkspaceId: string;
  workspaces: Workspace[];
}

export type WorkspaceSeed = Partial<
  Pick<Workspace, "id" | "name" | "createdAt" | "updatedAt"> & {
    layout: Partial<WorkspaceLayoutSettings>;
    preferences: Partial<WorkspacePreferences>;
  }
>;

export type WorkspaceUpdate = Partial<
  Pick<Workspace, "name"> & {
    layout: Partial<WorkspaceLayoutSettings>;
    preferences: Partial<WorkspacePreferences>;
  }
>;
