import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, minTouchSize, radius, spacing, typography } from '@/constants/theme';

export interface PillTabOption<T extends string> {
  value: T;
  label: string;
}

interface PillTabsProps<T extends string> {
  value: T;
  options: readonly PillTabOption<T>[];
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

export function PillTabs<T extends string>({ value, options, onChange, accessibilityLabel }: PillTabsProps<T>) {
  return (
    <View accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              style={({ pressed }) => [styles.pill, selected ? styles.pillSelected : null, pressed ? styles.pressed : null]}
            >
              <Text style={[styles.label, selected ? styles.labelSelected : null]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pill: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.white,
  },
  pressed: {
    opacity: 0.9,
  },
});
