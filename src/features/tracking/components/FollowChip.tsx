import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, minTouchSize, radius, shadows, spacing, typography } from '@/constants/theme';

interface FollowChipProps {
  visible: boolean;
  onPress: () => void;
}

export function FollowChip({ visible, onPress }: FollowChipProps) {
  if (!visible) {
    return null;
  }
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, shadows.float, pressed ? styles.pressed : null]}
      accessibilityRole="button"
      accessibilityLabel="Follow Care Associate"
      accessibilityHint="Recenters the map on the Care Associate and resumes follow mode"
    >
      <Text style={styles.label}>Follow</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: minTouchSize,
    minWidth: minTouchSize,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  pressed: {
    opacity: 0.88,
  },
});
