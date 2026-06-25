import {
  AXIONVERA_TOKEN_CONTRACT_ID,
  AXIONVERA_VAULT_CONTRACT_ID,
} from '@/utils/networkConfig';
import {
  EventSubscriptionService,
  createEventSubscriptionService,
} from './eventSubscriptionService';
import { createSorobanRpcFetcher } from './sorobanRpcFetcher';

export * from './types';
export * from './eventMapper';
export {
  EventSubscriptionService,
  createEventSubscriptionService,
} from './eventSubscriptionService';
export type { EventSubscriptionOptions } from './eventSubscriptionService';
export { createSorobanRpcFetcher } from './sorobanRpcFetcher';

/** Contract ids whose events appear in the dashboard activity feed. */
export const DEFAULT_EVENT_CONTRACT_IDS = [
  AXIONVERA_VAULT_CONTRACT_ID,
  AXIONVERA_TOKEN_CONTRACT_ID,
].filter((id) => Boolean(id) && !id.startsWith('REPLACE_WITH'));

let singleton: EventSubscriptionService | null = null;

/**
 * Lazily-created shared subscription service wired to the Soroban RPC fetcher
 * and the default protocol contracts. Hooks/components reuse this so the app
 * keeps a single stream regardless of how many consumers subscribe.
 */
export function getEventSubscriptionService(): EventSubscriptionService {
  if (!singleton) {
    singleton = createEventSubscriptionService({
      contractIds: DEFAULT_EVENT_CONTRACT_IDS,
      fetcher: createSorobanRpcFetcher(),
    });
  }
  return singleton;
}
