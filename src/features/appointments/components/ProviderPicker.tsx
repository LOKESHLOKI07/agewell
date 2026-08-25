import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { HealthInfoCard } from '@/features/health/components/HealthInfoCard';
import type { HealthcareProvider } from '@/features/home/types/home';
import { providerLabel } from '../selectors';

interface ProviderPickerProps {
  providers: HealthcareProvider[];
  value: string | null;
  onChange: (id: string) => void;
}

export function ProviderPicker({ providers, value, onChange }: ProviderPickerProps) {
  return (
    <View style={styles.list} accessibilityRole="radiogroup" accessibilityLabel="Doctors">
      {providers.map((provider) => {
        const selected = provider.id === value;
        const specialty = provider.specialty?.trim();
        return (
          <Pressable
            key={provider.id}
            onPress={() => onChange(provider.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={providerLabel(provider)}
            style={({ pressed }) => [styles.option, selected ? styles.selected : null, pressed ? styles.pressed : null]}
          >
            <HealthInfoCard
              title={provider.name ?? 'Doctor'}
              icon="doctor"
              tone={selected ? 'primary' : 'safe'}
              lines={specialty ? [specialty] : []}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  option: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selected: {
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.92,
  },
});
