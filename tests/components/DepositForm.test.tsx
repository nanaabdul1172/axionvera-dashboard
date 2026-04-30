import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DepositForm from "@/components/DepositForm";

describe("DepositForm", () => {
  test("submits amount", async () => {
    const user = userEvent.setup();
    const onDeposit = jest.fn(async () => undefined);

    render(
      <DepositForm
        isConnected={true}
        isSubmitting={false}
        onDeposit={onDeposit}
        status="idle"
      />
    );

    await user.type(screen.getByLabelText(/amount/i), "12.5");
    await waitFor(() => expect(screen.getByRole("button", { name: /deposit/i })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: /deposit/i }));

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
