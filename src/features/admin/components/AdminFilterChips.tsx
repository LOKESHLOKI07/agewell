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
}

export function AdminFilterChips<T extends string>({
  label,
  value,
  options,
  onChange,
  allowAll = true,
}: AdminFilterChipsProps<T>) {
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {allowAll ? (
          <Chip selected={value === undefined} label="All" onPress={() => onChange(undefined)} />
        ) : null}
        {options.map((option) => (
          <Chip
            key={option.value}
            selected={value === option.value}
            label={option.label}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

function Chip({ selected, label, onPress }: { selected: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.chip, selected ? styles.chipSelected : null, pressed ? styles.pressed : null]}
    >
      <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>{label}</Text>
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
  pressed: {
    opacity: 0.85,
  },
});
