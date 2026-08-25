import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router, type Href } from 'expo-router';
import { useNavigation } from 'expo-router';
import { colors, minTouchSize, typography, spacing } from '@/constants/theme';
import { Avatar, Icon } from '@/components/ui';
import { useAuthStore } from '@/features/auth/authStore';
import { authenticatedProfileHref } from '@/features/auth/roleRouting';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { useI18n } from '@/i18n';
import { getGreeting } from '@/utils/greeting';
import { safeGoBack } from '@/utils/navigation';

interface AgeWellHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showProfile?: boolean;
  showBell?: boolean;
  unreadCount?: number;
  profileName?: string | null;
  showOnline?: boolean;
  showGreeting?: boolean;
  showTagline?: boolean;
  centerTitle?: boolean;
}

export function AgeWellHeader({
  title,
  subtitle,
  showBack,
  showProfile = true,
  showBell = true,
  unreadCount = 0,
  profileName,
  showOnline = false,
  showGreeting = false,
  showTagline = false,
  centerTitle = false,
}: AgeWellHeaderProps) {
  const role = useAuthStore((state) => state.user?.role);
  const navigation = useNavigation();
  const { t } = useI18n();
  const greeting =
    showGreeting && profileName
      ? `${getGreeting()}, ${profileName.split(' ')[0]}`
      : showGreeting
        ? getGreeting()
        : null;

  const heading = (
    <Text style={styles.brand} accessibilityRole="header" numberOfLines={1}>
      {title || t('brand.name')}
    </Text>
  );

  const backButton = showBack ? (
    <Pressable
      onPress={() => safeGoBack(navigation.canGoBack(), role)}
      style={styles.backBtn}
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
    >
      <Icon name="arrow-back" size={22} color={colors.text} />
      <Text style={styles.backLabel}>{t('common.back')}</Text>
    </Pressable>
  ) : null;

  const rightSide = (
    <View style={styles.rightSide}>
      {showBell ? <NotificationBell unreadCount={unreadCount} /> : null}
      {showProfile ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.profile')}
          style={styles.profileAvatar}
          onPress={() => router.push(authenticatedProfileHref(role) as Href)}
        >
          <Avatar name={profileName} size={44} showOnline={showOnline} />
          <Text style={styles.profileLabel}>{t('common.profile')}</Text>
        </Pressable>
      ) : null}
    </View>
  );

  if (centerTitle) {
    return (
      <View style={styles.container}>
        <View style={styles.side}>{backButton}</View>
        <View style={styles.centerTitle} pointerEvents="none">
          {heading}
        </View>
        <View style={[styles.side, styles.sideRight]}>{rightSide}</View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {backButton}
        <View style={styles.titles}>
          {heading}
          {greeting ? <Text style={styles.greeting}>{greeting}</Text> : null}
          {showTagline ? <Text style={styles.tagline}>{t('brand.tagline')}</Text> : null}
          {subtitle && !showTagline ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {rightSide}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    position: 'relative',
  },
  side: {
    minWidth: minTouchSize,
    zIndex: 1,
  },
  sideRight: {
    alignItems: 'flex-end',
    marginLeft: 'auto',
  },
  centerTitle: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 72,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  titles: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  brand: {
    ...typography.title,
    color: colors.primary,
  },
  greeting: {
    ...typography.subtitle,
    color: colors.text,
    marginTop: 4,
  },
  tagline: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backBtn: {
    marginRight: spacing.md,
    minWidth: minTouchSize,
    minHeight: minTouchSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  profileAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: minTouchSize,
    minHeight: minTouchSize,
  },
  profileLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
