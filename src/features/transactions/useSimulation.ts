/**
 * @module features/transactions/useSimulation
 *
 * Upgraded transaction simulation hook.
 *
 * Improvements over the legacy `useTransactionSimulation`:
 * - Delegates to `simulationService` (typed errors, step tracking)
 * - Exposes `simulationSteps`, `simulationWarnings`, `simulationErrorCode`
 * - SDK is a module-level singleton (no per-render recreation)
 * - `simulate` is stable across renders (wallet-address-only dependency)
 * - Supports both explicit "Preview" button flow AND 300 ms debounced
 *   live preview via `simulateLive(type, amount)`
 */

import { useCallback, useRef, useState } from "react";
import {
  simulateDeposit,
  simulateWithdraw,
  SimulationError,
} from "@/services/sdk";
import type {
  SimulationOutcome,
  SimulationStep,
  SimulationTransactionType,
  SimulationErrorCode,
} from "@/services/sdk";
import { NETWORK } from "@/utils/networkConfig";

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

type SimulationStatus = "idle" | "loading" | "ready" | "error";

interface SimulationState {
  status: SimulationStatus;
  outcome: SimulationOutcome | null;
  /** User-facing error message */
  error: string | null;
  /** Machine-readable error code for programmatic handling */
  errorCode: SimulationErrorCode | null;
  /** Suggested fix shown below the error message */
  errorFix: string | null;
  steps: SimulationStep[];
  warnings: string[];
}

const INITIAL_STATE: SimulationState = {
  status: "idle",
  outcome: null,
  error: null,
  errorCode: null,
  errorFix: null,
  steps: [],
  warnings: [],
};

// ---------------------------------------------------------------------------
// Debounce delay for live simulation
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 300;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSimulation(walletAddress: string | null) {
  const [state, setState] = useState<SimulationState>(INITIAL_STATE);

  // Ref to cancel in-flight debounced simulation when a new one starts
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------------------------------------------------------------
  // Core runner
  // -------------------------------------------------------------------------
  const runSimulation = useCallback(
    async (type: SimulationTransactionType, amountInput: string) => {
      if (!walletAddress) {
        setState({
          ...INITIAL_STATE,
          status: "error",
          error: "Wallet not connected.",
          errorCode: "WALLET_NOT_CONNECTED",
          errorFix: "Connect your wallet and try again.",
        });
        return;
      }

      setState((prev) => ({
        ...prev,
        status: "loading",
        outcome: null,
        error: null,
        errorCode: null,
        errorFix: null,
        // keep previous steps visible as skeleton during reload
      }));

      try {
        const fn = type === "deposit" ? simulateDeposit : simulateWithdraw;
        const outcome = await fn({
          type,
          amount: amountInput,
          walletAddress,
          network: NETWORK,
        });

        setState({
          status: "ready",
          outcome,
          error: null,
          errorCode: null,
          errorFix: null,
          steps: outcome.steps,
          warnings: outcome.warnings,
        });
      } catch (err) {
        if (err instanceof SimulationError) {
          setState({
            status: "error",
            outcome: null,
            error: err.message,
            errorCode: err.code,
            errorFix: err.suggestedFix,
            steps: [],
            warnings: [],
          });
        } else {
          setState({
            status: "error",
            outcome: null,
            error:
              err instanceof Error ? err.message : "Simulation failed.",
            errorCode: "SDK_FAILURE",
            errorFix: "The simulation could not complete. Please try again.",
            steps: [],
            warnings: [],
          });
        }
      }
    },
    [walletAddress],
  );

  // -------------------------------------------------------------------------
  // Explicit simulate — called by "Preview" button (not debounced)
  // -------------------------------------------------------------------------
  const simulate = useCallback(
    (type: SimulationTransactionType, amountInput: string) => {
      // Cancel any pending debounced call
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return runSimulation(type, amountInput);
    },
    [runSimulation],
  );

  // -------------------------------------------------------------------------
  // Live simulate — debounced, triggered as the user types
  // -------------------------------------------------------------------------
  const simulateLive = useCallback(
    (type: SimulationTransactionType, amountInput: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      // Clear stale outcome immediately so the panel shows loading state
      if (amountInput === "" || amountInput === "0") {
        setState(INITIAL_STATE);
        return;
      }

      debounceRef.current = setTimeout(() => {
        void runSimulation(type, amountInput);
      }, DEBOUNCE_MS);
    },
    [runSimulation],
  );

  // -------------------------------------------------------------------------
  // Reset
  // -------------------------------------------------------------------------
  const resetSimulation = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setState(INITIAL_STATE);
  }, []);

  // -------------------------------------------------------------------------
  // Exposed API
  // Backward-compatible names kept alongside the richer new ones.
  // -------------------------------------------------------------------------
  return {
    // Status
    simulationStatus: state.status,
    // Outcome (richer — includes steps & warnings)
    simulationOutcome: state.outcome,
    simulationSteps: state.steps,
    simulationWarnings: state.warnings,
    // Error
    simulationError: state.error,
    simulationErrorCode: state.errorCode,
    simulationErrorFix: state.errorFix,
    // Legacy compat: `simulationResult` mirrors `simulationOutcome`
    simulationResult: state.outcome,
    // Actions
    simulate,
    simulateLive,
    resetSimulation,
  };
}
