import { usePathname } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Expo Router / React Navigation marks inactive screens with aria-hidden on web,
 * but the control that triggered navigation can still hold DOM focus. Chrome then
 * blocks aria-hidden and warns. Clear focus on route change before paint.
 */
export function useBlurFocusedOnWebNavigate() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body) {
      active.blur();
    }
  }, [pathname]);
}
