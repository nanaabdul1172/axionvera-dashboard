import {
  ServiceResolutionError,
  createServiceContainer,
  createServiceToken,
} from "@/core";

describe("ServiceContainer", () => {
  it("resolves singleton services once", () => {
    const token = createServiceToken<{ id: number }>("test.singleton");
    let created = 0;
    const container = createServiceContainer().registerSingleton(token, () => ({ id: ++created }));

    expect(container.resolve(token)).toBe(container.resolve(token));
    expect(created).toBe(1);
  });

  it("resolves transient services on every request", () => {
    const token = createServiceToken<{ id: number }>("test.transient");
    let created = 0;
    const container = createServiceContainer().registerTransient(token, () => ({ id: ++created }));

    expect(container.resolve(token)).not.toBe(container.resolve(token));
    expect(created).toBe(2);
  });

  it("injects dependencies through factories", () => {
    const configToken = createServiceToken<{ baseUrl: string }>("test.config");
    const clientToken = createServiceToken<{ endpoint: string }>("test.client");
    const container = createServiceContainer()
      .registerSingleton(configToken, () => ({ baseUrl: "https://api.example.test" }))
      .registerSingleton(clientToken, (services) => ({
        endpoint: `${services.resolve(configToken).baseUrl}/health`,
      }));

    expect(container.resolve(clientToken).endpoint).toBe("https://api.example.test/health");
  });

  it("prevents circular dependencies", () => {
    const aToken = createServiceToken<{ name: string }>("test.circular.a");
    const bToken = createServiceToken<{ name: string }>("test.circular.b");
    const container = createServiceContainer()
      .registerSingleton(aToken, (services) => services.resolve(bToken))
      .registerSingleton(bToken, (services) => services.resolve(aToken));

    expect(() => container.resolve(aToken)).toThrow(ServiceResolutionError);
    expect(() => container.resolve(aToken)).toThrow("Circular dependency detected");
  });
});
