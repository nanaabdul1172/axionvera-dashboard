/**
 * @module hooks/useWallet
 *
 * Convenience re-exports from the wallet context and provider registry.
 *
 * Consuming components should import from this path rather than from the
 * internal context module directly, keeping the import surface stable as
 * the implementation evolves.
 *
 * Available via this module:
 *   useWalletContext / useWallet — React hook that returns the full wallet context
 *   WalletProvider              — React provider component
 *
 * Registry / type utilities (imported directly by callers as needed):
 *   @/wallets     — walletRegistry, adapters, types
 *   @/types/wallet — WalletId, WalletMeta, WalletProvider interface
 *   @/services/walletService — connectWallet, disconnectWallet, switchWallet, etc.
 */
export { useWalletContext, useWallet, WalletProvider } from "@/contexts/WalletContext";
