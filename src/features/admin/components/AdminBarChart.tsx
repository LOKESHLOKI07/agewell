import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/constants/theme';
import type { AdminChartSlice } from '../types';

export function AdminBarChart({ slices }: { slices: AdminChartSlice[] }) {
  const max = Math.max(1, ...slices.map((slice) => slice.value));

  if (!slices.length) {
    return <Text style={styles.empty}>No service requests to chart yet.</Text>;
  }

  return (
    <View style={styles.list}>
      {slices.map((slice) => (
        <View key={slice.label} style={styles.row}>
          <Text style={styles.label} numberOfLines={1}>
            {slice.label}
          </Text>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.max(8, (slice.value / max) * 100)}%`,
                  backgroundColor: slice.color,
                },
              ]}
            />
          </View>
          <Text style={styles.value}>{slice.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  label: {
    ...typography.captionStrong,
    color: colors.text,
    width: 128,
  },
  track: {
    flex: 1,
    height: 12,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
  value: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    width: 28,
    textAlign: 'right',
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
