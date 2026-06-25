# Transaction Simulation — Workflow Documentation

## Overview

The simulation layer lets users preview the outcome of a vault transaction
**before** they sign it, reducing failed transactions and building trust.

The flow is:

```
User types amount
      │
      ▼  (300 ms debounce)
simulateLive()  ──►  simulationService  ──►  sdk.getBalances()
      │                                              │
      │                                        validate + project
      ▼                                              │
SimulationPanel (inline)  ◄─────── SimulationOutcome (steps, warnings)
      │
      │  User clicks "Preview Deposit / Withdrawal"
      ▼
simulate()  ──►  simulationService  ──►  sdk.getBalances()
      │
      ▼
TransactionSimulationPreview (modal)
      │
      │  User clicks "Confirm"
      ▼
sdk.deposit() / sdk.withdraw()
```

---

## Architecture

### New Directories

| Path | Purpose |
|------|---------|
| `src/services/sdk/` | Pure-async simulation service (no React) |
| `src/features/transactions/` | `useSimulation` React hook |
| `src/components/forms/` | `SimulationPanel` inline component |

### Key Files

| File | Role |
|------|------|
| `src/services/sdk/types.ts` | `SimulationOutcome`, `SimulationStep`, `SimulationError` |
| `src/services/sdk/simulationService.ts` | Core simulation logic |
| `src/features/transactions/useSimulation.ts` | React hook with debounced live preview |
| `src/components/forms/SimulationPanel.tsx` | Inline form panel (idle/loading/ready/error states) |
| `src/components/TransactionSimulationPreview.tsx` | Confirmation modal with steps + warnings |

---

## Error Codes

| Code | Meaning | Suggested Fix |
|------|---------|---------------|
| `WALLET_NOT_CONNECTED` | No wallet address provided | Connect wallet |
| `INVALID_AMOUNT` | Amount is NaN, zero, or negative | Enter valid positive number |
| `AMOUNT_TOO_LOW` | Below 0.0001 XLM minimum | Increase amount |
| `AMOUNT_TOO_HIGH` | Exceeds 10,000 XLM maximum | Reduce amount |
| `INSUFFICIENT_FUNDS` | Withdraw amount > vault balance | Reduce amount or deposit first |
| `SDK_FAILURE` | `sdk.getBalances()` threw an error | Retry |

All errors are typed via `SimulationError` with a `code` field and a
`suggestedFix` getter:

```ts
import { SimulationError } from '@/services/sdk';

try {
  await simulateDeposit(request);
} catch (err) {
  if (err instanceof SimulationError) {
    console.log(err.code);       // e.g. "INSUFFICIENT_FUNDS"
    console.log(err.suggestedFix); // e.g. "Reduce the amount or deposit more funds first."
  }
}
```

---

## Integrating a Real Soroban RPC Simulation

The mock implementation in `simulationService.ts` uses local arithmetic
(`balance + amount`, `balance - amount`). To replace it with a live Soroban
simulation call:

### Step 1 — Add methods to the SDK interface

In `src/utils/contractHelpers.ts`, extend `AxionveraVaultSdk`:

```ts
import type { SimulationOutcome, SimulationRequest } from '@/services/sdk/types';

export type AxionveraVaultSdk = {
  // ... existing methods ...
  simulateDeposit: (args: SimulationRequest) => Promise<SimulationOutcome>;
  simulateWithdraw: (args: SimulationRequest) => Promise<SimulationOutcome>;
};
```

### Step 2 — Implement in `createAxionveraVaultSdk()`

```ts
async simulateDeposit({ walletAddress, network, amount }) {
  // Call Soroban RPC simulate_transaction
  const rpc = new SorobanRpc.Server(SOROBAN_RPC_URL);
  const tx = buildDepositTx({ walletAddress, network, amount });
  const simResult = await rpc.simulateTransaction(tx);

  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new SimulationError('SDK_FAILURE', simResult.error);
  }

  return parseSimulationResult(simResult, 'deposit', amount);
},
```

### Step 3 — Call from `simulationService.ts`

In `_runSimulation()`, replace the arithmetic block with:

```ts
// Before: local arithmetic
// projectedBalance = currentBalance + amount;

// After: real SDK call
const sdk = getSdk();
const outcome = type === 'deposit'
  ? await sdk.simulateDeposit({ type, amount: amountInput, walletAddress, network: NETWORK })
  : await sdk.simulateWithdraw({ type, amount: amountInput, walletAddress, network: NETWORK });
return outcome;
```

---

## Testing

### Manual Scenarios

| Scenario | Expected Result |
|----------|----------------|
| Type valid amount in DepositForm | SimulationPanel appears after 300ms with step checklist |
| Type amount > 10,000 | Panel shows `AMOUNT_TOO_HIGH` error with suggested fix |
| Type amount > vault balance in WithdrawForm | Panel shows `INSUFFICIENT_FUNDS` error |
| Type amount leaving < 10 XLM | Panel shows low-balance warning banner |
| Click "Preview Deposit" | Confirmation modal appears with full step list |
| Press Escape in modal | Modal closes, simulation resets |
| Click backdrop in modal | Modal closes, simulation resets |
| Click "Confirm Deposit" | `onDeposit()` called, success notification shown |

### Automated

```bash
# Type check
npm run typecheck

# Unit tests
npm run test
```
