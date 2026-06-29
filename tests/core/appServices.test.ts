import { createApplicationContainer, SERVICE_TOKENS } from "@/core";

describe("application service registration", () => {
  it("registers dashboard services", () => {
    const container = createApplicationContainer();

    expect(container.has(SERVICE_TOKENS.protocolHealth)).toBe(true);
    expect(container.has(SERVICE_TOKENS.wallet)).toBe(true);
    expect(container.has(SERVICE_TOKENS.transactionSimulation)).toBe(true);
  });

  it("resolves registered service APIs", () => {
    const container = createApplicationContainer();

    expect(typeof container.resolve(SERVICE_TOKENS.protocolHealth).getProtocolHealthSnapshot).toBe("function");
    expect(typeof container.resolve(SERVICE_TOKENS.wallet).connectWallet).toBe("function");
    expect(typeof container.resolve(SERVICE_TOKENS.transactionSimulation).simulateDeposit).toBe("function");
  });
});
