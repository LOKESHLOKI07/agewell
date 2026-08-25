import { create } from 'zustand';
import { mockNotifications } from '@/mock/notifications';
import type { AppNotification } from '@/types';

interface NotificationState {
  notifications: AppNotification[];
  hydrate: (notifications: AppNotification[]) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (notification: AppNotification) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: mockNotifications,
  hydrate: (notifications) => set({ notifications }),
  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      ),
    })),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((item) => ({ ...item, read: true })),
    })),
  addNotification: (notification) =>
    set((state) => ({ notifications: [notification, ...state.notifications] })),
}));
