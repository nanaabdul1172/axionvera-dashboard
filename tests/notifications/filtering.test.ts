import { applyNotificationFilter } from '@/notifications/filtering';
import type { AppNotification } from '@/notifications/types';

function item(
  id: string,
  overrides: Partial<AppNotification> = {},
): AppNotification {
  return {
    id,
    category: 'transaction',
    priority: 'normal',
    title: id,
    message: id,
    timestamp: '2026-06-28T12:00:00.000Z',
    read: false,
    dismissed: false,
    ...overrides,
  };
}

describe('applyNotificationFilter', () => {
  const items = [
    item('a', { category: 'transaction', read: false }),
    item('b', { category: 'governance', read: true }),
    item('c', { category: 'reward', dismissed: true }),
  ];

  it('excludes dismissed items', () => {
    const result = applyNotificationFilter(items, { category: 'all', read: 'all' });
    expect(result.map((n) => n.id)).toEqual(['a', 'b']);
  });

  it('filters by category', () => {
    const result = applyNotificationFilter(items, {
      category: 'governance',
      read: 'all',
    });
    expect(result.map((n) => n.id)).toEqual(['b']);
  });

  it('filters unread only', () => {
    const result = applyNotificationFilter(items, { category: 'all', read: 'unread' });
    expect(result.map((n) => n.id)).toEqual(['a']);
  });
});
