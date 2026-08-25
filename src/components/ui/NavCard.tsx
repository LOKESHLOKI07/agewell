import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cardSurface, colors, minTouchSize, spacing, typography, type ColorTone, tones } from '@/constants/theme';
import { Icon, type IconName } from './Icon';
import { IconWell } from './IconWell';

interface NavCardProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  tone?: ColorTone;
  actionLabel?: string;
  onAction?: () => void;
  accessibilityHint?: string;
}

export function NavCard({
  icon,
  title,
  subtitle,
  onPress,
  tone = 'primary',
  actionLabel,
  onAction,
  accessibilityHint,
}: NavCardProps) {
  const palette = tones[tone === 'default' ? 'primary' : tone];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <IconWell tone={tone === 'default' ? 'primary' : tone} size={52}>
        <Icon name={icon} size={22} color={palette.fg} />
      </IconWell>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel ? (
        <Pressable
          onPress={onAction ?? onPress}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={8}
        >
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : (
        <Icon name="chevron-forward" size={18} color={colors.textMuted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardSurface,
    minHeight: minTouchSize + 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  text: {
    flex: 1,
  },
  title: {
    ...typography.subtitle,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  action: {
    ...typography.captionStrong,
    color: colors.primary,
  },
  pressed: {
    opacity: 0.94,
  },
});
