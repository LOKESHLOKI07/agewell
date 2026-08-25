import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/constants/theme';

type LiveIndicatorProps = {
  label?: string;
  active?: boolean;
};

/** Text + shape indicator so “live” is not color-only. */
export function LiveIndicator({ label = 'LIVE', active = true }: LiveIndicatorProps) {
  return (
    <View
      style={[styles.wrap, active ? styles.active : styles.idle]}
      accessibilityRole="text"
      accessibilityLabel={active ? `${label} indicator` : 'Not live'}
    >
      <View style={[styles.dot, active ? styles.dotActive : styles.dotIdle]} />
      <Text style={[styles.label, active ? styles.labelActive : styles.labelIdle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  active: {
    backgroundColor: colors.safeSoft,
    borderColor: colors.safe,
  },
  idle: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: colors.safe,
  },
  dotIdle: {
    backgroundColor: colors.textMuted,
  },
  label: {
    ...typography.label,
    letterSpacing: 0.8,
  },
  labelActive: {
    color: colors.safe,
  },
  labelIdle: {
    color: colors.textMuted,
  },
});
