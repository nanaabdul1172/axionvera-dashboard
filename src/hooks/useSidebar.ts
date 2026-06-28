import { useCallback, useEffect, useRef } from 'react';

import { useWorkspace } from '@/workspaces';

const SIDEBAR_STATE_KEY = 'sidebar-open';

export function useSidebar() {
  const { activeWorkspace, updateWorkspace } = useWorkspace();
  const migratedWorkspaceIds = useRef(new Set<string>());

  useEffect(() => {
    if (migratedWorkspaceIds.current.has(activeWorkspace.id)) return;
    migratedWorkspaceIds.current.add(activeWorkspace.id);

    try {
      const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
      if (savedState === null) return;

      const migratedState = JSON.parse(savedState);
      if (typeof migratedState === 'boolean') {
        updateWorkspace(activeWorkspace.id, { layout: { sidebarOpen: migratedState } });
      }
      localStorage.removeItem(SIDEBAR_STATE_KEY);
    } catch (error) {
      console.warn('Failed to parse sidebar state from localStorage:', error);
    }
  }, [activeWorkspace.id, updateWorkspace]);

  const setSidebarOpen = useCallback(
    (sidebarOpen: boolean) => {
      updateWorkspace(activeWorkspace.id, { layout: { sidebarOpen } });
    },
    [activeWorkspace.id, updateWorkspace],
  );

  const toggle = useCallback(
    () => setSidebarOpen(!activeWorkspace.layout.sidebarOpen),
    [activeWorkspace.layout.sidebarOpen, setSidebarOpen],
  );
  const open = useCallback(() => setSidebarOpen(true), [setSidebarOpen]);
  const close = useCallback(() => setSidebarOpen(false), [setSidebarOpen]);

  return { isOpen: activeWorkspace.layout.sidebarOpen, toggle, open, close };
}
