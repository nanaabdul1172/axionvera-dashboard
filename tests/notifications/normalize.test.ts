import {
  filterFreshNotifications,
  normalizeNotificationInput,
} from '@/notifications/normalize';
import type { NotificationInput } from '@/notifications/types';

describe('normalizeNotificationInput', () => {
  it('defaults read and dismissed to false', () => {
    const input: NotificationInput = {
      id: 'n-1',
      category: 'protocol',
      priority: 'normal',
      title: 'Test',
      message: 'Body',
      timestamp: '2026-06-28T12:00:00.000Z',
    };
    expect(normalizeNotificationInput(input)).toEqual({
      ...input,
      read: false,
      dismissed: false,
    });
  });
});

describe('filterFreshNotifications', () => {
  const seenIds = new Set(['a']);
  const seenSourceIds = new Set(['src-1']);

  it('excludes duplicates by id or sourceId', () => {
    const incoming: NotificationInput[] = [
      {
        id: 'a',
        category: 'transaction',
        priority: 'normal',
        title: 'A',
        message: 'A',
        timestamp: '2026-06-28T12:00:00.000Z',
      },
      {
        id: 'b',
        sourceId: 'src-1',
        category: 'transaction',
        priority: 'normal',
        title: 'B',
        message: 'B',
        timestamp: '2026-06-28T12:00:00.000Z',
      },
      {
        id: 'c',
        category: 'reward',
        priority: 'high',
        title: 'C',
        message: 'C',
        timestamp: '2026-06-28T12:00:00.000Z',
      },
    ];

    expect(filterFreshNotifications(incoming, seenIds, seenSourceIds)).toHaveLength(1);
    expect(filterFreshNotifications(incoming, seenIds, seenSourceIds)[0].id).toBe('c');
  });
});
