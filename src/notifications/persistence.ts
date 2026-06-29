import type { AppNotification, NotificationFilter } from './types';
import { DEFAULT_NOTIFICATION_FILTER, NOTIFICATION_STORAGE_VERSION } from './types';

const STORAGE_KEY = `axionvera:notifications:v${NOTIFICATION_STORAGE_VERSION}`;

export interface PersistedNotificationState {
  version: number;
  items: AppNotification[];
  filter: NotificationFilter;
}

export function loadNotificationState(): PersistedNotificationState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedNotificationState;
    if (parsed.version !== NOTIFICATION_STORAGE_VERSION) return null;
    if (!Array.isArray(parsed.items)) return null;
    return {
      version: NOTIFICATION_STORAGE_VERSION,
      items: parsed.items,
      filter: parsed.filter ?? DEFAULT_NOTIFICATION_FILTER,
    };
  } catch {
    return null;
  }
}

export function saveNotificationState(state: PersistedNotificationState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('[NotificationPersistence] Failed to save state:', error);
  }
}

export function clearNotificationStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
