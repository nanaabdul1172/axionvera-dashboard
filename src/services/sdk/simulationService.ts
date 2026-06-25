/**
 * @module services/sdk/simulationService
 *
 * Plain async service that runs pre-flight transaction simulations.
 *
 * Responsibilities
 * ----------------
 * 1. Fetch current vault balances from the SDK.
 * 2. Validate the requested amount (bounds + balance constraints).
 * 3. Compute projected outcomes (balance, rewards, fees).
 * 4. Return a typed `SimulationOutcome` — including a UI-ready `steps[]`
 *    checklist and non-fatal `warnings[]`.
 *
 * Intentionally React-free so it is testable in isolation and reusable
 * outside React component trees.
 *
 * To integrate a real Soroban RPC simulation call:
 *   1. Add `simulateDeposit` / `simulateWithdraw` to `AxionveraVaultSdk`
 *      (the interface in `src/utils/contractHelpers.ts`).
 *   2. Call `sdk.simulateDeposit(...)` in `_runSimulation()` below
 *      instead of the local arithmetic.
 *   See `docs/simulation-workflow.md` for a step-by-step guide.
 */

import {
  createAxionveraVaultSdk,
  formatAmount,
} from "@/utils/contractHelpers";
import { NETWORK } from "@/utils/networkConfig";
import {
  SimulationError,
  type SimulationOutcome,
  type SimulationRequest,
  type SimulationStep,
} from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum transaction amount (XLM) */
const MIN_AMOUNT = 0.0001;
/** Maximum transaction amount (XLM) */
const MAX_AMOUNT = 10_000;
/** Soroban base network fee (XLM) — replace with dynamic fee estimate when available */
const ESTIMATED_NETWORK_FEE = "0.00001";
/** Expected reward accrual rate for deposits (1 %) */
const DEPOSIT_REWARD_RATE = 0.01;
/** Balance threshold below which a low-balance warning is issued (XLM) */
const LOW_BALANCE_WARNING_THRESHOLD = 10;

// ---------------------------------------------------------------------------
// Singleton SDK (avoid creating a new instance on every call)
// ---------------------------------------------------------------------------

let _sdk: ReturnType<typeof createAxionveraVaultSdk> | null = null;
function getSdk() {
  if (!_sdk) _sdk = createAxionveraVaultSdk();
  return _sdk;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Simulate a deposit transaction.
 *
 * @throws {SimulationError} — typed error with `code` and `suggestedFix`
 */
export async function simulateDeposit(
  request: SimulationRequest,
): Promise<SimulationOutcome> {
  return _runSimulation({ ...request, type: "deposit" });
}

/**
 * Simulate a withdraw transaction.
 *
 * @throws {SimulationError} — typed error with `code` and `suggestedFix`
 */
export async function simulateWithdraw(
  request: SimulationRequest,
): Promise<SimulationOutcome> {
  return _runSimulation({ ...request, type: "withdraw" });
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

async function _runSimulation(
  request: SimulationRequest,
): Promise<SimulationOutcome> {
  const { type, amount: amountInput, walletAddress } = request;

  const steps: SimulationStep[] = [];

  // ------------------------------------------------------------------
  // Step 1: Wallet check
  // ------------------------------------------------------------------
  if (!walletAddress) {
    throw new SimulationError(
      "WALLET_NOT_CONNECTED",
      "Wallet is not connected.",
    );
  }

  // ------------------------------------------------------------------
  // Step 2: Parse & validate amount
  // ------------------------------------------------------------------
  steps.push({ label: "Validate amount", status: "pending" });

  const amount = parseFloat(amountInput);

  if (!Number.isFinite(amount) || amount <= 0) {
    steps[steps.length - 1] = {
      label: "Validate amount",
      detail: "Amount must be a positive number.",
      status: "error",
    };
    throw new SimulationError(
      "INVALID_AMOUNT",
      "Enter a valid positive amount.",
    );
  }

  if (amount < MIN_AMOUNT) {
    steps[steps.length - 1] = {
      label: "Validate amount",
      detail: `Minimum is ${MIN_AMOUNT} XLM.`,
      status: "error",
    };
    throw new SimulationError(
      "AMOUNT_TOO_LOW",
      `Minimum transaction amount is ${MIN_AMOUNT} XLM.`,
    );
  }

  if (amount > MAX_AMOUNT) {
    steps[steps.length - 1] = {
      label: "Validate amount",
      detail: `Maximum is ${MAX_AMOUNT.toLocaleString()} XLM.`,
      status: "error",
    };
    throw new SimulationError(
      "AMOUNT_TOO_HIGH",
      `Maximum transaction amount is ${MAX_AMOUNT.toLocaleString()} XLM.`,
    );
  }

  steps[steps.length - 1] = {
    label: "Validate amount",
    detail: `${formatAmount(amountInput)} XLM`,
    status: "ok",
  };

  // ------------------------------------------------------------------
  // Step 3: Fetch current balances
  // ------------------------------------------------------------------
  steps.push({ label: "Fetch current balance", status: "pending" });

  let currentBalance: number;
  let currentRewards: number;

  try {
    const sdk = getSdk();
    const balances = await sdk.getBalances({
      walletAddress,
      network: NETWORK,
    });
    currentBalance = parseFloat(balances.balance);
    currentRewards = parseFloat(balances.rewards);

    steps[steps.length - 1] = {
      label: "Fetch current balance",
      detail: `${formatAmount(balances.balance)} XLM available`,
      status: "ok",
    };
  } catch (err) {
    steps[steps.length - 1] = {
      label: "Fetch current balance",
      detail: "Could not load balance.",
      status: "error",
    };
    throw new SimulationError(
      "SDK_FAILURE",
      "Failed to fetch current balance.",
      err,
    );
  }

  // ------------------------------------------------------------------
  // Step 4: Balance constraint check (withdraw only)
  // ------------------------------------------------------------------
  if (type === "withdraw") {
    steps.push({ label: "Check sufficient funds", status: "pending" });

    if (amount > currentBalance) {
      steps[steps.length - 1] = {
        label: "Check sufficient funds",
        detail: `Need ${formatAmount(amountInput)} XLM, have ${formatAmount(
          currentBalance.toString(),
        )} XLM.`,
        status: "error",
      };
      throw new SimulationError(
        "INSUFFICIENT_FUNDS",
        `Insufficient balance. Available: ${formatAmount(
          currentBalance.toString(),
        )} XLM`,
      );
    }

    steps[steps.length - 1] = {
      label: "Check sufficient funds",
      detail: `${formatAmount(currentBalance.toString())} XLM available`,
      status: "ok",
    };
  }

  // ------------------------------------------------------------------
  // Step 5: Project outcome
  // ------------------------------------------------------------------
  steps.push({ label: "Project outcome", status: "pending" });

  let projectedBalance: number;
  let projectedRewards: number;
  let netChange: number;

  if (type === "deposit") {
    projectedBalance = currentBalance + amount;
    projectedRewards = currentRewards + amount * DEPOSIT_REWARD_RATE;
    netChange = amount;
  } else {
    projectedBalance = Math.max(0, currentBalance - amount);
    projectedRewards = currentRewards;
    netChange = -amount;
  }

  steps[steps.length - 1] = {
    label: "Project outcome",
    detail: `${formatAmount(projectedBalance.toString())} XLM after transaction`,
    status: "ok",
  };

  // ------------------------------------------------------------------
  // Step 6: Collect warnings (non-fatal)
  // ------------------------------------------------------------------
  const warnings: string[] = [];

  if (
    type === "withdraw" &&
    projectedBalance < LOW_BALANCE_WARNING_THRESHOLD &&
    projectedBalance >= 0
  ) {
    warnings.push(
      `Your vault balance will drop below ${LOW_BALANCE_WARNING_THRESHOLD} XLM after this withdrawal.`,
    );
  }

  if (type === "deposit" && amount >= MAX_AMOUNT * 0.9) {
    warnings.push("This deposit is near the single-transaction limit of 10,000 XLM.");
  }

  // ------------------------------------------------------------------
  // Done
  // ------------------------------------------------------------------
  return {
    type,
    amount: amountInput,
    currentBalance: currentBalance.toString(),
    projectedBalance: projectedBalance.toString(),
    projectedRewards: projectedRewards.toString(),
    estimatedFee: ESTIMATED_NETWORK_FEE,
    netChange: netChange.toString(),
    steps,
    warnings,
  };
}
