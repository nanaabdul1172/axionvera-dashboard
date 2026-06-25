# Architecture

## Overview

Axionvera Dashboard is a Next.js (Pages Router) application with a small set of UI components and custom hooks that encapsulate all Web3 behavior.

- UI components are presentational and reusable
- Hooks handle side effects (wallet connection, vault state, transactions)
- A thin SDK adapter isolates contract logic from UI so contributors can replace the mock with the real Axionvera SDK

## Data Flow

1. `useWallet` manages wallet connection and exposes the connected address
2. `useVault` consumes `walletAddress` and loads vault state (balances + transactions)
3. Pages and components render state and trigger actions (deposit/withdraw/claim)

## Key Modules

- `src/pages/dashboard.tsx`: wires wallet + vault hooks into the main dashboard UI
- `src/hooks/useWallet.ts`: re-exports from WalletContext (see wallet-architecture.md for the full stack)
- `src/wallets/`: wallet provider interface, registry, and built-in adapters (Freighter, Albedo)
- `src/services/walletService.ts`: thin service layer — connect/disconnect/switch/restoreSession
- `src/hooks/useVault.ts`: vault orchestration (load state, submit actions, refresh)
- `src/utils/networkConfig.ts`: Soroban RPC + Horizon configuration and contract IDs
- `src/utils/contractHelpers.ts`: SDK adapter interface + default mock implementation

See [wallet-architecture.md](./wallet-architecture.md) for a complete guide to the multi-wallet provider registry.

## SDK and Contract Interaction

The dashboard intentionally avoids binding UI directly to contract calls. Instead, it defines an interface (`AxionveraVaultSdk`) that can be implemented by:

- the real Axionvera SDK (recommended)
- a contract-call layer using `stellar-sdk` + Soroban RPC
- the included mock implementation (used for local development and tests)

To integrate the real Axionvera SDK:

1. Replace `createAxionveraVaultSdk()` in `src/utils/contractHelpers.ts` with an adapter that calls the SDK methods
2. Use `networkConfig.ts` to map the selected network to RPC endpoints and contract IDs
3. Keep `useVault` as the single place that the UI uses for vault actions

## Testing

Tests live in `tests/` and cover:

- component behavior (button rendering, basic interactions)
- hook behavior (`useWallet` and `useVault`)

The default vault implementation uses `localStorage` to make tests deterministic and fast.
