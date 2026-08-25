import { router, type Href } from 'expo-router';
import type { AuthRole } from '@/features/auth/authTypes';
import { authenticatedHomeHref } from '@/features/auth/roleRouting';

export function fallbackHomeHref(role?: AuthRole | null): Href {
  return (role ? authenticatedHomeHref(role) : '/(tabs)') as Href;
}

/** Use React Navigation's canGoBack, not router.canGoBack — web history can lie. */
export function safeGoBack(canGoBack: boolean, role?: AuthRole | null) {
  if (canGoBack) {
    router.back();
    return;
  }
  router.replace(fallbackHomeHref(role));
}
