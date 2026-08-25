import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, minTouchSize, radius, spacing, typography } from '@/constants/theme';
import { seniorDisplayName } from '@/features/home/api/mappers';
import type { SeniorProfile } from '@/features/home/types/home';

interface SeniorSelectorProps {
  seniors: SeniorProfile[];
  selectedSeniorId: string | null;
  onSelect: (seniorId: string) => void;
  disabled?: boolean;
}

export function SeniorSelector({ seniors, selectedSeniorId, onSelect, disabled = false }: SeniorSelectorProps) {
  if (seniors.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Looking after</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {seniors.map((senior) => {
          const selected = senior.id === selectedSeniorId;
          const name = seniorDisplayName(senior);
          return (
            <Pressable
              key={senior.id}
              onPress={() => {
                if (!disabled && !selected) {
                  onSelect(senior.id);
                }
              }}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled }}
              accessibilityLabel={selected ? `${name}, selected` : `Show information for ${name}`}
              style={({ pressed }) => [
                styles.chip,
                selected ? styles.chipSelected : null,
                pressed && !disabled ? styles.pressed : null,
              ]}
            >
              <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  row: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  chip: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.white,
  },
  pressed: {
    opacity: 0.94,
  },
});
