import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, spacing, typography } from '@/constants/theme';
import type { AdminChartSlice } from '../types';

export function AdminDonutChart({
  slices,
  size = 168,
  strokeWidth = 22,
  centerValue,
  centerLabel,
}: {
  slices: AdminChartSlice[];
  size?: number;
  strokeWidth?: number;
  centerValue?: string;
  centerLabel?: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const largest = slices.reduce<AdminChartSlice | null>(
    (best, slice) => (!best || slice.value > best.value ? slice : best),
    null,
  );
  const percent = total > 0 && largest ? Math.round((largest.value / total) * 100) : 0;
  const arcs =
    total > 0
      ? slices.reduce<{ label: string; color: string; length: number; offset: number }[]>((acc, slice) => {
          const length = (slice.value / total) * circumference;
          const offset = acc.reduce((sum, item) => sum + item.length, 0);
          acc.push({ label: slice.label, color: slice.color, length, offset });
          return acc;
        }, [])
      : [];

  return (
    <View style={styles.wrap}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.border}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {arcs.length ? (
            <G transform={`rotate(-90 ${center} ${center})`}>
              {arcs.map((arc) => (
                <Circle
                  key={arc.label}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={arc.color}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={`${arc.length} ${circumference}`}
                  strokeDashoffset={-arc.offset}
                />
              ))}
            </G>
          ) : null}
        </Svg>
        <View style={[styles.center, { pointerEvents: 'none' }]}>
          <Text style={styles.value}>{centerValue ?? (total > 0 ? `${percent}%` : '0')}</Text>
          {centerLabel ? <Text style={styles.label}>{centerLabel}</Text> : null}
        </View>
      </View>
      <View style={styles.legend}>
        {slices.length ? (
          slices.map((slice) => (
            <View key={slice.label} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: slice.color }]} />
              <Text style={styles.legendLabel}>
                {slice.label} {slice.value}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.legendLabel}>No data yet</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    flexWrap: 'wrap',
  },
  center: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    ...typography.title,
    color: colors.text,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  legend: {
    gap: spacing.sm,
    minWidth: 120,
    flex: 1,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
});
