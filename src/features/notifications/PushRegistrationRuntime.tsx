import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '@/features/auth/authStore';
import { emergencyDetailHref } from '@/features/emergency/selectors';
import { emergencyRespondHref } from '@/features/care/selectors';
import {
  getEmergencyIdFromNotificationData,
  registerForEmergencyPush,
  unregisterEmergencyPush,
} from './pushRegistration';

function openEmergency(router: ReturnType<typeof useRouter>, role: string | undefined, emergencyId: string) {
  if (role === 'CARE_MANAGER' || role === 'ADMIN' || role === 'OPERATIONS') {
    router.push(emergencyRespondHref(emergencyId) as never);
    return;
  }
  router.push(emergencyDetailHref(emergencyId) as never);
}

/**
 * Loaded only after PushRegistrationHost confirms remote push is available.
 */
export function PushRegistrationRuntime() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const role = useAuthStore((state) => state.user?.role);
  const registeredForUser = useRef<string | null>(null);

  useEffect(() => {
    if (status !== 'AUTHENTICATED') {
      if (registeredForUser.current) {
        registeredForUser.current = null;
        void unregisterEmergencyPush();
      }
      return;
    }

    const userId = useAuthStore.getState().user?.id ?? null;
    if (!userId || registeredForUser.current === userId) {
      return;
    }
    registeredForUser.current = userId;
    void registerForEmergencyPush().catch(() => {
      registeredForUser.current = null;
    });
  }, [status]);

  useEffect(() => {
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const emergencyId = getEmergencyIdFromNotificationData(response.notification.request.content.data);
      if (emergencyId) {
        openEmergency(router, role, emergencyId);
      }
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) {
        return;
      }
      const emergencyId = getEmergencyIdFromNotificationData(response.notification.request.content.data);
      if (emergencyId && status === 'AUTHENTICATED') {
        openEmergency(router, role, emergencyId);
      }
    });

    return () => {
      responseSub.remove();
    };
  }, [router, role, status]);

  return null;
}
