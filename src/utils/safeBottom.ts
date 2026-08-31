import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout } from '@/constants/theme';

const TAB_BAR_TOP_PAD = 8;

/** Extra space so content clears the system Back / Home / Recent bar. */
export function useSystemBottomInset(minimum = 12): number {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, minimum);
}

/** Bottom tab bar style that keeps icons above the system navigation bar. */
export function useSafeTabBarStyle() {
  const bottomInset = useSystemBottomInset(12);
  return {
    backgroundColor: colors.surfaceElevated,
    borderTopColor: colors.border,
    height: layout.tabBarHeight + bottomInset,
    paddingTop: TAB_BAR_TOP_PAD,
    paddingBottom: bottomInset,
  } as const;
}

/** Scroll/content padding when a screen sits above the member tab bar. */
export function useTabScreenBottomPad(extra = 0): number {
  const bottomInset = useSystemBottomInset(12);
  return layout.tabBarHeight + bottomInset + extra;
}
