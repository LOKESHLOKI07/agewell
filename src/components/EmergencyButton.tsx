import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, minTouchSize, radius, spacing, typography } from '@/constants/theme';
import { Icon } from '@/components/ui';

interface EmergencyButtonProps {
  onPress: () => void;
  label?: string;
}

export function EmergencyButton({
  onPress,
  label = 'Request Emergency Assistance',
}: EmergencyButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Opens a confirmation before notifying the AgeWell emergency team. This does not call emergency services."
      style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
    >
      <Icon name="alert-circle-outline" size={22} color={colors.white} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    backgroundColor: colors.emergency,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
  },
  pressed: {
    opacity: 0.92,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.white,
    textAlign: 'center',
    minHeight: minTouchSize / 2,
  },
});
