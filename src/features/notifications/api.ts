import { apiClient } from '@/api/client';
import { toApiError } from '@/api/errors';
import { toListPage, toNotification } from '@/features/home/api/mappers';
import type { ListPage, Notification } from '@/features/home/types/home';
import type { AppVariant } from '@/config/appVariant';

/** Keep poll payloads small — badge/list never need the full inbox. */
export const NOTIFICATION_LIST_LIMIT = 50;
export const NOTIFICATION_UNREAD_LIMIT = 20;

export async function fetchNotifications(params?: {
  limit?: number;
  offset?: number;
}): Promise<ListPage<Notification>> {
  try {
    const response = await apiClient.get('/notifications/', {
      params: {
        limit: params?.limit ?? NOTIFICATION_LIST_LIMIT,
        offset: params?.offset ?? 0,
      },
    });
    return toListPage(response.data, toNotification, 'notifications');
  } catch (error) {
    throw toApiError(error);
  }
}

export async function fetchUnreadNotifications(params?: {
  limit?: number;
  offset?: number;
}): Promise<ListPage<Notification>> {
  try {
    const response = await apiClient.get('/notifications/', {
      params: {
        unread_only: true,
        limit: params?.limit ?? NOTIFICATION_UNREAD_LIMIT,
        offset: params?.offset ?? 0,
      },
    });
    return toListPage(response.data, toNotification, 'notifications');
  } catch (error) {
    throw toApiError(error);
  }
}

export async function fetchNotification(id: string): Promise<Notification> {
  try {
    const response = await apiClient.get(`/notifications/${id}`);
    return toNotification(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function markNotificationRead(id: string): Promise<Notification> {
  try {
    const response = await apiClient.post(`/notifications/${id}/read`);
    return toNotification(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  try {
    const response = await apiClient.post('/notifications/read-all');
    const data = response.data as { updated?: unknown };
    return { updated: typeof data.updated === 'number' ? data.updated : 0 };
  } catch (error) {
    throw toApiError(error);
  }
}

export async function registerDevicePushToken(input: {
  token: string;
  platform: 'ios' | 'android' | 'web';
  appVariant?: AppVariant | null;
}): Promise<void> {
  try {
    await apiClient.post('/notifications/device-tokens', {
      token: input.token,
      platform: input.platform,
      app_variant: input.appVariant ?? undefined,
    });
  } catch (error) {
    throw toApiError(error);
  }
}

export async function unregisterDevicePushToken(token: string): Promise<void> {
  try {
    await apiClient.delete('/notifications/device-tokens', { data: { token } });
  } catch (error) {
    throw toApiError(error);
  }
}
