# Workspace API

Workspaces are local dashboard environments for isolating layout state,
preferences, and protocol views. They are intentionally local-only; team
collaboration, account management, and cloud sync are out of scope.

## Persistence

Workspace state is stored in `localStorage` under `axionvera-workspaces`.
The persisted object is versioned:

```ts
interface WorkspaceState {
  version: 1;
  activeWorkspaceId: string;
  workspaces: Workspace[];
}
```

Invalid or legacy data is normalized on load. If parsing fails, the store falls
back to a default workspace.

## Model

Each workspace contains:

- `layout.sidebarOpen`: isolated sidebar state.
- `layout.defaultView`: the preferred landing view for the workspace.
- `layout.visibleViews`: enabled protocol views for the workspace.
- `preferences.theme`: `light`, `dark`, or `system`.
- `preferences.network`: `testnet`, `mainnet`, or `custom`.
- `preferences.pinnedWallets`: wallet addresses associated with the workspace.

## React Usage

Wrap the app with `WorkspaceProvider`, then consume `useWorkspace()`:

```tsx
const {
  activeWorkspace,
  createWorkspace,
  switchWorkspace,
  updateWorkspace,
} = useWorkspace();
```

`WorkspaceSwitcher` is the default UI entry point and is rendered in the
navbar. It supports switching, creating, and renaming workspaces.

## Migration Notes

Existing users receive a single `Default workspace` on first load. The
workspace-aware sidebar hook migrates the previous `sidebar-open` localStorage
value into that default workspace preference when available.

