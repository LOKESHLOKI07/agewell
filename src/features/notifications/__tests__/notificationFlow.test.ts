import { apiClient } from '@/api/client';
import { ApiError } from '@/api/errors';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { toNotification } from '@/features/home/api/mappers';
import { authenticatedHomeHref } from '@/features/auth/roleRouting';
import {
  fetchNotification,
  fetchNotifications,
  fetchUnreadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api';
import { notificationQueryKeys } from '../queryKeys';
import {
  isEmergencyNotification,
  notificationDetailHref,
  notificationPriorityLabel,
  notificationsHref,
  unreadCountLabel,
} from '../selectors';

jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockedGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
const mockedPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

function jsonGet(data: unknown) {
  mockedGet.mockResolvedValueOnce({ data } as never);
}

function jsonPost(data: unknown) {
  mockedPost.mockResolvedValueOnce({ data } as never);
}

const payload = {
  id: '7d2c1a90-4b11-4c2e-9f6a-1b8d3e6a9c01',
  title: 'Emergency request created',
  message: 'Your Medical Emergency request is on file in AgeWell. Open Help to view the request.',
  priority: 'EMERGENCY',
  is_read: false,
  created_at: '2026-08-20T10:15:00.000Z',
};

describe('Family Mode routing', () => {
  it('sends FAMILY to the family workspace', () => {
    expect(authenticatedHomeHref('FAMILY')).toBe('/(family)');
    expect(authenticatedHomeHref('SENIOR')).toBe('/(tabs)');
    expect(authenticatedHomeHref('CARE_MANAGER')).toBe('/(care)');
    expect(authenticatedHomeHref('ADMIN')).toBe('/(admin)');
  });
});

describe('notification navigation', () => {
  it('sends the bell to the in-app notification list', () => {
    expect(notificationsHref()).toBe('/notifications');
    expect(notificationDetailHref(payload.id)).toEqual({
      pathname: '/notifications/[id]',
      params: { id: payload.id },
    });
  });
});

describe('notification APIs', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it('loads the user-scoped inbox', async () => {
    jsonGet({ items: [payload], total: 1, limit: 50, offset: 0 });
    const result = await fetchNotifications();
    expect(result.items[0]).toMatchObject({
      id: payload.id,
      title: payload.title,
      priority: 'EMERGENCY',
      isRead: false,
    });
    expect(mockedGet).toHaveBeenCalledWith('/notifications/');
  });

  it('loads unread notifications', async () => {
    jsonGet({ items: [payload], total: 1, limit: 50, offset: 0 });
    const result = await fetchUnreadNotifications();
    expect(result.total).toBe(1);
    expect(mockedGet).toHaveBeenCalledWith('/notifications/', { params: { unread_only: true } });
  });

  it('loads notification detail', async () => {
    jsonGet(payload);
    const result = await fetchNotification(payload.id);
    expect(result.message).toBe(payload.message);
    expect(mockedGet).toHaveBeenCalledWith(`/notifications/${payload.id}`);
  });

  it('marks a notification as read', async () => {
    jsonPost({ ...payload, is_read: true });
    const result = await markNotificationRead(payload.id);
    expect(result.isRead).toBe(true);
    expect(mockedPost).toHaveBeenCalledWith(`/notifications/${payload.id}/read`);
  });

  it('marks all notifications as read', async () => {
    jsonPost({ updated: 2 });
    const result = await markAllNotificationsRead();
    expect(result.updated).toBe(2);
    expect(mockedPost).toHaveBeenCalledWith('/notifications/read-all');
  });

  it('maps unauthorized and forbidden requests through the shared error system', async () => {
    mockedGet.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 401, data: {} },
    });
    await expect(fetchNotifications()).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
    });

    mockedGet.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 403, data: {} },
    });
    await expect(fetchNotification(payload.id)).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
    });
    expect(ApiError).toBeDefined();
  });
});

describe('emergency notification styling and copy', () => {
  it('flags emergency priority for styling without claiming dispatch', () => {
    const notification = toNotification(payload);
    expect(isEmergencyNotification(notification)).toBe(true);
    expect(notificationPriorityLabel('EMERGENCY')).toBe('Emergency');
    expect(notificationPriorityLabel('INFO')).toBe('Info');
    expect(`${notification.title} ${notification.message}`).not.toMatch(/ambulance|sms|fcm|whatsapp|email|gps/i);
  });

  it('keeps info notifications out of emergency styling', () => {
    const info = toNotification({
      ...payload,
      id: 'info-1',
      title: 'Welcome',
      message: 'Welcome to AgeWell',
      priority: 'INFO',
    });
    expect(isEmergencyNotification(info)).toBe(false);
  });
});

describe('notification query states', () => {
  it('reports loading, empty, and error states', () => {
    expect(getSectionState({ isPending: true, isError: false, isEmpty: true })).toBe('loading');
    expect(getSectionState({ isPending: false, isError: false, isEmpty: true })).toBe('empty');
    expect(getSectionState({ isPending: false, isError: true, isEmpty: true })).toBe('error');
    expect(getSectionState({ isPending: false, isError: false, isEmpty: false })).toBe('ready');
  });

  it('uses notification query keys and unread labels', () => {
    expect(notificationQueryKeys.list).toEqual(['notifications', 'list']);
    expect(notificationQueryKeys.unread).toEqual(['notifications', 'unread']);
    expect(notificationQueryKeys.detail(payload.id)).toEqual(['notifications', payload.id]);
    expect(unreadCountLabel(0)).toBe('You are up to date');
    expect(unreadCountLabel(1)).toBe('1 unread update');
    expect(unreadCountLabel(2)).toBe('2 unread updates');
  });
});
