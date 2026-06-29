import { useEffect, useRef, useState } from "react";

import { useWorkspace } from "./WorkspaceContext";

export function WorkspaceSwitcher() {
  const {
    state,
    activeWorkspace,
    createWorkspace,
    switchWorkspace,
    updateWorkspace,
  } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        document.getElementById("workspace-switcher-button")?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleCreateWorkspace() {
    const workspace = createWorkspace(newWorkspaceName);
    setNewWorkspaceName("");
    setIsOpen(false);
    switchWorkspace(workspace.id);
  }

  function handleRenameActiveWorkspace() {
    const nextName = window.prompt("Workspace name", activeWorkspace.name);
    if (!nextName) return;
    updateWorkspace(activeWorkspace.id, { name: nextName });
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        id="workspace-switcher-button"
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Switch workspace. Active workspace: ${activeWorkspace.name}`}
        onClick={() => setIsOpen((value) => !value)}
        className="flex h-10 min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-100/30 px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-200/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-200 dark:hover:bg-slate-900/60"
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-axion-500" aria-hidden="true" />
        <span className="hidden min-w-0 max-w-[14rem] truncate sm:inline">{activeWorkspace.name}</span>
        <svg
          className={`h-3 w-3 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-labelledby="workspace-switcher-button"
          className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] origin-top-right rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 dark:border-slate-800 dark:bg-slate-950 dark:ring-white/5"
        >
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Workspaces
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-white">
              {activeWorkspace.name}
            </p>
          </div>

          <div className="max-h-64 space-y-1 overflow-y-auto px-2 py-2">
            {state.workspaces.map((workspace) => {
              const isActive = workspace.id === activeWorkspace.id;
              return (
                <button
                  key={workspace.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  onClick={() => {
                    switchWorkspace(workspace.id);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                    isActive
                      ? "bg-axion-50 text-axion-700 dark:bg-axion-500/10 dark:text-axion-300"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900/60"
                  }`}
                >
                  <span className="min-w-0 truncate">{workspace.name}</span>
                  {isActive && <span className="text-xs font-medium">Active</span>}
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-100 px-3 py-3 dark:border-slate-800">
            <label
              htmlFor="new-workspace-name"
              className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              New workspace
            </label>
            <div className="flex gap-2">
              <input
                id="new-workspace-name"
                value={newWorkspaceName}
                onChange={(event) => setNewWorkspaceName(event.target.value)}
                placeholder="Trading, ops, research"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-axion-400 focus:ring-2 focus:ring-axion-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
              <button
                type="button"
                onClick={handleCreateWorkspace}
                className="rounded-xl bg-axion-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-axion-400"
              >
                Create
              </button>
            </div>
            <button
              type="button"
              onClick={handleRenameActiveWorkspace}
              className="mt-2 text-xs font-medium text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Rename active workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
