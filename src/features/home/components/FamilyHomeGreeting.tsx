import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar, Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { seniorDisplayName } from '@/features/home/api/mappers';
import type { SeniorProfile } from '@/features/home/types/home';
import { familyHome } from './familyHomeTheme';

interface FamilyHomeGreetingProps {
  firstName: string;
  subtitle?: string;
  seniors?: SeniorProfile[];
  selectedSenior?: SeniorProfile | null;
  onPressCareFor?: () => void;
}

export function FamilyHomeGreeting({
  firstName,
  subtitle = "We're here to take care of your loved ones.",
  seniors = [],
  selectedSenior = null,
  onPressCareFor,
}: FamilyHomeGreetingProps) {
  const showCareFor = Boolean(onPressCareFor);
  const label =
    seniors.length > 1
      ? seniors.length === 2
        ? 'Mom & Dad'
        : `${seniors.length} seniors`
      : selectedSenior
        ? seniorDisplayName(selectedSenior).split(' ')[0]
        : 'Family';

  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.hello} accessibilityRole="header">
          Hello, {firstName}! 👋
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {showCareFor ? (
        <Pressable
          onPress={onPressCareFor}
          accessibilityRole="button"
          accessibilityLabel={`Care for ${label}`}
          style={({ pressed }) => [styles.careFor, pressed ? styles.pressed : null]}
        >
          <Text style={styles.careLabel}>Care for</Text>
          <View style={styles.careValue}>
            <Avatar name={selectedSenior ? seniorDisplayName(selectedSenior) : label} size={22} />
            <Text style={styles.careName} numberOfLines={1}>
              {label}
            </Text>
            <Icon name="chevron-down" size={14} color={familyHome.muted} />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  copy: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  hello: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    color: familyHome.text,
  },
  subtitle: {
    ...typography.body,
    color: familyHome.muted,
    marginTop: 4,
  },
  careFor: {
    minWidth: 108,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: familyHome.border,
    backgroundColor: familyHome.white,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  careLabel: {
    ...typography.caption,
    color: familyHome.muted,
    marginBottom: 4,
  },
  careValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  careName: {
    ...typography.captionStrong,
    color: familyHome.text,
    maxWidth: 64,
  },
  pressed: {
    opacity: 0.9,
  },
});
