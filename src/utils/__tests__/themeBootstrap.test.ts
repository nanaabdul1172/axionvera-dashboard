import { themeBootstrapScript } from '../themeBootstrap';

describe('themeBootstrap', () => {
  it('should export a valid script string', () => {
    expect(typeof themeBootstrapScript).toBe('string');
    expect(themeBootstrapScript).toContain('localStorage.getItem(\'axionvera-workspaces\')');
    expect(themeBootstrapScript).toContain('activeWorkspace.preferences.theme');
    expect(themeBootstrapScript).toContain('localStorage.getItem(\'theme-preference\')');
    expect(themeBootstrapScript).toContain('document.documentElement.setAttribute(\'data-theme\', resolvedTheme)');
  });
});
