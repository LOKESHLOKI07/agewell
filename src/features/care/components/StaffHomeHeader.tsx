import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Avatar } from '@/components/ui';
import { colors, minTouchSize, spacing, typography } from '@/constants/theme';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { getGreeting } from '@/utils/greeting';

interface StaffHomeHeaderProps {
  name: string | null | undefined;
  roleLabel: string;
  accent: string;
  unreadCount?: number;
  photoUri?: string | null;
  profileHref?: string;
  ringAvatar?: boolean;
}

export function StaffHomeHeader({
  name,
  roleLabel,
  accent,
  unreadCount = 0,
  photoUri,
  profileHref = '/(care)/profile',
  ringAvatar = false,
}: StaffHomeHeaderProps) {
  const firstName = name?.trim().split(/\s+/)[0] || 'there';
  const greeting = `${getGreeting()}, ${firstName}`;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => router.push(profileHref as Href)}
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        style={styles.avatarPress}
      >
        <View style={[styles.avatarRing, ringAvatar ? { borderColor: accent } : null]}>
          <Avatar name={name} imageUri={photoUri} size={ringAvatar ? 48 : 52} />
        </View>
      </Pressable>
      <View style={styles.textBlock}>
        <Text style={styles.greeting} numberOfLines={1}>
          {greeting}
        </Text>
        <Text style={[styles.role, { color: accent }]} numberOfLines={1}>
          {roleLabel}
        </Text>
      </View>
      <NotificationBell unreadCount={unreadCount} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
    minHeight: minTouchSize,
  },
  avatarPress: {
    minWidth: minTouchSize,
    minHeight: minTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 2,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    ...typography.heading,
    color: colors.text,
  },
  role: {
    ...typography.captionStrong,
    marginTop: 2,
  },
});
