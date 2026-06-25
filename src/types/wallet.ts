/**
 * @module types/wallet
 *
 * Public-facing re-exports of wallet types.
 *
 * Consumers throughout the app (pages, components, hooks) should import from
 * this path (`@/types/wallet`) rather than from the internal implementation
 * (`@/wallets/types`) so the internal module layout can evolve independently.
 */

export type {
  WalletId,
  WalletMeta,
  WalletProvider,
  WalletCapabilities,
  WalletProviderFactory,
} from "@/wallets/types";

export { WalletAdapterError } from "@/wallets/types";
