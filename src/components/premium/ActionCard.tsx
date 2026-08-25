import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, minTouchSize, spacing, typography } from '@/constants/theme';
import { Icon, IconWell, type IconName } from '@/components/ui';
import { PremiumCard } from './PremiumCard';

type ActionCardProps = {
  title: string;
  subtitle?: string;
  icon: IconName;
  actionLabel?: string;
  tone?: 'primary' | 'accent' | 'safe' | 'emergency' | 'warning';
  onPress?: () => void;
};

export function ActionCard({
  title,
  subtitle,
  icon,
  actionLabel = 'Open',
  tone = 'primary',
  onPress,
}: ActionCardProps) {
  const fg =
    tone === 'emergency'
      ? colors.emergency
      : tone === 'safe'
        ? colors.safe
        : tone === 'accent'
          ? colors.accent
          : tone === 'warning'
            ? colors.warning
            : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle ?? ''}`}
      style={({ pressed }) => [pressed ? styles.pressed : null]}
    >
      <PremiumCard style={styles.row}>
        <IconWell tone={tone} size={48} rounded="full">
          <Icon name={icon} size={20} color={fg} />
        </IconWell>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {onPress ? <Text style={[styles.action, { color: fg }]}>{actionLabel}</Text> : null}
      </PremiumCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: minTouchSize + 8,
  },
  copy: {
    flex: 1,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  action: {
    ...typography.captionStrong,
  },
  pressed: {
    opacity: 0.94,
  },
});
