import type { Href } from 'expo-router';
import { ApiError, getApiErrorMessage } from '@/api/errors';
import type { Notification, NotificationPriority } from '@/features/home/types/home';

export function notificationsHref(): Href {
  return '/notifications' as Href;
}

export function notificationDetailHref(id: string) {
  return { pathname: '/notifications/[id]' as const, params: { id } };
}

export function isEmergencyNotification(notification: Pick<Notification, 'priority'>): boolean {
  return notification.priority === 'EMERGENCY';
}

export function notificationPriorityLabel(priority: NotificationPriority): string {
  if (priority === 'EMERGENCY') {
    return 'Emergency';
  }
  if (priority === 'IMPORTANT') {
    return 'Important';
  }
  return 'Info';
}

export function unreadCountLabel(count: number): string {
  if (count <= 0) {
    return 'You are up to date';
  }
  return `${count} unread update${count === 1 ? '' : 's'}`;
}

export function getNotificationLoadErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return getApiErrorMessage(error);
}

export function getNotificationActionErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return getApiErrorMessage(error);
}
