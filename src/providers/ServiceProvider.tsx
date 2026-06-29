import { createContext, useContext, type PropsWithChildren } from "react";

import { applicationContainer, type ServiceContainer } from "@/core";

const ServiceContainerContext = createContext<ServiceContainer>(applicationContainer);

export type ServiceProviderProps = PropsWithChildren<{
  container?: ServiceContainer;
}>;

export function ServiceProvider({ children, container = applicationContainer }: ServiceProviderProps) {
  return <ServiceContainerContext.Provider value={container}>{children}</ServiceContainerContext.Provider>;
}

export function useServiceContainer(): ServiceContainer {
  return useContext(ServiceContainerContext);
}
