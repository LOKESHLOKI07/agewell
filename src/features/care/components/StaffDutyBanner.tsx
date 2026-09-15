import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/constants/theme';

interface StaffDutyBannerProps {
  sinceLabel?: string | null;
  onDuty?: boolean;
  onPress?: () => void;
}

export function StaffDutyBanner({ sinceLabel, onDuty = true, onPress }: StaffDutyBannerProps) {
  const content = !onDuty ? (
    <View style={[styles.banner, styles.offDuty]} accessibilityRole="text" accessibilityLabel="Off duty">
      <Icon name="alert-circle-outline" size={20} color={colors.textSecondary} />
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>OFF DUTY</Text>
        <Text style={styles.since}>You are not marked on duty</Text>
      </View>
    </View>
  ) : (
    <View
      style={styles.banner}
      accessibilityRole="text"
      accessibilityLabel={`On duty${sinceLabel ? `, since ${sinceLabel}` : ''}`}
    >
      <View style={styles.iconWell}>
        <Icon name="shield-checkmark-outline" size={20} color={colors.safe} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>ON DUTY</Text>
        {sinceLabel ? <Text style={styles.since}>Since {sinceLabel}</Text> : null}
      </View>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={onDuty ? 'Open attendance' : 'Check in for duty'}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.safeSoft,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  offDuty: {
    backgroundColor: colors.surfaceMuted,
  },
  iconWell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  title: {
    ...typography.subtitle,
    color: colors.safe,
    letterSpacing: 0.4,
  },
  since: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.92,
  },
});
