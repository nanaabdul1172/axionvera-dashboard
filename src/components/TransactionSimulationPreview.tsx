import { formatAmount } from "@/utils/contractHelpers";
import type { SimulationResult } from "@/hooks/useTransactionSimulation";
import { Button, Dialog } from "@/design-system";

type TransactionSimulationPreviewProps = {
  result: SimulationResult;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function Row({ label, value, highlight }: { label: string; value: string; highlight?: "positive" | "negative" | "neutral" }) {
  const valueClass =
    highlight === "positive" ? "text-emerald-400" :
    highlight === "negative" ? "text-rose-400" :
    "text-text-primary";
  return (
    <div className="flex items-center justify-between py-2 text-xs">
      <span className="text-text-muted">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}

export function TransactionSimulationPreview({ result, isSubmitting, onConfirm, onCancel }: TransactionSimulationPreviewProps) {
  const isDeposit = result.type === "deposit";
  const netChange = parseFloat(result.netChange);

  return (
    <Dialog
      open
      onClose={onCancel}
      title={`Preview ${isDeposit ? "Deposit" : "Withdrawal"}`}
      description="Review before confirming"
      size="sm"
    >
      <div className={`mb-4 rounded-xl border px-4 py-3 text-center ${isDeposit ? "border-axion-500/30 bg-axion-500/10" : "border-amber-500/30 bg-amber-500/10"}`}>
        <div className="text-xs text-text-muted">Amount</div>
        <div className={`mt-0.5 text-2xl font-bold ${isDeposit ? "text-axion-400" : "text-amber-400"}`}>
          {netChange > 0 ? "+" : ""}{formatAmount(result.netChange)} XLM
        </div>
      </div>

      <div className="divide-y divide-border-primary/50 rounded-xl border border-border-primary bg-background-secondary/20 px-4">
        <Row label="Current Balance"    value={`${formatAmount(result.currentBalance)} XLM`} />
        <Row label="Projected Balance"  value={`${formatAmount(result.projectedBalance)} XLM`} highlight={isDeposit ? "positive" : "neutral"} />
        {isDeposit && <Row label="Projected Rewards" value={`${formatAmount(result.projectedRewards)} XLM`} highlight="positive" />}
        <Row label="Estimated Network Fee" value={`~${result.estimatedFee} XLM`} />
      </div>

      <p className="mt-3 text-center text-[11px] text-text-muted">
        This is a simulation. Actual results may vary slightly.
      </p>

      <div className="mt-4 flex gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting} className="flex-1">
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onConfirm}
          disabled={isSubmitting}
          loading={isSubmitting}
          loadingLabel="Processing transaction"
          aria-label={isSubmitting ? "Processing transaction" : `Confirm ${result.type}`}
          className={`flex-1 ${isDeposit ? "" : "bg-amber-500 shadow-amber-500/20 hover:bg-amber-400"}`}
        >
          {isSubmitting ? "Processing…" : `Confirm ${isDeposit ? "Deposit" : "Withdrawal"}`}
        </Button>
      </div>
    </Dialog>
  );
}
