/**
 * Transaction Simulation Preview modal.
 *
 * Confirmation dialog shown after the user clicks "Preview Deposit/Withdrawal".
 * Displays the full simulation outcome:
 *  - Amount hero (coloured by tx type)
 *  - Step checklist (from `simulationSteps`)
 *  - Projected outcome rows
 *  - Non-fatal warning banners
 *  - Network fee with tooltip
 *  - Cancel / Confirm action buttons
 *
 * Accepts the richer `SimulationOutcome` from the new simulation service.
 * For backward compatibility the component also accepts the legacy
 * `SimulationResult` shape (which is a structural subset of `SimulationOutcome`).
 */

import { useEffect, useRef } from "react";
import { formatAmount } from "@/utils/contractHelpers";
import type { SimulationOutcome, SimulationStep } from "@/services/sdk";

// ---------------------------------------------------------------------------
// Prop types
// ---------------------------------------------------------------------------

/**
 * Legacy SimulationResult shape (kept for backward compat with any call-sites
 * that haven't migrated to SimulationOutcome yet).
 */
export type SimulationResult = {
  type: "deposit" | "withdraw";
  amount: string;
  currentBalance: string;
  projectedBalance: string;
  projectedRewards: string;
  estimatedFee: string;
  netChange: string;
};

type PreviewResult = SimulationResult | SimulationOutcome;

type TransactionSimulationPreviewProps = {
  result: PreviewResult;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Row({
  label,
  value,
  highlight,
  tooltip,
}: {
  label: string;
  value: string;
  highlight?: "positive" | "negative" | "neutral";
  tooltip?: string;
}) {
  const valueClass =
    highlight === "positive"
      ? "text-emerald-400"
      : highlight === "negative"
        ? "text-rose-400"
        : "text-text-primary";
  return (
    <div className="flex items-center justify-between py-2 text-xs">
      <span className="flex items-center gap-1 text-text-muted">
        {label}
        {tooltip && (
          <span
            title={tooltip}
            aria-label={tooltip}
            className="cursor-help rounded-full border border-border-primary px-1 text-[10px] leading-tight text-text-muted hover:text-text-secondary"
          >
            ?
          </span>
        )}
      </span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}

function StepItem({ step }: { step: SimulationStep }) {
  const icons: Record<SimulationStep["status"], string> = {
    pending: "○",
    ok: "✓",
    warn: "⚠",
    error: "✕",
  };
  const colors: Record<SimulationStep["status"], string> = {
    pending: "text-text-muted",
    ok: "text-emerald-400",
    warn: "text-amber-400",
    error: "text-rose-400",
  };

  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-xs">
      <div className="flex items-center gap-2">
        <span className={`text-sm font-bold ${colors[step.status]}`} aria-hidden="true">
          {icons[step.status]}
        </span>
        <span className="text-text-secondary">{step.label}</span>
      </div>
      {step.detail && (
        <span className={`shrink-0 font-medium ${colors[step.status]}`}>
          {step.detail}
        </span>
      )}
    </div>
  );
}

function WarningBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-900/40 bg-amber-950/25 px-3 py-2 text-xs text-amber-200">
      <span className="mt-0.5 shrink-0 font-bold text-amber-400" aria-hidden="true">
        ⚠
      </span>
      {message}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TransactionSimulationPreview({
  result,
  isSubmitting,
  onConfirm,
  onCancel,
}: TransactionSimulationPreviewProps) {
  const isDeposit = result.type === "deposit";
  const netChange = parseFloat(result.netChange);

  // Coerce to rich outcome shape (steps / warnings may be absent on legacy)
  const steps: SimulationStep[] = (result as SimulationOutcome).steps ?? [];
  const warnings: string[] = (result as SimulationOutcome).warnings ?? [];

  // Focus trap — move focus into the dialog on mount
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmBtnRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) onCancel();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isSubmitting, onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Transaction preview"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-sm rounded-2xl border border-border-primary bg-background-primary p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full ${
              isDeposit ? "bg-axion-500/15" : "bg-amber-500/15"
            }`}
          >
            <svg
              className={`h-4 w-4 ${isDeposit ? "text-axion-400" : "text-amber-400"}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {isDeposit ? (
                <path d="M12 5v14M5 12l7 7 7-7" />
              ) : (
                <path d="M12 19V5M5 12l7-7 7 7" />
              )}
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary">
              Preview {isDeposit ? "Deposit" : "Withdrawal"}
            </div>
            <div className="text-xs text-text-muted">Review before confirming</div>
          </div>
        </div>

        {/* ── Amount hero ── */}
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-center ${
            isDeposit
              ? "border-axion-500/30 bg-axion-500/10"
              : "border-amber-500/30 bg-amber-500/10"
          }`}
        >
          <div className="text-xs text-text-muted">Amount</div>
          <div
            className={`mt-0.5 text-2xl font-bold ${
              isDeposit ? "text-axion-400" : "text-amber-400"
            }`}
          >
            {netChange > 0 ? "+" : ""}
            {formatAmount(result.netChange)} XLM
          </div>
        </div>

        {/* ── Step checklist (if available) ── */}
        {steps.length > 0 && (
          <div className="mb-3 rounded-xl border border-border-primary bg-background-secondary/20 px-4 py-2">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Simulation Steps
            </p>
            <div className="divide-y divide-border-primary/30">
              {steps.map((step, i) => (
                <StepItem key={i} step={step} />
              ))}
            </div>
          </div>
        )}

        {/* ── Detail rows ── */}
        <div className="divide-y divide-border-primary/50 rounded-xl border border-border-primary bg-background-secondary/20 px-4">
          <Row label="Current Balance" value={`${formatAmount(result.currentBalance)} XLM`} />
          <Row
            label="Projected Balance"
            value={`${formatAmount(result.projectedBalance)} XLM`}
            highlight={isDeposit ? "positive" : "neutral"}
          />
          {isDeposit && (
            <Row
              label="Projected Rewards"
              value={`${formatAmount(result.projectedRewards)} XLM`}
              highlight="positive"
            />
          )}
          <Row
            label="Estimated Network Fee"
            value={`~${result.estimatedFee} XLM`}
            tooltip="Soroban network fee paid to validators. Actual fee may vary by a small margin."
          />
        </div>

        {/* ── Warnings ── */}
        {warnings.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {warnings.map((w, i) => (
              <WarningBanner key={i} message={w} />
            ))}
          </div>
        )}

        <p className="mt-3 text-center text-[11px] text-text-muted">
          This is a simulation. Actual results may vary slightly.
        </p>

        {/* ── Actions ── */}
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 rounded-xl border border-border-primary bg-background-secondary/30 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-background-secondary/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            aria-label={
              isSubmitting
                ? "Processing transaction"
                : `Confirm ${isDeposit ? "Deposit" : "Withdrawal"}`
            }
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70 ${
              isDeposit
                ? "bg-axion-500 shadow-axion-500/20 hover:bg-axion-400"
                : "bg-amber-500 shadow-amber-500/20 hover:bg-amber-400"
            }`}
          >
            {isSubmitting ? (
              <Spinner />
            ) : (
              `Confirm ${isDeposit ? "Deposit" : "Withdrawal"}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}