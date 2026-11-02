import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, minTouchSize, radius, spacing, typography } from '@/constants/theme';

interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface AdminFilterChipsProps<T extends string> {
  label: string;
  value: T | undefined;
  options: readonly ChipOption<T>[];
  onChange: (value: T | undefined) => void;
  allowAll?: boolean;
  /** Optional counts keyed by option value; shown as badges when > 0. */
  counts?: Partial<Record<T, number>> | Record<string, number>;
  /** Count shown on the All chip. */
  allCount?: number;
}

export function AdminFilterChips<T extends string>({
  label,
  value,
  options,
  onChange,
  allowAll = true,
  counts,
  allCount,
}: AdminFilterChipsProps<T>) {
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {allowAll ? (
          <Chip
            selected={value === undefined}
            label="All"
            count={allCount}
            onPress={() => onChange(undefined)}
          />
        ) : null}
        {options.map((option) => (
          <Chip
            key={option.value}
            selected={value === option.value}
            label={option.label}
            count={counts?.[option.value]}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

function Chip({
  selected,
  label,
  count,
  onPress,
}: {
  selected: boolean;
  label: string;
  count?: number;
  onPress: () => void;
}) {
  const badge = typeof count === 'number' && count > 0 ? count : 0;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={badge > 0 ? `${label}, ${badge} unassigned` : label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.chip, selected ? styles.chipSelected : null, pressed ? styles.pressed : null]}
    >
      <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>{label}</Text>
      {badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>{badge > 99 ? '99+' : String(badge)}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.captionStrong,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chipSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  chipLabelSelected: {
    color: colors.primary,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    backgroundColor: colors.emergency,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    ...typography.captionStrong,
    color: colors.white,
    fontSize: 11,
    lineHeight: 14,
  },
  pressed: {
    opacity: 0.85,
  },
});
