import { cssVar, resolveToken, themeNames, tokens } from '@/tokens';

describe('design tokens', () => {
  it('exposes the supported runtime themes', () => {
    expect(themeNames).toEqual(['light', 'dark']);
  });

  it('resolves semantic theme tokens', () => {
    expect(resolveToken('color.background.primary', 'light')).toBe('#ffffff');
    expect(resolveToken('color.background.primary', 'dark')).toBe('#020617');
    expect(resolveToken('color.border.focus', 'dark')).toBe('#60a5fa');
  });

  it('falls back to base tokens when resolving non-themed values', () => {
    expect(resolveToken('spacing.4')).toBe('1rem');
    expect(resolveToken('component.controlHeight.md')).toBe('2.75rem');
  });

  it('builds CSS variable references from token paths', () => {
    expect(cssVar('transition.duration.base')).toBe('var(--token-transition-duration-base)');
    expect(cssVar('spacing.4', '1rem')).toBe('var(--token-spacing-4, 1rem)');
  });

  it('keeps semantic color groups available for each theme', () => {
    for (const themeName of themeNames) {
      expect(tokens.themes[themeName].color.background.primary).toBeTruthy();
      expect(tokens.themes[themeName].color.text.primary).toBeTruthy();
      expect(tokens.themes[themeName].color.border.primary).toBeTruthy();
    }
  });
});
