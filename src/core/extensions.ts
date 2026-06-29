import { ExtensionHost, type ExtensionModule, type ExtensionLoadResult } from "@/sdk";
import { sampleProtocolExtension } from "@/extensions";

export const dashboardExtensionHost = new ExtensionHost();

export const bundledExtensions: ExtensionModule[] = [sampleProtocolExtension];

export async function loadBundledExtensions(): Promise<ExtensionLoadResult[]> {
  return dashboardExtensionHost.loadAll(bundledExtensions);
}
