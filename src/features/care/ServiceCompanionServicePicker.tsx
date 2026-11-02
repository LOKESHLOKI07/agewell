import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, minTouchSize, radius, spacing, typography } from '@/constants/theme';
import {
  SERVICE_COMPANION_OPTIONS,
  type ServiceCompanionSlug,
} from './serviceCompanionServices';

type Props = {
  values: readonly string[];
  onChange: (values: ServiceCompanionSlug[]) => void;
  label?: string;
  hint?: string;
  error?: string | null;
};

export function ServiceCompanionServicePicker({
  values,
  onChange,
  label = 'Services this companion covers',
  hint = 'Choose one or more. They will only be offered these jobs.',
  error,
}: Props) {
  const selected = new Set(values);

  const toggle = (slug: ServiceCompanionSlug) => {
    if (selected.has(slug)) {
      onChange(values.filter((item) => item !== slug) as ServiceCompanionSlug[]);
      return;
    }
    onChange([...values, slug] as ServiceCompanionSlug[]);
  };

  return (
    <View style={styles.wrap} accessibilityRole="list" accessibilityLabel={label}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={styles.row}>
        {SERVICE_COMPANION_OPTIONS.map((option) => {
          const isOn = selected.has(option.value);
          return (
            <Pressable
              key={option.value}
              onPress={() => toggle(option.value)}
              accessibilityRole="checkbox"
              accessibilityLabel={option.label}
              accessibilityState={{ checked: isOn }}
              style={({ pressed }) => [
                styles.chip,
                isOn ? styles.chipSelected : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={[styles.chipLabel, isOn ? styles.chipLabelSelected : null]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.captionStrong,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
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
  error: {
    ...typography.caption,
    color: colors.emergency,
    marginTop: spacing.sm,
  },
});
