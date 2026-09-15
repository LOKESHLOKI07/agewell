import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { getAppVariant } from '@/config/appVariant';
import { registerDevicePushToken, unregisterDevicePushToken } from './api';

const EMERGENCY_CHANNEL_ID = 'emergency';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

let cachedToken: string | null = null;

function resolveProjectId(): string | null {
  const fromEas = Constants.easConfig?.projectId;
  const fromExtra = Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof fromEas === 'string' && fromEas) {
    return fromEas;
  }
  if (typeof fromExtra === 'string' && fromExtra) {
    return fromExtra;
  }
  return null;
}

async function ensureEmergencyChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  await Notifications.setNotificationChannelAsync(EMERGENCY_CHANNEL_ID, {
    name: 'Emergency SOS',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 200, 500, 200, 800],
    sound: 'default',
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
  await Notifications.setNotificationChannelAsync('default', {
    name: 'General',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/**
 * Request permission, create the emergency Android channel, obtain an Expo push
 * token (backed by FCM/APNs via Expo), and register it with the AgeWell API.
 */
export async function registerForEmergencyPush(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  await ensureEmergencyChannel();

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') {
    return null;
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    return null;
  }

  const push = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = push.data;
  cachedToken = token;
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  await registerDevicePushToken({
    token,
    platform,
    appVariant: getAppVariant(),
  });
  return token;
}

export async function unregisterEmergencyPush(): Promise<void> {
  const token = cachedToken;
  cachedToken = null;
  if (!token) {
    return;
  }
  try {
    await unregisterDevicePushToken(token);
  } catch {
    // Best-effort on sign-out.
  }
}

export function getEmergencyIdFromNotificationData(data: unknown): string | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  const record = data as Record<string, unknown>;
  const id = record.emergencyId ?? record.emergency_id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}
