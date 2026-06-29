import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import { WorkspaceProvider, WORKSPACE_STORAGE_KEY, WorkspaceStore } from '@/workspaces';

import { useSidebar } from './useSidebar';

function createMemoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: jest.fn((key: string) => data.get(key) ?? null),
    setItem: jest.fn((key: string, value: string) => {
      data.set(key, value);
    }),
    removeItem: jest.fn((key: string) => {
      data.delete(key);
    }),
    clear: jest.fn(() => {
      data.clear();
    }),
    read: (key: string) => data.get(key) ?? null,
  };
}

describe('useSidebar', () => {
  function renderSidebarHook(storage = createMemoryStorage()) {
    Object.defineProperty(window, 'localStorage', {
      value: storage,
      configurable: true,
    });

    const store = new WorkspaceStore(storage);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <WorkspaceProvider store={store}>{children}</WorkspaceProvider>
    );

    return {
      storage,
      store,
      ...renderHook(() => useSidebar(), { wrapper }),
    };
  }

  it('defaults to the active workspace sidebar state', () => {
    const { result } = renderSidebarHook();

    expect(result.current.isOpen).toBe(true);
  });

  it('migrates the legacy sidebar key into the active workspace', async () => {
    const storage = createMemoryStorage({ 'sidebar-open': 'false' });

    const { result, store } = renderSidebarHook(storage);

    await waitFor(() => expect(result.current.isOpen).toBe(false));
    expect(store.getActiveWorkspace().layout.sidebarOpen).toBe(false);
    expect(storage.removeItem).toHaveBeenCalledWith('sidebar-open');
  });

  it('persists toggles in workspace storage', async () => {
    const { result, storage, store } = renderSidebarHook();

    act(() => {
      result.current.toggle();
    });

    await waitFor(() => expect(result.current.isOpen).toBe(false));
    expect(store.getActiveWorkspace().layout.sidebarOpen).toBe(false);

    const persistedState = JSON.parse(storage.read(WORKSPACE_STORAGE_KEY) ?? '{}');
    expect(persistedState.workspaces[0].layout.sidebarOpen).toBe(false);
    expect(storage.setItem).toHaveBeenCalledWith(
      WORKSPACE_STORAGE_KEY,
      expect.stringContaining('"sidebarOpen":false'),
    );
  });

  it('provides toggle, open, and close actions', async () => {
    const storage = createMemoryStorage({ 'sidebar-open': 'false' });
    const { result } = renderSidebarHook(storage);

    await waitFor(() => expect(result.current.isOpen).toBe(false));

    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);

    expect(typeof result.current.toggle).toBe('function');
  });
});