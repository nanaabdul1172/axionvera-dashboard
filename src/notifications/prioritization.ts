import type { AppNotification, NotificationPriority } from './types';

const PRIORITY_RANK: Record<NotificationPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

/**
 * Sort notifications by priority (critical first), then newest timestamp.
 */
export function compareByPriority(a: AppNotification, b: AppNotification): number {
  const rankDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (rankDiff !== 0) return rankDiff;
  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
}

export function sortByPriority(items: AppNotification[]): AppNotification[] {
  return [...items].sort(compareByPriority);
}
