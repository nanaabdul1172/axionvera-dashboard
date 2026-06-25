import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import WithdrawForm from "@/components/WithdrawForm";

// Mock the simulation service so tests don't depend on async SDK/localStorage
jest.mock("@/services/sdk/simulationService", () => ({
  simulateWithdraw: jest.fn(async () => ({
    type: "withdraw",
    amount: "12.5",
    currentBalance: "50",
    projectedBalance: "37.5",
    projectedRewards: "0",
    estimatedFee: "0.00001",
    netChange: "-12.5",
    steps: [
      { label: "Validate amount", detail: "12.5 XLM", status: "ok" },
      { label: "Fetch current balance", detail: "50 XLM available", status: "ok" },
      { label: "Check sufficient funds", detail: "50 XLM available", status: "ok" },
      { label: "Project outcome", detail: "37.5 XLM after transaction", status: "ok" },
    ],
    warnings: [],
  })),
  simulateDeposit: jest.fn(),
}));

const MOCK_WALLET = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

describe("WithdrawForm", () => {
  test("submits amount via two-step preview → confirm flow", async () => {
    const user = userEvent.setup();
    const onWithdraw = jest.fn(async () => undefined);

    render(
      <WithdrawForm
        isConnected={true}
        isSubmitting={false}
        balance="50"
        onWithdraw={onWithdraw}
        status="idle"
        walletAddress={MOCK_WALLET}
      />
    );

    // Type amount
    await user.type(screen.getByLabelText(/amount/i), "12.5");

    // Wait for Preview button to be enabled
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /preview withdrawal/i })).toBeEnabled()
    );

    // Click Preview — triggers simulation, shows confirmation modal
    await user.click(screen.getByRole("button", { name: /preview withdrawal/i }));

    // Confirmation modal should appear with a Confirm button
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /confirm withdrawal/i })).toBeInTheDocument()
    );

    // Click Confirm — calls onWithdraw
    await user.click(screen.getByRole("button", { name: /confirm withdrawal/i }));

    await waitFor(() => expect(onWithdraw).toHaveBeenCalledWith("12.5"));
  });

  test("renders transaction feedback and balance", () => {
    render(
      <WithdrawForm
        isConnected={true}
        isSubmitting={false}
        balance="50"
        onWithdraw={jest.fn(async () => undefined)}
        status="success"
        statusMessage="Successfully withdrew 12.5 tokens."
        transactionHash="SIM-1234567890ABCDEF"
      />
    );

    expect(screen.getByText(/available balance:/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/withdrawal completed/i);
    expect(screen.getByText(/successfully withdrew 12.5 tokens/i)).toBeInTheDocument();
    expect(screen.getByText(/tx:/i)).toBeInTheDocument();
  });
});
