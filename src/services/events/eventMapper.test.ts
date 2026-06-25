import { classifyActivity, mapRawEvents, toActivityEvent } from './eventMapper';
import type { ParsedSorobanEvent } from '@/utils/parseEvents';

describe('classifyActivity', () => {
  it.each([
    ['deposit', 'deposit'],
    ['Deposit', 'deposit'],
    ['stake', 'deposit'],
    ['withdraw', 'withdrawal'],
    ['redeem', 'withdrawal'],
    ['unstake', 'withdrawal'],
    ['reward', 'reward'],
    ['claim_reward', 'reward'],
    ['proposal_created', 'governance'],
    ['vote', 'governance'],
    ['something_else', 'unknown'],
    ['', 'unknown'],
  ])('classifies "%s" as %s', (name, expected) => {
    expect(classifyActivity(name)).toBe(expected);
  });
});

describe('toActivityEvent', () => {
  it('maps a parsed event into a UI-ready activity event', () => {
    const parsed: ParsedSorobanEvent = {
      id: 'evt-1',
      type: 'withdraw',
      contractId: 'CCONTRACT',
      ledger: 42,
      ledgerClosedAt: '2026-01-01T00:00:00Z',
      topics: ['withdraw', 'GUSER'],
      value: '100',
    };

    expect(toActivityEvent(parsed)).toEqual({
      id: 'evt-1',
      type: 'withdrawal',
      name: 'withdraw',
      contractId: 'CCONTRACT',
      ledger: 42,
      timestamp: '2026-01-01T00:00:00Z',
      topics: ['withdraw', 'GUSER'],
      value: '100',
    });
  });
});

describe('mapRawEvents', () => {
  it('parses and maps raw events end-to-end', () => {
    const raw = [
      {
        id: 'e1',
        topic: ['deposit'],
        contractId: 'CVAULT',
        ledger: 10,
        ledgerClosedAt: '2026-01-01T00:00:00Z',
        value: '5',
      },
    ];

    const mapped = mapRawEvents(raw);
    expect(mapped).toHaveLength(1);
    expect(mapped[0]).toMatchObject({
      id: 'e1',
      type: 'deposit',
      name: 'deposit',
      contractId: 'CVAULT',
      ledger: 10,
    });
  });

  it('returns an empty array for non-array input', () => {
    expect(mapRawEvents(undefined as never)).toEqual([]);
  });
});
