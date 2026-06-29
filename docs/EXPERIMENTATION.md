# Dashboard Feature Experimentation

Axionvera dashboard experiments are client-side feature gates for safely rolling out dashboard functionality before general availability. They are intended for product and maintainer-facing UI changes, not backend experimentation, marketing A/B tests, or surveys.

## Rollout strategy

1. Add an experiment in `src/config/experiments.ts` with a stable `key`, `defaultVariant`, weighted `variants`, and optional `audience` targeting.
2. Keep new experiments in `draft` with `percentage: 0` until the feature is ready for maintainer validation.
3. Move the experiment to `active`, raise the percentage gradually, and optionally target specific wallets or roles first.
4. Monitor exposure and conversion events from the analytics hook.
5. Mark the experiment `completed` and remove dead code after the winning variant becomes the default experience.

## Configuration example

```ts
{
  key: "dashboard-command-center",
  description: "New dashboard command center layout for authenticated maintainers.",
  status: "active",
  defaultVariant: "control",
  audience: { percentage: 25, roles: ["maintainer", "admin"] },
  variants: [
    { key: "control", weight: 1 },
    { key: "command-center", weight: 1 },
  ],
}
```

## Evaluating an experiment

Use `useExperiment` from `src/hooks/useExperiment.ts` in UI code. The hook evaluates targeting, persists the assignment to local storage, and emits an exposure event when a subject is assigned.

```tsx
const commandCenter = useExperiment("dashboard-command-center", {
  walletAddress: wallet.publicKey,
  roles: userRoles,
});

return commandCenter.enabled ? <CommandCenter /> : <Dashboard />;
```

## Analytics lifecycle

`trackExperimentEvent` emits `experiment_exposure` and `experiment_conversion` payloads. Applications can register a sink with `setExperimentAnalyticsSink`; otherwise the framework dispatches a browser `axionvera:experiment` event for existing telemetry bridges.

## Persistence

Assignments are stored under `axionvera:experiments:v1` in `localStorage` so refreshes keep the same evaluated state for the current browser profile. Server-side rendering returns safe defaults and does not access browser storage.
