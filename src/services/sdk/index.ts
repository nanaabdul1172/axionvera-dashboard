/**
 * @module services/sdk
 * Barrel export for the SDK simulation service layer.
 */

export { simulateDeposit, simulateWithdraw } from "./simulationService";
export type {
  SimulationRequest,
  SimulationOutcome,
  SimulationStep,
  SimulationStepStatus,
  SimulationTransactionType,
  SimulationErrorCode,
} from "./types";
export { SimulationError } from "./types";
