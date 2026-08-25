import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/constants/theme';

interface ProgressBarProps {
  label: string;
  used: number;
  total: number | null;
}

export function ProgressBar({ label, used, total }: ProgressBarProps) {
  const hasQuota = typeof total === 'number' && total > 0;
  const percentage = hasQuota ? Math.min(Math.max((used / total) * 100, 0), 100) : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{hasQuota ? `${used}/${total}` : `${used} used`}</Text>
      </View>
      {hasQuota ? (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${percentage}%` }]} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  value: {
    ...typography.captionStrong,
    color: colors.text,
  },
  track: {
    height: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
});
