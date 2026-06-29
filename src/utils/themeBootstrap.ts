export const themeBootstrapScript = `
  (function() {
    try {
      var savedTheme = localStorage.getItem('theme-preference');
      var workspaceState = localStorage.getItem('axionvera-workspaces');
      if (workspaceState) {
        try {
          var parsedWorkspaceState = JSON.parse(workspaceState);
          var activeWorkspace = parsedWorkspaceState.workspaces && parsedWorkspaceState.workspaces.find(function(workspace) {
            return workspace.id === parsedWorkspaceState.activeWorkspaceId;
          });
          if (activeWorkspace && activeWorkspace.preferences) {
            savedTheme = activeWorkspace.preferences.theme;
          }
        } catch (workspaceError) {}
      }
      var resolvedTheme;
      if (savedTheme === 'dark' || savedTheme === 'light') {
        resolvedTheme = savedTheme;
      } else {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', resolvedTheme);
    } catch (e) {}
  })();
`;
