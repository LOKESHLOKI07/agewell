import { Pressable, StyleSheet, Text } from 'react-native';
import { cardSurface, colors, minTouchSize, spacing, typography } from '@/constants/theme';
import { Icon, type IconName } from './Icon';
import { IconWell } from './IconWell';

interface QuickAccessTileProps {
  label: string;
  icon: IconName;
  onPress: () => void;
}

export function QuickAccessTile({ label, icon, onPress }: QuickAccessTileProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.tile, pressed ? styles.pressed : null]}
    >
      <IconWell tone="primary" size={44}>
        <Icon name={icon} size={22} color={colors.primary} />
      </IconWell>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: 140,
    minHeight: minTouchSize + 52,
    ...cardSurface,
    padding: spacing.lg,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: {
    ...typography.subtitle,
    color: colors.text,
  },
  pressed: {
    opacity: 0.94,
  },
});
