import React, {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";

import {
  createWorkspaceStore,
  getBrowserWorkspaceStorage,
  WorkspaceStore,
} from "./store";
import type { Workspace, WorkspaceSeed, WorkspaceState, WorkspaceUpdate } from "./types";

interface WorkspaceContextValue {
  state: WorkspaceState;
  activeWorkspace: Workspace;
  createWorkspace: (name: string, seed?: WorkspaceSeed) => Workspace;
  switchWorkspace: (workspaceId: string) => void;
  updateWorkspace: (workspaceId: string, update: WorkspaceUpdate) => Workspace;
  deleteWorkspace: (workspaceId: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

interface WorkspaceProviderProps {
  children: ReactNode;
  store?: WorkspaceStore;
}

export function WorkspaceProvider({ children, store }: WorkspaceProviderProps) {
  const storeRef = useRef<WorkspaceStore>();
  if (!storeRef.current) {
    storeRef.current = store ?? createWorkspaceStore(getBrowserWorkspaceStorage());
  }

  const activeStore = storeRef.current;
  const state = useSyncExternalStore(
    activeStore.subscribe,
    activeStore.getSnapshot,
    activeStore.getSnapshot,
  );

  const actions = useMemo(
    () => ({
      createWorkspace: activeStore.createWorkspace.bind(activeStore),
      switchWorkspace: activeStore.switchWorkspace.bind(activeStore),
      updateWorkspace: activeStore.updateWorkspace.bind(activeStore),
      deleteWorkspace: activeStore.deleteWorkspace.bind(activeStore),
    }),
    [activeStore],
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      state,
      activeWorkspace: activeStore.getActiveWorkspace(),
      ...actions,
    }),
    [actions, activeStore, state],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useOptionalWorkspace() {
  return useContext(WorkspaceContext);
}

export function useWorkspace() {
  const context = useOptionalWorkspace();
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
