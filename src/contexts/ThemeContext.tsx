import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

import { useOptionalWorkspace } from '@/workspaces';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';
const LEGACY_THEME_KEY = 'theme-preference';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const workspaceContext = useOptionalWorkspace();
  const hasWorkspace = Boolean(workspaceContext);
  const workspaceId = workspaceContext?.activeWorkspace.id;
  const workspaceTheme = workspaceContext?.activeWorkspace.preferences.theme;
  const updateWorkspace = workspaceContext?.updateWorkspace;
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (hasWorkspace && workspaceId && updateWorkspace) {
      const savedTheme = localStorage.getItem(LEGACY_THEME_KEY) as Theme | null;
      if (isTheme(savedTheme)) {
        setThemeState(savedTheme);
        updateWorkspace(workspaceId, {
          preferences: { theme: savedTheme },
        });
        localStorage.removeItem(LEGACY_THEME_KEY);
      } else {
        setThemeState(workspaceTheme ?? 'system');
      }
    } else {
      const savedTheme = localStorage.getItem(LEGACY_THEME_KEY) as Theme | null;
      if (isTheme(savedTheme)) {
        setThemeState(savedTheme);
      }
    }
    setMounted(true);
  }, [hasWorkspace, updateWorkspace, workspaceId, workspaceTheme]);

  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateTheme = () => {
      let resolved: ResolvedTheme;
      if (theme === 'system') {
        resolved = mediaQuery.matches ? 'dark' : 'light';
      } else {
        resolved = theme;
      }
      setResolvedTheme(resolved);
      document.documentElement.setAttribute('data-theme', resolved);
    };

    updateTheme();

    if (theme === 'system') {
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (workspaceContext) {
      workspaceContext.updateWorkspace(workspaceContext.activeWorkspace.id, {
        preferences: { theme: newTheme },
      });
    } else {
      localStorage.setItem(LEGACY_THEME_KEY, newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
