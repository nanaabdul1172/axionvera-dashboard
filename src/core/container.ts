export type ServiceToken<T> = symbol & { readonly __service?: T };

export type ServiceLifecycle = "singleton" | "transient";

export type ServiceFactory<T> = (container: ServiceContainer) => T;

export type ServiceRegistration<T> = {
  token: ServiceToken<T>;
  factory: ServiceFactory<T>;
  lifecycle?: ServiceLifecycle;
  description?: string;
};

type RegisteredService<T = unknown> = Required<Omit<ServiceRegistration<T>, "description">> &
  Pick<ServiceRegistration<T>, "description"> & {
    instance?: T;
  };

export class ServiceRegistrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceRegistrationError";
  }
}

export class ServiceResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceResolutionError";
  }
}

export function createServiceToken<T>(name: string): ServiceToken<T> {
  return Symbol.for(`axionvera.dashboard.service.${name}`) as ServiceToken<T>;
}

export class ServiceContainer {
  private readonly registrations = new Map<ServiceToken<unknown>, RegisteredService>();
  private readonly resolutionStack: ServiceToken<unknown>[] = [];

  register<T>(registration: ServiceRegistration<T>): this {
    if (this.registrations.has(registration.token)) {
      throw new ServiceRegistrationError(`Service token "${String(registration.token)}" is already registered.`);
    }

    this.registrations.set(registration.token, {
      ...registration,
      lifecycle: registration.lifecycle ?? "singleton",
    } as RegisteredService);

    return this;
  }

  registerSingleton<T>(token: ServiceToken<T>, factory: ServiceFactory<T>, description?: string): this {
    return this.register({ token, factory, lifecycle: "singleton", description });
  }

  registerTransient<T>(token: ServiceToken<T>, factory: ServiceFactory<T>, description?: string): this {
    return this.register({ token, factory, lifecycle: "transient", description });
  }

  has<T>(token: ServiceToken<T>): boolean {
    return this.registrations.has(token);
  }

  resolve<T>(token: ServiceToken<T>): T {
    const registration = this.registrations.get(token) as RegisteredService<T> | undefined;
    if (!registration) {
      throw new ServiceResolutionError(`No service registered for token "${String(token)}".`);
    }

    if (registration.lifecycle === "singleton" && "instance" in registration) {
      return registration.instance as T;
    }

    if (this.resolutionStack.includes(token)) {
      const cycle = [...this.resolutionStack, token].map((item) => String(item)).join(" -> ");
      throw new ServiceResolutionError(`Circular dependency detected: ${cycle}`);
    }

    this.resolutionStack.push(token);
    try {
      const instance = registration.factory(this);
      if (registration.lifecycle === "singleton") {
        registration.instance = instance;
      }
      return instance;
    } finally {
      this.resolutionStack.pop();
    }
  }

  createChild(): ServiceContainer {
    const child = new ServiceContainer();
    for (const registration of this.registrations.values()) {
      child.register({
        token: registration.token,
        factory: registration.factory,
        lifecycle: registration.lifecycle,
        description: registration.description,
      });
    }
    return child;
  }

  describe() {
    return Array.from(this.registrations.values()).map(({ token, lifecycle, description }) => ({
      token: String(token),
      lifecycle,
      description,
    }));
  }
}

export function createServiceContainer(registrations: ServiceRegistration<unknown>[] = []): ServiceContainer {
  const container = new ServiceContainer();
  registrations.forEach((registration) => container.register(registration));
  return container;
}
