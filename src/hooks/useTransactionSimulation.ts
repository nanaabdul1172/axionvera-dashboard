/**
 * @deprecated
 * This hook is kept for backward compatibility only.
 * New code should import `useSimulation` from `@/features/transactions`.
 *
 * `useTransactionSimulation` now delegates entirely to the new
 * `useSimulation` hook which is backed by the typed `simulationService`.
 *
 * The exported `SimulationResult` type is also kept as an alias of
 * `SimulationOutcome` so existing imports continue to work without changes.
 */

export type { SimulationOutcome as SimulationResult } from "@/services/sdk";
export { useSimulation as useTransactionSimulation } from "@/features/transactions";
