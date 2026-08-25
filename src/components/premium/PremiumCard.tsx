import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { cardSurface, colors, minTouchSize, spacing } from '@/constants/theme';

type PremiumCardProps = {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  tone?: 'default' | 'soft' | 'accent' | 'safe' | 'emergency';
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
};

const TONE_BG = {
  default: colors.surfaceElevated,
  soft: colors.surfaceMuted,
  accent: colors.accentSoft,
  safe: colors.safeSoft,
  emergency: colors.emergencySoft,
} as const;

export function PremiumCard({
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  tone = 'default',
  style,
  padded = true,
}: PremiumCardProps) {
  const body = (
    <View style={[styles.card, { backgroundColor: TONE_BG[tone] }, padded ? styles.padded : null, style]}>
      {children}
    </View>
  );

  if (!onPress) {
    return body;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [pressed ? styles.pressed : null]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardSurface,
    minHeight: minTouchSize,
    overflow: 'hidden',
  },
  padded: {
    padding: spacing.lg,
  },
  pressed: {
    opacity: 0.94,
  },
});
