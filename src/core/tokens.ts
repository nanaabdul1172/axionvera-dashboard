import { createServiceToken } from "./container";
import type { getProtocolHealthSnapshot } from "@/services/protocolHealth";
import type {
  connectWallet,
  disconnectWallet,
  getAvailableWallets,
  isWalletAvailable,
  pollSession,
  restoreSession,
  switchWallet,
} from "@/services/walletService";
import type { simulateDeposit, simulateWithdraw } from "@/services/sdk/simulationService";

export type ProtocolHealthServiceApi = {
  getProtocolHealthSnapshot: typeof getProtocolHealthSnapshot;
};

export type WalletServiceApi = {
  getAvailableWallets: typeof getAvailableWallets;
  isWalletAvailable: typeof isWalletAvailable;
  connectWallet: typeof connectWallet;
  disconnectWallet: typeof disconnectWallet;
  switchWallet: typeof switchWallet;
  restoreSession: typeof restoreSession;
  pollSession: typeof pollSession;
};

export type SimulationServiceApi = {
  simulateDeposit: typeof simulateDeposit;
  simulateWithdraw: typeof simulateWithdraw;
};

export const SERVICE_TOKENS = {
  protocolHealth: createServiceToken<ProtocolHealthServiceApi>("protocolHealth"),
  wallet: createServiceToken<WalletServiceApi>("wallet"),
  transactionSimulation: createServiceToken<SimulationServiceApi>("transactionSimulation"),
} as const;
