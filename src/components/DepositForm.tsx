import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput } from './FormInput';
import { depositSchema, DepositFormData } from '@/utils/validation';
import { notify } from '@/utils/notifications';
import { shortenAddress } from '@/utils/contractHelpers';
import { AppTooltip } from './AppTooltip';
import { GLOSSARY } from '@/utils/glossary';
import { useSimulation } from '@/features/transactions';
import { TransactionSimulationPreview } from './TransactionSimulationPreview';
import { SimulationPanel } from './forms';

type DepositFormProps = {
  isConnected: boolean;
  isSubmitting: boolean;
  onDeposit: (amount: string) => Promise<void>;
  status: "idle" | "pending" | "success" | "error";
  statusMessage?: string | null;
  transactionHash?: string | null;
  walletAddress?: string | null;
  walletBalance?: number | null;
};

const NETWORK_FEE_RESERVE = 0.1;

export default function DepositForm({
  isConnected,
  isSubmitting,
  onDeposit,
  status,
  statusMessage,
  transactionHash,
  walletAddress,
  walletBalance,
}: DepositFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { isValid, isDirty }
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    mode: 'onChange',
    defaultValues: { amount: '' as any }
  });

  const {
    simulationStatus,
    simulationOutcome,
    simulationSteps,
    simulationWarnings,
    simulationError,
    simulationErrorCode,
    simulationErrorFix,
    simulate,
    simulateLive,
    resetSimulation,
  } = useSimulation(walletAddress ?? null);

  const spendableBalance =
    walletBalance !== undefined && walletBalance !== null
      ? Math.max(0, walletBalance - NETWORK_FEE_RESERVE)
      : null;

  function handleMax() {
    if (spendableBalance !== null && spendableBalance > 0) {
      setValue('amount', spendableBalance as any, { shouldValidate: true, shouldDirty: true });
      simulateLive('deposit', spendableBalance.toString());
    }
  }

  const onSubmit = async (data: DepositFormData) => {
    await simulate("deposit", data.amount.toString());
  };

  const handleConfirm = async () => {
    const amount = getValues('amount');
    try {
      await onDeposit(amount.toString());
      notify.success("Deposit Successful", `You have deposited ${amount} tokens.`);
      reset();
    } catch (error) {
      console.error('Deposit error:', error);
    } finally {
      resetSimulation();
    }
  };

  const shouldDisableSubmit =
    !isConnected || !isValid || !isDirty || isSubmitting || simulationStatus === 'loading';

  return (
    <>
      {/* Confirmation modal — shown only after explicit "Preview" press */}
      {simulationOutcome && simulationStatus === 'ready' && (
        <TransactionSimulationPreview
          result={simulationOutcome}
          isSubmitting={isSubmitting}
          onConfirm={handleConfirm}
          onCancel={resetSimulation}
        />
      )}

      <section className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
        <div className="text-sm font-semibold text-text-primary">Deposit</div>
        <div className="mt-1 text-xs text-text-muted">Deposit tokens into the Axionvera vault.</div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          {/* Balance + Max */}
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Available Balance</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-text-primary">
                {spendableBalance !== null ? `${spendableBalance.toFixed(4)} XLM` : '—'}
              </span>
              <button
                type="button"
                onClick={handleMax}
                disabled={!isConnected || spendableBalance === null || spendableBalance <= 0}
                className="rounded-md bg-axion-500/10 px-2 py-0.5 text-xs font-semibold text-axion-400 transition hover:bg-axion-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Max
              </button>
            </div>
          </div>

          {/* Amount field — triggers live simulation on change */}
          <FormInput
            {...register('amount', {
              onChange: (e) => simulateLive('deposit', e.target.value),
            })}
            id="deposit-amount"
            inputMode="decimal"
            placeholder="0.0"
            label="Amount"
            required
            helperText={
              <span>
                Enter amount between 0.0001 and 10,000{' '}
                <AppTooltip content={GLOSSARY.slippage}>
                  <span className="cursor-help font-semibold uppercase tracking-wider text-axion-500 underline decoration-dotted decoration-axion-500/50 underline-offset-2 transition-colors hover:text-axion-400">
                    Slippage
                  </span>
                </AppTooltip>
              </span>
            }
          />

          {/* Inline simulation panel (live preview) */}
          <SimulationPanel
            status={simulationStatus}
            outcome={simulationOutcome}
            steps={simulationSteps}
            warnings={simulationWarnings}
            error={simulationError}
            errorCode={simulationErrorCode}
            errorFix={simulationErrorFix}
          />

          {/* Transaction status banner */}
          {status !== 'idle' ? (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-xl border px-4 py-3 text-sm ${
                status === 'success'
                  ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-200'
                  : status === 'error'
                    ? 'border-rose-900/50 bg-rose-950/30 text-rose-200'
                    : 'border-border-primary bg-background-secondary/30 text-text-primary'
              }`}
            >
              <div className="font-medium">
                {status === 'pending'
                  ? 'Deposit transaction pending'
                  : status === 'success'
                    ? 'Deposit completed'
                    : 'Deposit failed'}
              </div>
              {statusMessage ? <div className="mt-1 text-xs opacity-90">{statusMessage}</div> : null}
              {transactionHash ? (
                <div className="mt-1 text-xs opacity-80">Tx: {shortenAddress(transactionHash, 8)}</div>
              ) : null}
            </div>
          ) : null}

          {/* Submit button */}
          <button
            type="submit"
            disabled={shouldDisableSubmit}
            aria-label={
              simulationStatus === 'loading'
                ? "Simulating transaction"
                : isSubmitting
                  ? "Submitting deposit"
                  : "Preview deposit"
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-axion-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-axion-500/20 transition hover:bg-axion-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {simulationStatus === 'loading' ? (
              <>
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Simulating...
              </>
            ) : isSubmitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Depositing...
              </>
            ) : (
              "Preview Deposit"
            )}
          </button>
        </form>
      </section>
    </>
  );
}
