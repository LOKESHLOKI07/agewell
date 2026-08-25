import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { cardSurface, minTouchSize, spacing } from '@/constants/theme';

interface AppCardProps {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AppCard({
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  padded = true,
  style,
}: AppCardProps) {
  const body = <View style={[styles.card, padded ? styles.padded : null, style]}>{children}</View>;

  if (!onPress) {
    return body;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [pressed ? styles.pressed : null, { minHeight: minTouchSize }]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardSurface,
  },
  padded: {
    padding: spacing.xl,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.96,
  },
});
