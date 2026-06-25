/**
 * @module services/sdk/types
 *
 * Typed contracts for the transaction simulation layer.
 *
 * These types are shared between:
 *  - `simulationService.ts`      (the plain-async service)
 *  - `useSimulation.ts`          (the React hook)
 *  - `SimulationPanel.tsx`       (inline form preview)
 *  - `TransactionSimulationPreview.tsx` (confirmation modal)
 *
 * The legacy `SimulationResult` from `useTransactionSimulation` maps 1-to-1
 * to `SimulationOutcome` so existing call-sites are backward compatible.
 */

import type { StellarNetwork } from "@/utils/networkConfig";

// ---------------------------------------------------------------------------
// Request
// ---------------------------------------------------------------------------

export type SimulationTransactionType = "deposit" | "withdraw";

export interface SimulationRequest {
  type: SimulationTransactionType;
  /** Decimal string, e.g. "50.25" */
  amount: string;
  walletAddress: string;
  network: StellarNetwork;
}

// ---------------------------------------------------------------------------
// Step (shown in the UI checklist)
// ---------------------------------------------------------------------------

export type SimulationStepStatus = "pending" | "ok" | "warn" | "error";

export interface SimulationStep {
  /** Short label, e.g. "Fetch balance" */
  label: string;
  /** Optional detail line, e.g. "1,234.56 XLM available" */
  detail?: string;
  status: SimulationStepStatus;
}

// ---------------------------------------------------------------------------
// Outcome
// ---------------------------------------------------------------------------

export interface SimulationOutcome {
  type: SimulationTransactionType;
  /** Raw decimal string as entered by the user */
  amount: string;
  /** Vault balance before the transaction */
  currentBalance: string;
  /** Vault balance after the transaction (projected) */
  projectedBalance: string;
  /** Accrued rewards after the transaction (projected) */
  projectedRewards: string;
  /** Soroban network fee estimate (Stroops → XLM string) */
  estimatedFee: string;
  /** Signed change: positive for deposit, negative for withdraw */
  netChange: string;
  /** Ordered checklist of simulation steps */
  steps: SimulationStep[];
  /**
   * Non-fatal notices shown as amber banners in the UI.
   * e.g. "Your balance will fall below 10 XLM after this withdrawal."
   */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export type SimulationErrorCode =
  | "WALLET_NOT_CONNECTED"
  | "INVALID_AMOUNT"
  | "AMOUNT_TOO_LOW"
  | "AMOUNT_TOO_HIGH"
  | "INSUFFICIENT_FUNDS"
  | "SDK_FAILURE";

/** Suggested fix text shown below the error message in the UI. */
const SUGGESTED_FIX: Record<SimulationErrorCode, string> = {
  WALLET_NOT_CONNECTED: "Connect your wallet and try again.",
  INVALID_AMOUNT: "Enter a valid positive number.",
  AMOUNT_TOO_LOW: "The minimum transaction amount is 0.0001 XLM.",
  AMOUNT_TOO_HIGH: "The maximum transaction amount is 10,000 XLM.",
  INSUFFICIENT_FUNDS: "Reduce the amount or deposit more funds first.",
  SDK_FAILURE: "The simulation could not complete. Please try again.",
};

export class SimulationError extends Error {
  constructor(
    public readonly code: SimulationErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "SimulationError";
  }

  /** Short user-facing suggestion to resolve the error. */
  get suggestedFix(): string {
    return SUGGESTED_FIX[this.code];
  }
}
