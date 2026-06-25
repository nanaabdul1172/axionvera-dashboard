/**
 * @module wallets/registry
 *
 * Singleton `WalletRegistry` that maps `WalletId` → `WalletProviderFactory`.
 *
 * Usage
 * -----
 * ```ts
 * // Register a new adapter (done once, in src/wallets/index.ts)
 * walletRegistry.register("myWallet", () => new MyWalletAdapter());
 *
 * // Retrieve registered metadata (used by the UI wallet-picker)
 * const wallets = walletRegistry.list(); // WalletMeta[]
 *
 * // Instantiate an adapter on demand
 * const adapter = walletRegistry.createAdapter("freighter");
 * ```
 *
 * Design notes
 * ------------
 * - Adapters are instantiated **lazily** (on `createAdapter`) to avoid
 *   side effects at import time (e.g. Freighter pings the extension on init).
 * - `register()` is idempotent — registering the same id twice overwrites
 *   the previous factory, which is useful for testing / mocking.
 */

import { WalletId, WalletMeta, WalletProvider, WalletProviderFactory } from "./types";

// ---------------------------------------------------------------------------
// Registry implementation
// ---------------------------------------------------------------------------

class WalletRegistry {
  private readonly factories = new Map<WalletId, WalletProviderFactory>();

  /**
   * Register a wallet adapter factory under the given `id`.
   * Call this once per wallet, typically inside `src/wallets/index.ts`.
   *
   * @param id       - Stable identifier (must extend `WalletId`)
   * @param factory  - Zero-arg function that returns a fresh adapter instance
   */
  register(id: WalletId, factory: WalletProviderFactory): void {
    this.factories.set(id, factory);
  }

  /**
   * Remove a previously registered wallet.
   * Primarily useful in unit tests that need a clean registry.
   */
  unregister(id: WalletId): void {
    this.factories.delete(id);
  }

  /**
   * Returns `true` when a factory has been registered for `id`.
   */
  has(id: WalletId): boolean {
    return this.factories.has(id);
  }

  /**
   * Retrieve the factory for `id`.
   * Throws if `id` is not registered — always call `has()` first or catch.
   */
  get(id: WalletId): WalletProviderFactory {
    const factory = this.factories.get(id);
    if (!factory) {
      throw new Error(
        `[WalletRegistry] No adapter registered for wallet id "${id}". ` +
        `Make sure you import "src/wallets/index.ts" before using the registry.`,
      );
    }
    return factory;
  }

  /**
   * Instantiate a fresh adapter for `id`.
   * Each call returns a **new** instance — callers should cache the result
   * if they need a long-lived adapter reference (e.g. inside `walletService`).
   */
  createAdapter(id: WalletId): WalletProvider {
    return this.get(id)();
  }

  /**
   * Returns the static `WalletMeta` for every registered wallet, in
   * registration order.  Used by the UI to render the wallet-picker.
   */
  list(): WalletMeta[] {
    return Array.from(this.factories.keys()).map((id) => {
      // Instantiate temporarily just to read meta — cheap, no network calls.
      const adapter = this.get(id)();
      return adapter.meta;
    });
  }

  /**
   * Returns all registered wallet ids.
   */
  ids(): WalletId[] {
    return Array.from(this.factories.keys());
  }

  /** @internal For testing only — removes all registered factories. */
  _reset(): void {
    this.factories.clear();
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

/**
 * The application-wide wallet registry.
 *
 * Import `src/wallets/index.ts` (not this module directly) to ensure the
 * built-in adapters are already registered before you call `list()` or
 * `createAdapter()`.
 */
export const walletRegistry = new WalletRegistry();
