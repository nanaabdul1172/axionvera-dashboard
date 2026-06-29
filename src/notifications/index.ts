export type {
  AppNotification,
  NotificationCategory,
  NotificationFilter,
  NotificationFilterCategory,
  NotificationFilterRead,
  NotificationInput,
  NotificationPriority,
  NotificationState,
} from './types';

export {
  DEFAULT_NOTIFICATION_FILTER,
  NOTIFICATION_STORAGE_VERSION,
} from './types';

export { compareByPriority, sortByPriority } from './prioritization';
export { applyNotificationFilter } from './filtering';
export { selectUnreadCount, selectVisibleNotifications } from './selectors';
export {
  NOTIFICATION_ACTION_CLASS,
  NOTIFICATION_CATEGORY_LABELS,
  NOTIFICATION_FILTER_CATEGORIES,
  NOTIFICATION_READ_FILTERS,
} from './constants';
export { subscribeNotificationActivityBridge } from './activityBridge';
export {
  loadNotificationState,
  saveNotificationState,
  clearNotificationStorage,
} from './persistence';
export type { PersistedNotificationState } from './persistence';
export { notificationFromActivityEvent } from './adapters/fromActivityEvent';

export {
  notificationStore,
  pushNotification,
  pushNotifications,
  NotificationStore,
} from '@/store/notificationStore';
