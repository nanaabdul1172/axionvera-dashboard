/**
 * @module wallets
 *
 * Public barrel export for the Axionvera wallet layer.
 *
 * Importing this module has the important **side effect** of registering
 * the built-in wallet adapters (Freighter, Albedo) into the singleton
 * `walletRegistry`.  You must import this module — directly or transitively
 * via `src/services/walletService.ts` — before calling `walletRegistry.list()`
 * or `walletRegistry.createAdapter()`.
 *
 * To add a new wallet:
 * 1. Create `src/wallets/adapters/<name>.ts` implementing `WalletProvider`.
 * 2. Add the wallet id to the `WalletId` union in `src/wallets/types.ts`.
 * 3. Register the factory here with `walletRegistry.register(...)`.
 * 4. Document the new adapter in `docs/wallet-architecture.md`.
 *
 * No changes to `WalletContext`, `Navbar`, or any page are required.
 */

// Re-export everything callers might need.
export type { WalletId, WalletMeta, WalletProvider, WalletCapabilities, WalletProviderFactory } from "./types";
export { WalletAdapterError } from "./types";
export { walletRegistry } from "./registry";

// Adapters (re-exported for testing / direct instantiation)
export { FreighterAdapter, createFreighterAdapter } from "./adapters/freighter";
export { AlbedoAdapter, createAlbedoAdapter } from "./adapters/albedo";

// ---------------------------------------------------------------------------
// Bootstrap — register built-in adapters
// ---------------------------------------------------------------------------

import { walletRegistry } from "./registry";
import { createFreighterAdapter } from "./adapters/freighter";
import { createAlbedoAdapter } from "./adapters/albedo";

walletRegistry.register("freighter", createFreighterAdapter);
walletRegistry.register("albedo", createAlbedoAdapter);
