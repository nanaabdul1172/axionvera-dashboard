# Wallet Architecture

## Overview

Axionvera Dashboard supports multiple Stellar wallet providers through a
**provider registry** pattern.  Each wallet is an isolated adapter module;
the UI discovers and switches wallets at runtime without any changes to page
components or the wallet context.

---

## Directory Structure

```
src/
├── wallets/
│   ├── types.ts              # WalletProvider interface, WalletMeta, WalletId, WalletAdapterError
│   ├── registry.ts           # WalletRegistry singleton
│   ├── index.ts              # Barrel export + bootstraps built-in adapters
│   └── adapters/
│       ├── freighter.ts      # Freighter browser-extension adapter
│       └── albedo.ts         # Albedo web-intent adapter
├── services/
│   └── walletService.ts      # connect / disconnect / switchWallet / restoreSession
├── contexts/
│   └── WalletContext.tsx     # React context — delegates to walletService
├── hooks/
│   └── useWallet.ts          # Re-exports from WalletContext
└── types/
    └── wallet.ts             # Public re-export of wallet types
```

---

## How the Registry Works

```
┌─────────────────────────────────────────────────────────────────┐
│  src/wallets/index.ts  (bootstraps on import)                   │
│                                                                 │
│  walletRegistry.register("freighter", createFreighterAdapter)   │
│  walletRegistry.register("albedo",    createAlbedoAdapter)      │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
               ┌─────────────────────────────┐
               │     WalletRegistry          │
               │  Map<WalletId, Factory>     │
               │                             │
               │  list()         → WalletMeta[]   (UI picker)
               │  createAdapter()→ WalletProvider  (lazy init)
               └─────────────────┬───────────┘
                                 │
                                 ▼
               ┌─────────────────────────────┐
               │     walletService.ts        │
               │                             │
               │  connectWallet(id)          │
               │  disconnectWallet(id)       │
               │  switchWallet(curr, new)    │
               │  restoreSession()           │
               │  getAvailableWallets()      │
               └─────────────────┬───────────┘
                                 │
                                 ▼
               ┌─────────────────────────────┐
               │     WalletContext.tsx       │
               │  React state + effects      │
               │  Exposes: connect,          │
               │  disconnect, switchWallet,  │
               │  availableWallets           │
               └─────────────────────────────┘
```

### Key design decisions

| Decision | Rationale |
|---|---|
| Factories stored, not instances | Adapters are instantiated lazily to avoid extension pings at import time |
| Service layer (no React) | `walletService.ts` contains only plain async functions — easy to unit-test without a browser |
| Session restore on mount | `restoreSession()` iterates registered adapters in order; first active session wins |
| Registry is a module-level singleton | One registry per page — safe in SSR because adapters guard `typeof window` |

---

## Built-in Wallets

| ID | Label | Extension required? | Capabilities |
|---|---|---|---|
| `freighter` | Freighter | Yes (browser extension) | publicKey, signTransaction |
| `albedo` | Albedo | No (web-based popup) | publicKey |

---

## Adding a New Wallet Adapter

Follow these four steps — **no other files need to change**.

### 1. Extend `WalletId`

```ts
// src/wallets/types.ts
export type WalletId = "freighter" | "albedo" | "rabet";   // ← add your id
```

### 2. Create the adapter

```ts
// src/wallets/adapters/rabet.ts
import { WalletProvider, WalletMeta, WalletAdapterError } from "../types";
import { StellarNetwork } from "@/utils/networkConfig";

const RABET_META: WalletMeta = {
  id: "rabet",
  label: "Rabet",
  description: "Stellar browser extension wallet.",
  installUrl: "https://rabet.io",
  icon: `<svg>…</svg>`,
  capabilities: { publicKey: true, signTransaction: true, signAuthEntry: false },
};

export class RabetAdapter implements WalletProvider {
  readonly meta = RABET_META;

  async isAvailable() { /* check window.rabet */ }
  async isConnected()  { /* check permission */ }
  async connect()      { /* return { address, network } */ }
  async disconnect()   { /* cleanup */ }
  async getActiveSession() { /* poll for changes */ }
}

export function createRabetAdapter() { return new RabetAdapter(); }
```

### 3. Register in `src/wallets/index.ts`

```ts
import { createRabetAdapter } from "./adapters/rabet";
walletRegistry.register("rabet", createRabetAdapter);
```

### 4. Document here

Add a row to the **Built-in Wallets** table above.

---

## Capability Flags

```ts
interface WalletCapabilities {
  publicKey: boolean;       // can return the user's Stellar public key
  signTransaction: boolean; // can sign and submit Stellar XDR transactions
  signAuthEntry: boolean;   // can sign Soroban auth entries (contract interactions)
}
```

The UI uses these flags to show or grey out advanced actions.  Future features
(e.g. Soroban contract auth) will check `capabilities.signAuthEntry` before
offering the action.

---

## Migration from the Old `WalletType` String Union

The original `WalletContext` used:

```ts
type WalletType = "freighter" | "albedo";
connect: (walletType: WalletType) => Promise<void>;
```

This is unchanged at the call site — `WalletId` is a drop-in alias:

```ts
// Before
connect("freighter");

// After (identical call, new type backing it)
connect("freighter");
```

The new additions on the context are additive:

```ts
availableWallets: WalletMeta[]        // read the list of registered wallets
switchWallet(newId: WalletId): Promise<void>  // atomic disconnect → connect
```

---

## Testing

- **Adapter unit tests** — instantiate the adapter directly and mock the
  underlying library (`@stellar/freighter-api`, `@albedo-link/intent`).
- **Registry tests** — use `walletRegistry._reset()` to start with an empty
  registry per test, then register a mock adapter.
- **Service tests** — import `walletService` functions directly (no React).
- **Context tests** — use `@testing-library/react` with a mock registry.

---

## Out of Scope

Hardware wallet support (Ledger, Trezor) is **explicitly out of scope** for
this feature.  The `WalletProvider` interface is designed to accommodate a
hardware adapter in a future PR — implement `signTransaction` using the
`@ledgerhq/stellar` transport when ready.
