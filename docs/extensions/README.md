# Dashboard Extension SDK

The Dashboard Extension SDK lets third-party developers add custom modules, widgets, panels, and integrations without changing the core dashboard application.

## Architecture

Extensions are loaded by `ExtensionHost`. The core dashboard owns a singleton host and bundled loader in `src/core/extensions.ts`. Each extension exports a manifest plus lifecycle hooks. During activation the host provides an `ExtensionContext` that exposes registration APIs for contributions. Invalid manifests, duplicate IDs, failed activation, and invalid contributions are rejected before they can mutate the host registry.

```ts
import { ExtensionHost } from "@/sdk";
import { sampleProtocolExtension } from "@/extensions";

const host = new ExtensionHost();
await host.register(sampleProtocolExtension);
const widgets = host.getContributions("widget");
```

## Extension contract

```ts
import type { DashboardExtension } from "@/sdk";

export const myExtension: DashboardExtension = {
  manifest: {
    id: "third-party.my-extension",
    name: "My Extension",
    version: "1.0.0",
  },
  activate(context) {
    context.registerContribution({
      id: "my-extension.widget",
      type: "widget",
      title: "My Widget",
      description: "A custom dashboard widget.",
    });
  },
  deactivate(context) {
    context.unregisterContribution("my-extension.widget");
  },
};
```

## Lifecycle

1. **Resolve**: Dynamic modules, default exports, or factory functions are normalized into a `DashboardExtension`.
2. **Validate**: The manifest must include a safe ID, name, version, and an activate hook.
3. **Activate**: The host calls `activate(context)` and records contributions registered through the context.
4. **Use**: Dashboard surfaces query contributions by type (`module`, `widget`, `panel`, or `integration`).
5. **Deactivate**: The host calls the optional `deactivate` hook and removes the extension's contributions.

## Dynamic loading

`ExtensionHost.load` accepts a direct extension object, a factory, or a module with a `default` export. This keeps the SDK compatible with route-based code splitting and future remote loaders while preserving validation at the host boundary.

## Safety rules

- Extension IDs and contribution IDs must be lowercase slugs containing letters, numbers, dots, or hyphens.
- Duplicate extension IDs are rejected.
- Invalid contributions throw during activation and cause the extension to be rolled back.
- Failed activation removes the extension from the registry.
- Contributions are scoped to the extension context that registered them.

## Sample extension

See `src/extensions/sampleProtocolExtension.ts` for a complete sample that registers a protocol health widget and operations panel.
