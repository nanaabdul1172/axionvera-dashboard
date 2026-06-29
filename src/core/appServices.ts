import { createServiceContainer, type ServiceContainer } from "./container";
import { SERVICE_TOKENS } from "./tokens";
import * as protocolHealth from "@/services/protocolHealth";
import * as wallet from "@/services/walletService";
import * as transactionSimulation from "@/services/sdk/simulationService";

export function registerApplicationServices(container: ServiceContainer): ServiceContainer {
  return container
    .registerSingleton(SERVICE_TOKENS.protocolHealth, () => protocolHealth, "Protocol dependency health probes")
    .registerSingleton(SERVICE_TOKENS.wallet, () => wallet, "Browser wallet orchestration service")
    .registerSingleton(
      SERVICE_TOKENS.transactionSimulation,
      () => transactionSimulation,
      "Transaction simulation feature service",
    );
}

export function createApplicationContainer(): ServiceContainer {
  return registerApplicationServices(createServiceContainer());
}

export const applicationContainer = createApplicationContainer();
