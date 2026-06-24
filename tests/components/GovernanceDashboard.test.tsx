import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import GovernanceDashboard from "@/features/governance/GovernanceDashboard";

describe("GovernanceDashboard", () => {
  test("renders proposal list and selected proposal details", () => {
    render(<GovernanceDashboard />);

    expect(screen.getByRole("heading", { name: /proposals and voting/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /launch community validator incentive round/i })).toBeInTheDocument();
    expect(screen.getByText(/Proposal list/i)).toBeInTheDocument();
    expect(screen.getByText(/Governance flow/i)).toBeInTheDocument();
  });

  test("updates proposal state when a user casts and changes a vote", async () => {
    const user = userEvent.setup();
    render(<GovernanceDashboard />);

    expect(screen.getByText(/Your vote: Not voted/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Support$/i }));
    expect(screen.getByText(/Your vote: Support/i)).toBeInTheDocument();
    expect(screen.getByText("92,300 votes")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Against$/i }));
    expect(screen.getByText(/Your vote: Against/i)).toBeInTheDocument();
    expect(screen.getByText("82,300 votes")).toBeInTheDocument();
    expect(screen.getByText(/Against: 28,100/i)).toBeInTheDocument();
  });

  test("switches between proposal detail views", async () => {
    const user = userEvent.setup();
    render(<GovernanceDashboard />);

    await user.click(screen.getByRole("button", { name: /prioritize vault analytics refresh cadence/i }));

    expect(screen.getByRole("heading", { name: /prioritize vault analytics refresh cadence/i })).toBeInTheDocument();
    expect(screen.getByText(/Analytics Working Group/i)).toBeInTheDocument();
  });
});
