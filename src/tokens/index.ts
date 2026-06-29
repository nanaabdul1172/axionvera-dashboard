import tokenSpec from '../tokens.json';

export type ThemeName = keyof typeof tokenSpec.themes;
export type TokenSpec = typeof tokenSpec;
export type TokenPath = string;

export const tokens = tokenSpec;
export const themeNames = Object.keys(tokenSpec.themes) as ThemeName[];

function flattenTokens(obj: unknown, prefix: string[] = [], output: Record<string, string> = {}) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return output;

  Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
    const next = [...prefix, key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenTokens(value, next, output);
    } else if (typeof value === 'string') {
      output[next.join('.')] = value;
    }
  });

  return output;
}

export const baseTokenMap = flattenTokens(tokenSpec.base);

export function getThemeTokenMap(theme: ThemeName) {
  return flattenTokens(tokenSpec.themes[theme]);
}

export function resolveToken(path: TokenPath, theme: ThemeName = 'light') {
  const themeValue = getThemeTokenMap(theme)[path];
  if (themeValue) return themeValue;

  const baseValue = baseTokenMap[path];
  if (baseValue) return baseValue;

  throw new Error(`Unknown design token: ${path}`);
}

export function cssVar(path: TokenPath, fallback?: string) {
  const variable = `--token-${path.replace(/\./g, '-')}`;
  return fallback ? `var(${variable}, ${fallback})` : `var(${variable})`;
}

export function themeAttribute(theme: ThemeName) {
  return { 'data-theme': theme } as const;
}
