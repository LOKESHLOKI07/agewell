import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import type { ListPage, Notification } from '@/features/home/types/home';
import {
  fetchNotification,
  fetchNotifications,
  fetchUnreadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from './api';
import { notificationQueryKeys } from './queryKeys';

function useAuthedQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  enabled = true,
): UseQueryResult<T> {
  const isAuthenticated = useAuthStore((state) => state.status === 'AUTHENTICATED');
  return useQuery({
    queryKey,
    queryFn,
    enabled: isAuthenticated && enabled,
  });
}

export function useNotifications() {
  return useAuthedQuery<ListPage<Notification>>(notificationQueryKeys.list, fetchNotifications);
}

export function useUnreadNotifications() {
  return useAuthedQuery<ListPage<Notification>>(notificationQueryKeys.unread, fetchUnreadNotifications);
}

export function useNotification(id: string | undefined) {
  return useAuthedQuery<Notification>(
    notificationQueryKeys.detail(id ?? ''),
    () => fetchNotification(id as string),
    Boolean(id),
  );
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: async (notification) => {
      queryClient.setQueryData(notificationQueryKeys.detail(notification.id), notification);
      await queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });
}
