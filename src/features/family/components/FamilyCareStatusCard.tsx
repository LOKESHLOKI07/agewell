import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, IconWell } from '@/components/ui';
import { colors, minTouchSize, radius, spacing, tones, typography, type ColorTone } from '@/constants/theme';

interface FamilyCareStatusCardProps {
  title: string;
  subtitle: string;
  checkIn: string;
  tone: ColorTone;
  onPress: () => void;
}

export function FamilyCareStatusCard({ title, subtitle, checkIn, tone, onPress }: FamilyCareStatusCardProps) {
  const palette = tones[tone === 'default' ? 'safe' : tone];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}. ${checkIn}`}
      accessibilityHint="Opens health records"
      style={({ pressed }) => [styles.card, { backgroundColor: palette.bg }, pressed ? styles.pressed : null]}
    >
      <IconWell tone={tone === 'default' ? 'safe' : tone} size={52} rounded="full">
        <Icon name="shield-checkmark-outline" size={22} color={palette.fg} />
      </IconWell>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: palette.fg }]}>{subtitle}</Text>
        <View style={styles.metaRow}>
          <Icon name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.meta}>{checkIn}</Text>
        </View>
      </View>
      <View style={styles.art} pointerEvents="none">
        <Icon name="home-outline" size={72} color={palette.fg} strokeWidth={1.2} />
      </View>
      <Icon name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: minTouchSize + 36,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    overflow: 'hidden',
  },
  copy: {
    flex: 1,
    zIndex: 1,
  },
  title: {
    ...typography.heading,
  },
  subtitle: {
    ...typography.bodyStrong,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  art: {
    position: 'absolute',
    right: 36,
    bottom: -8,
    opacity: 0.12,
  },
  pressed: {
    opacity: 0.94,
  },
});
