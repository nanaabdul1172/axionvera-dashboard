import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DepositForm from "@/components/DepositForm";

// Mock the simulation service so tests don't depend on async SDK/localStorage
jest.mock("@/services/sdk/simulationService", () => ({
  simulateDeposit: jest.fn(async () => ({
    type: "deposit",
    amount: "12.5",
    currentBalance: "100",
    projectedBalance: "112.5",
    projectedRewards: "0.125",
    estimatedFee: "0.00001",
    netChange: "12.5",
    steps: [
      { label: "Validate amount", detail: "12.5 XLM", status: "ok" },
      { label: "Fetch current balance", detail: "100 XLM available", status: "ok" },
      { label: "Project outcome", detail: "112.5 XLM after transaction", status: "ok" },
    ],
    warnings: [],
  })),
  simulateWithdraw: jest.fn(),
}));

const MOCK_WALLET = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

describe("DepositForm", () => {
  test("submits amount via two-step preview → confirm flow", async () => {
    const user = userEvent.setup();
    const onDeposit = jest.fn(async () => undefined);

    render(
      <DepositForm
        isConnected={true}
        isSubmitting={false}
        onDeposit={onDeposit}
        status="idle"
        walletAddress={MOCK_WALLET}
      />
    );

    // Type amount
    await user.type(screen.getByLabelText(/amount/i), "12.5");

    // Wait for Preview button to be enabled
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /preview deposit/i })).toBeEnabled()
    );

    // Click Preview — triggers simulation, shows confirmation modal
    await user.click(screen.getByRole("button", { name: /preview deposit/i }));

    // Confirmation modal should appear with a Confirm button
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /confirm deposit/i })).toBeInTheDocument()
    );

    // Click Confirm — calls onDeposit
    await user.click(screen.getByRole("button", { name: /confirm deposit/i }));

    await waitFor(() => expect(onDeposit).toHaveBeenCalledWith("12.5"));
  });

  test("renders transaction feedback", () => {
    render(
      <DepositForm
        isConnected={true}
        isSubmitting={false}
        onDeposit={jest.fn(async () => undefined)}
        status="success"
        statusMessage="Successfully deposited 12.5 tokens."
        transactionHash="SIM-1234567890ABCDEF"
      />
    );

    expect(screen.getByRole("status")).toHaveTextContent(/deposit completed/i);
    expect(screen.getByText(/successfully deposited 12.5 tokens/i)).toBeInTheDocument();
    expect(screen.getByText(/tx:/i)).toBeInTheDocument();
  });
});
