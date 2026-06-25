import { SOROBAN_RPC_URL } from '@/utils/networkConfig';
import type { EventFetcher, RawSorobanEvent } from './types';

/**
 * JSON-RPC helper for the Soroban RPC server.
 */
async function rpcCall<T>(rpcUrl: string, method: string, params: unknown): Promise<T> {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });

  if (!res.ok) {
    throw new Error(`Soroban RPC ${method} failed: HTTP ${res.status}`);
  }

  const body = (await res.json()) as { result?: T; error?: { message?: string } };
  if (body.error) {
    throw new Error(`Soroban RPC ${method} error: ${body.error.message ?? 'unknown'}`);
  }
  if (body.result === undefined) {
    throw new Error(`Soroban RPC ${method} returned no result`);
  }
  return body.result;
}

/**
 * Builds an {@link EventFetcher} backed by the Soroban RPC `getEvents` and
 * `getLatestLedger` methods. This is the default real-time data source; there
 * is no public Soroban event websocket, so the streaming layer polls forward
 * from the latest ledger (backend indexing is intentionally out of scope).
 */
export function createSorobanRpcFetcher(rpcUrl: string = SOROBAN_RPC_URL): EventFetcher {
  return {
    async getLatestLedger(): Promise<number> {
      const result = await rpcCall<{ sequence: number }>(rpcUrl, 'getLatestLedger', {});
      return Number(result.sequence);
    },

    async getEvents({ startLedger, contractIds, limit }) {
      const result = await rpcCall<{
        events?: RawSorobanEvent[];
        latestLedger: number;
      }>(rpcUrl, 'getEvents', {
        startLedger,
        filters: [
          {
            type: 'contract',
            contractIds: contractIds.filter(Boolean),
          },
        ],
        pagination: { limit },
      });

      return {
        events: result.events ?? [],
        latestLedger: Number(result.latestLedger),
      };
    },
  };
}
