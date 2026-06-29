import type { NotificationCategory, NotificationFilterCategory } from './types';

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  protocol: 'Protocol',
  transaction: 'Transaction',
  governance: 'Governance',
  reward: 'Reward',
};

export const NOTIFICATION_FILTER_CATEGORIES: {
  value: NotificationFilterCategory;
  label: string;
}[] = [
  { value: 'all', label: 'All categories' },
  { value: 'protocol', label: 'Protocol' },
  { value: 'transaction', label: 'Transactions' },
  { value: 'governance', label: 'Governance' },
  { value: 'reward', label: 'Rewards' },
];

export const NOTIFICATION_READ_FILTERS = [
  { value: 'all' as const, label: 'All' },
  { value: 'unread' as const, label: 'Unread' },
  { value: 'read' as const, label: 'Read' },
];

export const NOTIFICATION_ACTION_CLASS =
  'rounded-lg px-2 py-1 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500';
