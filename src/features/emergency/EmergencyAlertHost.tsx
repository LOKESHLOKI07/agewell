import { useEffect, useRef } from 'react';
import { Alert, Platform, Vibration } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import type { AuthRole } from '@/features/auth/authTypes';
import { ACTIVE_EMERGENCY_STATUSES } from '@/features/emergency/types/emergency';
import { fetchEmergencyCases } from '@/features/emergency/api/emergencyApi';
import { emergencyDetailHref } from '@/features/emergency/selectors';
import { emergencyRespondHref } from '@/features/care/selectors';
import { fetchUnreadNotifications } from '@/features/notifications/api';
import { isEmergencyNotification } from '@/features/notifications/selectors';
import { notificationQueryKeys } from '@/features/notifications/queryKeys';

const ALERT_ROLES: ReadonlySet<AuthRole> = new Set(['FAMILY', 'CARE_MANAGER', 'ADMIN', 'OPERATIONS']);

function vibrateEmergency() {
  if (Platform.OS === 'web') {
    return;
  }
  Vibration.vibrate([0, 600, 200, 600, 200, 800]);
}

/**
 * Foreground watcher: polls in-app EMERGENCY notifications and surfaces a
 * vibrate + alert with deep link when the app is already open. Cold-start /
 * background delivery uses OS push via PushRegistrationHost (Expo → FCM/APNs).
 */
export function EmergencyAlertHost() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const role = useAuthStore((state) => state.user?.role);
  const enabled = status === 'AUTHENTICATED' && Boolean(role && ALERT_ROLES.has(role));
  const seenIds = useRef<Set<string>>(new Set());
  const primed = useRef(false);
  const prompting = useRef(false);

  const unread = useQuery({
    queryKey: [...notificationQueryKeys.unread, 'emergency-alert-host'],
    queryFn: fetchUnreadNotifications,
    enabled,
    refetchInterval: enabled ? 4000 : false,
  });

  useEffect(() => {
    if (!enabled) {
      seenIds.current.clear();
      primed.current = false;
      return;
    }
    const items = unread.data?.items ?? [];
    if (!primed.current) {
      for (const item of items) {
        seenIds.current.add(item.id);
      }
      primed.current = true;
      return;
    }

    const fresh = items.filter(
      (item) => isEmergencyNotification(item) && !seenIds.current.has(item.id),
    );
    for (const item of items) {
      seenIds.current.add(item.id);
    }
    if (fresh.length === 0 || prompting.current) {
      return;
    }

    const latest = fresh[0];
    prompting.current = true;
    vibrateEmergency();

    Alert.alert(
      latest.title || 'Emergency Alert',
      latest.message || 'Open the alert to respond.',
      [
        {
          text: 'Dismiss',
          style: 'cancel',
          onPress: () => {
            prompting.current = false;
          },
        },
        {
          text: 'Open',
          onPress: () => {
            prompting.current = false;
            void (async () => {
              try {
                const page = await fetchEmergencyCases();
                const active = page.items.find((item) =>
                  (ACTIVE_EMERGENCY_STATUSES as readonly string[]).includes(item.status),
                );
                if (!active) {
                  router.push('/notifications' as never);
                  return;
                }
                if (role === 'CARE_MANAGER' || role === 'ADMIN' || role === 'OPERATIONS') {
                  router.push(emergencyRespondHref(active.id) as never);
                  return;
                }
                router.push(emergencyDetailHref(active.id) as never);
              } catch {
                router.push('/notifications' as never);
              }
            })();
          },
        },
      ],
      { cancelable: true, onDismiss: () => {
        prompting.current = false;
      } },
    );
  }, [enabled, unread.data, role, router]);

  return null;
}
