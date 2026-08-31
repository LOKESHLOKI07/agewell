import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { familyHome } from './familyHomeTheme';

export function FamilyHomeSectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" accessibilityLabel={actionLabel}>
          <Text style={styles.action}>{actionLabel} ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function FamilyHomeIconWell({
  name,
  color,
  background,
  size = 22,
}: {
  name: IconName;
  color: string;
  background: string;
  size?: number;
}) {
  return (
    <View style={[styles.well, { backgroundColor: background }]}>
      <Icon name={name} size={size} color={color} />
    </View>
  );
}

export function FamilyHomeCardShell({
  children,
  onPress,
  background = familyHome.white,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  background?: string;
  style?: object;
}) {
  if (!onPress) {
    return <View style={[styles.card, { backgroundColor: background }, style]}>{children}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, { backgroundColor: background }, style, pressed ? styles.pressed : null]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: familyHome.text,
  },
  action: {
    ...typography.captionStrong,
    color: familyHome.green,
  },
  well: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: familyHome.border,
  },
  pressed: {
    opacity: 0.92,
  },
});
