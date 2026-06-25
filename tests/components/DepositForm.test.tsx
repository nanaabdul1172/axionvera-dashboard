import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DepositForm from "@/components/DepositForm";

// Bypass the simulation preview so form submission reaches onDeposit directly
jest.mock("@/hooks/useTransactionSimulation", () => ({
  useTransactionSimulation: () => ({
    simulationStatus: "idle",
    simulationResult: null,
    simulationError: null,
    simulate: jest.fn(),
    resetSimulation: jest.fn(),
  }),
}));

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
