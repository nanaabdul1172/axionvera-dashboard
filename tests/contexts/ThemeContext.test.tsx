import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { WorkspaceProvider, WORKSPACE_STORAGE_KEY, WorkspaceStore } from '@/workspaces';

interface MockMediaQueryList extends MediaQueryList {
  triggerChange: (newMatches: boolean) => void;
}

// Mock matchMedia
const mockMatchMedia = (matches: boolean) => {
  let changeListener: EventListenerOrEventListenerObject | null = null;
  const state = {
    matches,
    media: ''
  };

  const mediaQueryList = {
    get matches() {
      return state.matches;
    },
    get media() {
      return state.media;
    },
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn((event: string, listener: EventListenerOrEventListenerObject) => {
      if (event === 'change') changeListener = listener;
    }),
    removeEventListener: jest.fn((event: string, listener: EventListenerOrEventListenerObject) => {
      if (event === 'change' && changeListener === listener) changeListener = null;
    }),
    dispatchEvent: jest.fn(),
    triggerChange: (newMatches: boolean) => {
      state.matches = newMatches;
      if (changeListener) {
        if (typeof changeListener === 'function') {
          changeListener({ matches: newMatches } as any);
        } else {
          changeListener.handleEvent({ matches: newMatches } as any);
        }
      }
    }
  } as MockMediaQueryList;

  return jest.fn().mockImplementation(query => {
    state.media = query;
    return mediaQueryList;
  });
};

const TestComponent = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('system')}>Set System</button>
    </div>
  );
};

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

describe('ThemeContext', () => {
  let matchMediaMock: any;

  beforeEach(() => {
    localStorage.clear();
    matchMediaMock = mockMatchMedia(false);
    window.matchMedia = matchMediaMock;
    document.documentElement.setAttribute('data-theme', '');
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with system theme light if matches is false', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('system');
    expect(screen.getByTestId('resolved').textContent).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('initializes with system theme dark if matches is true', () => {
    window.matchMedia = mockMatchMedia(true);
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('system');
    expect(screen.getByTestId('resolved').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('reads initial theme from localStorage', () => {
    localStorage.setItem('theme-preference', 'dark');
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(screen.getByTestId('resolved').textContent).toBe('dark');
  });

  it('updates theme and localStorage when setTheme is called', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await act(async () => {
      screen.getByText('Set Dark').click();
    });

    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(screen.getByTestId('resolved').textContent).toBe('dark');
    expect(localStorage.getItem('theme-preference')).toBe('dark');
  });

  it('migrates legacy theme preference into the active workspace', async () => {
    const storage = createMemoryStorage({ 'theme-preference': 'dark' });
    Object.defineProperty(window, 'localStorage', {
      value: storage,
      configurable: true,
    });
    const store = new WorkspaceStore(storage);

    render(
      <WorkspaceProvider store={store}>
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      </WorkspaceProvider>
    );

    await screen.findByTestId('theme');
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(store.getActiveWorkspace().preferences.theme).toBe('dark');
    expect(storage.removeItem).toHaveBeenCalledWith('theme-preference');

    const persistedState = JSON.parse(storage.read(WORKSPACE_STORAGE_KEY) ?? '{}');
    expect(persistedState.workspaces[0].preferences.theme).toBe('dark');
  });

  it('updates resolved theme when system preference changes', async () => {
    window.matchMedia = matchMediaMock;
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('resolved').textContent).toBe('light');

    act(() => {
      const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)') as MockMediaQueryList;
      mediaQueryList.triggerChange(true);
      jest.advanceTimersByTime(100);
    });

    expect(screen.getByTestId('resolved').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
