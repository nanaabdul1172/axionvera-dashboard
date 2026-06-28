import type { ActivityEvent, ActivityType } from '@/services/events/types';
import type { NotificationCategory, NotificationInput, NotificationPriority } from '../types';

const ACTIVITY_CATEGORY: Record<ActivityType, NotificationCategory> = {
  deposit: 'transaction',
  withdrawal: 'transaction',
  reward: 'reward',
  governance: 'governance',
  unknown: 'protocol',
};

const ACTIVITY_PRIORITY: Record<ActivityType, NotificationPriority> = {
  deposit: 'normal',
  withdrawal: 'normal',
  reward: 'high',
  governance: 'high',
  unknown: 'low',
};

const ACTIVITY_TITLE: Record<ActivityType, string> = {
  deposit: 'Deposit detected',
  withdrawal: 'Withdrawal detected',
  reward: 'Reward event',
  governance: 'Governance activity',
  unknown: 'Protocol event',
};

function buildMessage(event: ActivityEvent): string {
  const label = event.name && event.name !== 'unknown' ? event.name : event.type;
  return `${label} on ledger #${event.ledger}`;
}

/**
 * Maps a normalized {@link ActivityEvent} (issue #215) into a notification input.
 */
export function notificationFromActivityEvent(event: ActivityEvent): NotificationInput {
  const category = ACTIVITY_CATEGORY[event.type] ?? 'protocol';
  const priority = ACTIVITY_PRIORITY[event.type] ?? 'normal';
  const title = ACTIVITY_TITLE[event.type] ?? 'Protocol event';

  return {
    id: `activity:${event.id}`,
    sourceId: event.id,
    category,
    priority,
    title,
    message: buildMessage(event),
    timestamp: event.timestamp,
    metadata: {
      contractId: event.contractId,
      ledger: event.ledger,
      activityType: event.type,
    },
  };
}
