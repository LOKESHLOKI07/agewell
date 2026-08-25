import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, IconWell } from '@/components/ui';
import { colors, minTouchSize, radius, spacing, typography } from '@/constants/theme';
import { emergencyTypeLabel } from '@/features/emergency/selectors';
import type { EmergencyCase } from '@/features/emergency/types/emergency';

interface FamilyEmergencyCardProps {
  emergency: EmergencyCase | null;
  onPress?: () => void;
}

export function FamilyEmergencyCard({ emergency, onPress }: FamilyEmergencyCardProps) {
  if (!emergency) {
    return (
      <View style={styles.quiet} accessibilityRole="text" accessibilityLabel="No active emergencies">
        <Icon name="shield-checkmark-outline" size={16} color={colors.safe} />
        <Text style={styles.quietText}>No active emergencies</Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Active Emergency. ${emergencyTypeLabel(emergency.type)}. AgeWell team is responding`}
      accessibilityHint="Opens emergency details"
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <View>
        <IconWell tone="emergency" size={48} rounded="full">
          <Icon name="ambulance" size={20} color={colors.emergency} />
        </IconWell>
        <View style={styles.pulse} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Active Emergency</Text>
        <Text style={styles.line}>{emergencyTypeLabel(emergency.type)} requested</Text>
        <Text style={styles.meta}>AgeWell team is responding</Text>
      </View>
      <View style={styles.cta}>
        <Text style={styles.ctaText}>View Details</Text>
        <Icon name="chevron-forward" size={16} color={colors.white} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  quiet: {
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  quietText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  card: {
    minHeight: minTouchSize + 24,
    backgroundColor: colors.emergencySoft,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pulse: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.emergency,
    borderWidth: 2,
    borderColor: colors.white,
  },
  copy: {
    flex: 1,
  },
  title: {
    ...typography.subtitle,
    color: colors.emergency,
  },
  line: {
    ...typography.body,
    color: colors.text,
    marginTop: 2,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cta: {
    backgroundColor: colors.emergency,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 36,
  },
  ctaText: {
    ...typography.captionStrong,
    color: colors.white,
  },
  pressed: {
    opacity: 0.94,
  },
});
