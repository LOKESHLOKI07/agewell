import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography } from '@/constants/theme';
import type { StatusPresentation } from '@/utils/status';

interface StatusBadgeProps {
  presentation: StatusPresentation;
}

export function StatusBadge({ presentation }: StatusBadgeProps) {
  return (
    <View
      style={[styles.badge, { backgroundColor: presentation.background }]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${presentation.label}`}
    >
      <Text style={[styles.label, { color: presentation.color }]}>{presentation.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  label: {
    ...typography.captionStrong,
    letterSpacing: 0.2,
  },
});
