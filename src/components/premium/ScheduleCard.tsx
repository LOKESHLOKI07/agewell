import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, minTouchSize, spacing, typography } from '@/constants/theme';
import { Icon, IconWell, type IconName } from '@/components/ui';
import { PremiumCard } from './PremiumCard';
import { StatusPill, statusToneFromLabel } from './StatusPill';

export type ScheduleCardProps = {
  title: string;
  subtitle?: string | null;
  status?: string | null;
  timeLabel?: string | null;
  icon?: IconName;
  onPress?: () => void;
  accessibilityHint?: string;
};

export function ScheduleCard({
  title,
  subtitle,
  status,
  timeLabel,
  icon = 'calendar-outline',
  onPress,
  accessibilityHint,
}: ScheduleCardProps) {
  const content = (
    <PremiumCard padded style={styles.inner}>
      <IconWell tone="primary" size={48} rounded="full">
        <Icon name={icon} size={20} color={colors.primary} />
      </IconWell>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        <View style={styles.meta}>
          {timeLabel ? <Text style={styles.time}>{timeLabel}</Text> : null}
          {status ? <StatusPill label={status} tone={statusToneFromLabel(status)} /> : null}
        </View>
      </View>
    </PremiumCard>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle, timeLabel, status].filter(Boolean).join('. ')}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.pressable, pressed ? styles.pressed : null]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    minHeight: minTouchSize,
  },
  pressed: {
    opacity: 0.94,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  time: {
    ...typography.captionStrong,
    color: colors.primary,
  },
});
