import { mockNotifications } from '@/mock/notifications';
import type { AppNotification } from '@/types';
import { delay } from '@/utils/delay';

export async function getNotifications(): Promise<AppNotification[]> {
  await delay(250);
  return [...mockNotifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
