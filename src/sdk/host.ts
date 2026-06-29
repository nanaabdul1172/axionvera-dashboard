import type {
  DashboardExtension,
  ExtensionContext,
  ExtensionContributionBase,
  ExtensionHostOptions,
  ExtensionLoadResult,
  ExtensionModule,
  RegisteredExtension,
} from "./types";
import { validateContribution, validateExtension } from "./validation";

interface ExtensionRecord {
  extension: DashboardExtension;
  context: ExtensionContext;
  contributions: Map<string, ExtensionContributionBase>;
  status: "active" | "inactive";
}

export class ExtensionHost {
  private readonly extensions = new Map<string, ExtensionRecord>();
  private readonly logger: Pick<Console, "debug" | "info" | "warn" | "error">;

  constructor(options: ExtensionHostOptions = {}) {
    this.logger = options.logger ?? console;
  }

  async register(extension: DashboardExtension): Promise<ExtensionLoadResult> {
    if (!validateExtension(extension)) {
      return { extensionId: "unknown", status: "rejected", reason: "Extension manifest or lifecycle is invalid" };
    }

    if (this.extensions.has(extension.manifest.id)) {
      return { extensionId: extension.manifest.id, status: "rejected", reason: "Extension is already registered" };
    }

    const contributions = new Map<string, ExtensionContributionBase>();
    const context: ExtensionContext = {
      manifest: extension.manifest,
      logger: this.logger,
      registerContribution: (contribution) => {
        if (!validateContribution(contribution)) {
          throw new Error(`Invalid contribution for extension ${extension.manifest.id}`);
        }
        contributions.set(contribution.id, contribution);
      },
      unregisterContribution: (contributionId) => {
        contributions.delete(contributionId);
      },
    };

    const record: ExtensionRecord = { extension, context, contributions, status: "inactive" };
    this.extensions.set(extension.manifest.id, record);

    try {
      await extension.activate(context);
      record.status = "active";
      return { extensionId: extension.manifest.id, status: "loaded" };
    } catch (error) {
      this.extensions.delete(extension.manifest.id);
      const reason = error instanceof Error ? error.message : "Extension activation failed";
      this.logger.error(`Failed to activate extension ${extension.manifest.id}: ${reason}`);
      return { extensionId: extension.manifest.id, status: "rejected", reason };
    }
  }

  async load(module: ExtensionModule): Promise<ExtensionLoadResult> {
    const extension = await resolveExtensionModule(module);
    return this.register(extension);
  }

  async loadAll(modules: ExtensionModule[]): Promise<ExtensionLoadResult[]> {
    return Promise.all(modules.map((module) => this.load(module)));
  }

  async deactivate(extensionId: string): Promise<boolean> {
    const record = this.extensions.get(extensionId);
    if (!record) return false;
    await record.extension.deactivate?.(record.context);
    record.contributions.clear();
    record.status = "inactive";
    this.extensions.delete(extensionId);
    return true;
  }

  getExtensions(): RegisteredExtension[] {
    return Array.from(this.extensions.values()).map((record) => ({
      manifest: record.extension.manifest,
      status: record.status,
      contributions: Array.from(record.contributions.values()),
    }));
  }

  getContributions(type?: ExtensionContributionBase["type"]): ExtensionContributionBase[] {
    return this.getExtensions()
      .flatMap((extension) => extension.contributions)
      .filter((contribution) => !type || contribution.type === type);
  }
}

async function resolveExtensionModule(module: ExtensionModule): Promise<DashboardExtension> {
  const candidate = typeof module === "function" ? await module() : "default" in module ? module.default : module;
  return typeof candidate === "function" ? candidate() : candidate;
}
