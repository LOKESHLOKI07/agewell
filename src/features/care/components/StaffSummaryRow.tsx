import { StyleSheet, Text, View } from 'react-native';
import { cardSurface, colors, radius, spacing, tones, typography } from '@/constants/theme';
import type { StaffSummaryStat } from '../staffHomeModel';

export type { StaffSummaryStat };

interface StaffSummaryRowProps {
  stats: StaffSummaryStat[];
}

export function StaffSummaryRow({ stats }: StaffSummaryRowProps) {
  return (
    <View style={styles.row} accessibilityRole="summary">
      {stats.map((stat) => {
        const palette = tones[stat.tone === 'default' ? 'primary' : stat.tone];
        return (
          <View key={stat.label} style={styles.card}>
            <Text style={[styles.value, { color: palette.fg }]}>{String(stat.value)}</Text>
            <Text style={styles.label} numberOfLines={2}>
              {stat.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  card: {
    flex: 1,
    ...cardSurface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    minHeight: 72,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  value: {
    ...typography.heading,
    fontSize: 20,
    lineHeight: 26,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
