import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cardSurface, colors, minTouchSize, spacing, tones, typography, type ColorTone } from '@/constants/theme';
import { Icon, type IconName } from './Icon';
import { IconWell } from './IconWell';

interface StatTileProps {
  title: string;
  value: string;
  icon?: IconName;
  tone?: ColorTone;
  onPress?: () => void;
  compact?: boolean;
}

export function StatTile({ title, value, icon, tone = 'default', onPress, compact = false }: StatTileProps) {
  const palette = tones[tone === 'default' ? 'primary' : tone];
  const content = (
    <View style={[styles.tile, compact ? styles.tileCompact : null]}>
      {icon ? (
        <IconWell tone={tone === 'default' ? 'primary' : tone} size={compact ? 36 : 40}>
          <Icon name={icon} size={compact ? 18 : 20} color={palette.fg} />
        </IconWell>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${value}`}
      style={({ pressed }) => [styles.pressable, compact ? styles.pressableCompact : null, pressed ? styles.pressed : null]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    minWidth: '47%',
    minHeight: minTouchSize,
  },
  pressableCompact: {
    minWidth: 0,
  },
  tile: {
    flex: 1,
    minWidth: '47%',
    ...cardSurface,
    padding: spacing.lg,
    minHeight: 118,
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  tileCompact: {
    minWidth: 0,
    minHeight: 100,
    padding: spacing.md,
  },
  title: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  value: {
    ...typography.heading,
    color: colors.text,
  },
  pressed: {
    opacity: 0.94,
  },
});
