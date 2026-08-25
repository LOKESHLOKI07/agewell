import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cardSurface, colors, minTouchSize, spacing, typography } from '@/constants/theme';
import { Icon, type IconName } from './Icon';
import { IconWell } from './IconWell';

interface MenuRowProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
}

export function MenuRow({ icon, title, subtitle, onPress, destructive = false }: MenuRowProps) {
  const color = destructive ? colors.emergency : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      <IconWell tone={destructive ? 'emergency' : 'primary'} size={44}>
        <Icon name={icon} size={20} color={color} />
      </IconWell>
      <View style={styles.text}>
        <Text style={[styles.title, destructive ? styles.destructive : null]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Icon name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: minTouchSize + 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...cardSurface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
    marginTop: 2,
  },
  destructive: {
    color: colors.emergency,
  },
  pressed: {
    opacity: 0.94,
  },
});
