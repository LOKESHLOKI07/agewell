import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, minTouchSize, spacing, typography } from '@/constants/theme';
import { Icon, type IconName } from './Icon';
import { IconWell } from './IconWell';

interface CircularActionProps {
  label: string;
  icon: IconName;
  onPress: () => void;
}

export function CircularAction({ label, icon, onPress }: CircularActionProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.item, pressed ? styles.pressed : null]}
    >
      <IconWell tone="primary" size={64} rounded="full">
        <Icon name={icon} size={24} color={colors.primary} />
      </IconWell>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    width: 76,
    alignItems: 'center',
    minHeight: minTouchSize,
    gap: spacing.sm,
  },
  label: {
    ...typography.captionStrong,
    color: colors.text,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.88,
  },
});
