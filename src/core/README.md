# Dashboard Dependency Injection

The dashboard uses a small dependency injection container in `src/core` to keep feature modules from importing concrete services directly.

## Dependency graph

```text
ServiceProvider
└── applicationContainer
    ├── protocolHealth -> services/protocolHealth
    ├── wallet -> services/walletService
    └── transactionSimulation -> services/sdk/simulationService
```

React code accesses the container with `useServiceContainer()` and resolves typed tokens from `SERVICE_TOKENS`.

## Registration API

Register services in `registerApplicationServices()`:

```ts
container.registerSingleton(SERVICE_TOKENS.protocolHealth, () => protocolHealth);
container.registerTransient(MY_TOKEN, (services) => new FeatureClient(services.resolve(OTHER_TOKEN)));
```

- `registerSingleton` creates one instance and reuses it for every resolve.
- `registerTransient` creates a new instance each time the token is resolved.
- `createChild()` copies registrations without singleton instances, which is useful for tests and story fixtures.

## Circular dependencies

The container tracks the active resolution stack. If a factory resolves a token that is already being constructed, resolution fails with `ServiceResolutionError` before a partially initialized service can be returned.

## Migration notes

1. Export the service surface as a type in `src/core/tokens.ts`.
2. Add a token to `SERVICE_TOKENS`.
3. Register the implementation in `src/core/appServices.ts`.
4. In hooks or providers, resolve the service through `useServiceContainer()` instead of importing concrete functions.
5. In tests, create a fresh container and register mock implementations for the tokens under test.
