import { QueryEngine, applyFilters, queryData } from '@/query';

type ProtocolPosition = {
  account: string;
  balance: number;
  rewards: number;
  status: 'active' | 'paused';
  metadata: { network: string };
};

const positions: ProtocolPosition[] = [
  { account: 'alice', balance: 120, rewards: 12, status: 'active', metadata: { network: 'testnet' } },
  { account: 'bob', balance: 80, rewards: 5, status: 'paused', metadata: { network: 'mainnet' } },
  { account: 'carol', balance: 200, rewards: 30, status: 'active', metadata: { network: 'mainnet' } },
  { account: 'dave', balance: 50, rewards: 1, status: 'active', metadata: { network: 'testnet' } },
];

describe('QueryEngine', () => {
  it('filters rows with supported comparison and nested-field operators', () => {
    expect(applyFilters(positions, [
      { field: 'status', op: 'eq', value: 'active' },
      { field: 'metadata.network', op: 'eq', value: 'testnet' },
      { field: 'balance', op: 'gte', value: 100 },
    ])).toEqual([positions[0]]);
  });

  it('sorts, paginates, and projects query results', () => {
    const sorted = queryData(positions, {
      filters: [{ field: 'status', op: 'eq', value: 'active' }],
      sort: [{ field: 'balance', direction: 'desc' }],
      pagination: { page: 1, pageSize: 2 },
      select: ['account', 'balance'],
    });

    expect(sorted.total).toBe(3);
    expect(sorted.rows).toEqual([
      { account: 'carol', balance: 200 },
      { account: 'alice', balance: 120 },
    ]);
  });

  it('calculates aggregations after filtering and before pagination', () => {
    const result = queryData(positions, {
      filters: [{ field: 'status', op: 'eq', value: 'active' }],
      pagination: { page: 1, pageSize: 1 },
      aggregations: [
        { op: 'count', as: 'activeCount' },
        { op: 'sum', field: 'balance', as: 'activeBalance' },
        { op: 'avg', field: 'rewards', as: 'avgRewards' },
        { op: 'distinct', field: 'metadata.network', as: 'networks' },
      ],
    });

    expect(result.rows).toHaveLength(1);
    expect(result.aggregations).toEqual({
      activeCount: 3,
      activeBalance: 370,
      avgRewards: 43 / 3,
      networks: ['mainnet', 'testnet'],
    });
  });

  it('returns cache hits for repeated queries and invalidates when input data changes', () => {
    const engine = new QueryEngine<ProtocolPosition>({ cacheSize: 2 });
    const query = { filters: [{ field: 'status', op: 'eq' as const, value: 'active' }] };

    expect(engine.execute(positions, query).cacheHit).toBe(false);
    expect(engine.execute(positions, query).cacheHit).toBe(true);
    expect(engine.execute([...positions, { account: 'erin', balance: 5, rewards: 0, status: 'paused', metadata: { network: 'testnet' } }], query).cacheHit).toBe(false);
  });
});
