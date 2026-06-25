/**
 * @module wallets/adapters/albedo
 *
 * Albedo wallet adapter.
 *
 * Albedo (https://albedo.link) is a web-based Stellar intent service.
 * It does not require a browser extension — users are redirected to the Albedo
 * web app which handles signing and returns results via a popup / intent flow.
 *
 * Capabilities
 * ------------
 * - publicKey       ✓
 * - signTransaction ✗  (Albedo uses an intent-based flow; raw tx signing is
 *                        handled through the Albedo popup, not the adapter)
 * - signAuthEntry   ✗
 *
 * Because Albedo is always "available" (it's web-based), `isAvailable()`
 * always returns `true` in browser environments.
 */

import { NETWORK, StellarNetwork } from "@/utils/networkConfig";
import { WalletAdapterError, WalletMeta, WalletProvider } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Lazy-load the Albedo intent library to avoid bundling it when not used. */
async function loadAlbedo() {
  const mod = await import("@albedo-link/intent");
  return mod.default;
}

// ---------------------------------------------------------------------------
// Session storage key
// ---------------------------------------------------------------------------

const ALBEDO_SESSION_KEY = "axionvera:albedo:pubkey";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

const ALBEDO_META: WalletMeta = {
  id: "albedo",
  label: "Albedo",
  description: "Web-based Stellar wallet — no extension required.",
  installUrl: "https://albedo.link",
  icon: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="10" fill="#1A1A2E"/>
    <circle cx="20" cy="20" r="9" fill="none" stroke="#E94560" strokeWidth="2.5"/>
    <circle cx="20" cy="20" r="4" fill="#E94560"/>
    <path d="M20 5v4M20 31v4M5 20h4M31 20h4" stroke="#E94560" strokeWidth="2" strokeLinecap="round"/>
  </svg>`,
  capabilities: {
    publicKey: true,
    signTransaction: false,
    signAuthEntry: false,
  },
};

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class AlbedoAdapter implements WalletProvider {
  readonly meta: WalletMeta = ALBEDO_META;

  /** Albedo is web-based; it is always "available" in browser environments. */
  async isAvailable(): Promise<boolean> {
    return typeof window !== "undefined";
  }

  /**
   * We store the Albedo public key in sessionStorage after a successful
   * connect so the session can be restored on page refresh.
   */
  async isConnected(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    const stored = sessionStorage.getItem(ALBEDO_SESSION_KEY);
    return Boolean(stored);
  }

  async connect(): Promise<{ address: string; network: StellarNetwork }> {
    if (typeof window === "undefined") {
      throw new WalletAdapterError(
        "NOT_AVAILABLE",
        "Albedo is only available in the browser.",
      );
    }

    let albedo: Awaited<ReturnType<typeof loadAlbedo>>;
    try {
      albedo = await loadAlbedo();
    } catch (cause) {
      throw new WalletAdapterError(
        "NOT_AVAILABLE",
        "Failed to load the Albedo intent library.",
        cause,
      );
    }

    let result: { pubkey: string };
    try {
      result = await albedo.publicKey({});
    } catch (cause) {
      // Albedo throws when the user closes the popup or rejects the request.
      throw new WalletAdapterError(
        "USER_REJECTED",
        "User rejected the Albedo authorization request.",
        cause,
      );
    }

    const address = result.pubkey;

    // Persist session for page refreshes.
    try {
      sessionStorage.setItem(ALBEDO_SESSION_KEY, address);
    } catch {
      // sessionStorage may be blocked (e.g. private mode). Non-fatal.
    }

    return { address, network: NETWORK };
  }

  async disconnect(): Promise<void> {
    try {
      sessionStorage.removeItem(ALBEDO_SESSION_KEY);
    } catch {
      // Ignore storage errors during disconnect.
    }
  }

  async getActiveSession(): Promise<{ address: string; network: StellarNetwork } | null> {
    if (typeof window === "undefined") return null;
    try {
      const address = sessionStorage.getItem(ALBEDO_SESSION_KEY);
      if (!address) return null;
      return { address, network: NETWORK };
    } catch {
      return null;
    }
  }
}

/** Factory function used by the wallet registry. */
export function createAlbedoAdapter(): WalletProvider {
  return new AlbedoAdapter();
}
