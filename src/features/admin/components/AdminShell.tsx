import { router, usePathname, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AgeWellLogo } from '@/components/AgeWellLogo';
import { Icon, type IconName } from '@/components/ui';
import { colors, minTouchSize, radius, spacing, typography } from '@/constants/theme';
import { AUTH_ROLE_LABELS } from '@/features/auth/authTypes';
import { useAuthStore } from '@/features/auth/authStore';
import { resolveAdminSearchTarget } from '../dashboardModel';
import { useAdminEmergencies, useAdminNotifications } from '../hooks';
import { ADMIN_NAV, ADMIN_NAV_GROUPS, adminMobileTabs, isAdminPathActive } from '../selectors';
import { useAdminLayout } from '../useAdminLayout';

const coupleArt = require('../../../../assets/parents.png');

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const { isDesktop } = useAdminLayout();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const openEmergencies = useAdminEmergencies({ limit: 1, offset: 0, status: 'OPEN' });
  const unreadNotifications = useAdminNotifications({ limit: 1, offset: 0, isRead: false });
  const badges: Record<string, number> = {
    emergencies: openEmergencies.data?.total ?? 0,
    notifications: unreadNotifications.data?.total ?? 0,
  };

  if (isDesktop) {
    return (
      <View style={[styles.desktop, { paddingTop: insets.top }]}>
        <View style={styles.sidebar} accessibilityRole="menu" accessibilityLabel="Admin navigation">
          <View style={styles.brandBlock}>
            <AgeWellLogo variant="onDark" width={168} height={92} />
          </View>
          <ScrollView contentContainerStyle={styles.sidebarList} showsVerticalScrollIndicator={false}>
            {ADMIN_NAV_GROUPS.map((group) => {
              const items = group.keys
                .map((key) => ADMIN_NAV.find((item) => item.key === key))
                .filter((item): item is (typeof ADMIN_NAV)[number] => Boolean(item));
              if (!items.length) return null;
              return (
                <View key={group.title} style={styles.navGroup}>
                  <Text style={styles.navGroupTitle}>{group.title}</Text>
                  {items.map((item) => (
                    <NavButton
                      key={item.key}
                      label={item.label}
                      icon={item.icon}
                      badge={badges[item.key] || 0}
                      active={isAdminPathActive(pathname, item.href)}
                      onPress={() => router.push(item.href as Href)}
                    />
                  ))}
                </View>
              );
            })}
          </ScrollView>
          <View style={styles.sidebarFooter}>
            <Image source={coupleArt} style={styles.footerArt} resizeMode="contain" accessibilityIgnoresInvertColors />
            <Text style={styles.footerCopy}>Supporting healthier, happier tomorrows.</Text>
          </View>
        </View>
        <View style={styles.desktopMain}>
          <AdminTopBar
            email={user?.email ?? null}
            role={user?.role ? AUTH_ROLE_LABELS[user.role] : 'Staff'}
            notificationCount={badges.notifications}
            showSearch={!isAdminPathActive(pathname, '/(admin)')}
          />
          <View style={styles.desktopBody}>{children}</View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.mobile, { paddingTop: insets.top }]}>
      <AdminTopBar
        compact
        email={user?.email ?? null}
        role={user?.role ? AUTH_ROLE_LABELS[user.role] : 'Staff'}
        notificationCount={badges.notifications}
        showSearch={false}
      />
      <View style={styles.mobileMain}>{children}</View>
      <View
        style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}
        accessibilityRole="tablist"
        accessibilityLabel="Admin navigation"
      >
        {adminMobileTabs().map((item) => {
          const active = isAdminPathActive(pathname, item.href);
          const badge = badges[item.key] || 0;
          return (
            <Pressable
              key={item.key}
              onPress={() => router.push(item.href as Href)}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [styles.tab, pressed ? styles.pressed : null]}
            >
              <View>
                <Icon name={item.icon} size={20} color={active ? colors.primary : colors.textSecondary} />
                {badge > 0 ? (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeLabel}>{badge > 9 ? '9+' : badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.tabLabel, active ? styles.tabLabelActive : null]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function AdminTopBar({
  email,
  role,
  notificationCount,
  compact = false,
  showSearch = true,
}: {
  email: string | null;
  role: string;
  notificationCount: number;
  compact?: boolean;
  showSearch?: boolean;
}) {
  const [query, setQuery] = useState('');
  const displayName = email?.split('@')[0] || 'Admin';
  const initial = displayName.charAt(0).toUpperCase();
  const roleLabel = role === 'Admin' ? 'Administrator' : role;

  const submitSearch = () => {
    const target = resolveAdminSearchTarget(query);
    if (target.params) {
      router.push({ pathname: target.href, params: target.params } as Href);
      return;
    }
    router.push(target.href as Href);
  };

  return (
    <View style={[styles.topBar, compact ? styles.topBarCompact : null]}>
      {compact ? (
        <AgeWellLogo width={108} height={48} />
      ) : showSearch ? (
        <View style={styles.searchWrap}>
          <Icon name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search seniors, visits, requests..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={submitSearch}
            accessibilityLabel="Search admin"
          />
        </View>
      ) : (
        <View style={styles.topBarSpacer} />
      )}
      <View style={styles.topBarRight}>
        <Pressable
          onPress={() => router.push('/(admin)/notifications' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          style={({ pressed }) => [styles.bellBtn, pressed ? styles.pressed : null]}
        >
          <Icon name="notifications-outline" size={20} color={colors.text} />
          {notificationCount > 0 ? (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeLabel}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable
          onPress={() => router.push('/(admin)/profile' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          style={({ pressed }) => [styles.profile, pressed ? styles.pressed : null]}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>{initial}</Text>
          </View>
          {compact ? null : (
            <View>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileRole}>{roleLabel}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function NavButton({
  label,
  icon,
  active,
  badge,
  onPress,
}: {
  label: string;
  icon: IconName;
  active: boolean;
  badge: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitem"
      accessibilityLabel={badge > 0 ? `${label}, ${badge}` : label}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.navItem, active ? styles.navItemActive : null, pressed ? styles.pressed : null]}
    >
      <Icon name={icon} size={18} color={active ? colors.white : colors.sidebarMuted} />
      <Text style={[styles.navLabel, active ? styles.navLabelActive : null]}>{label}</Text>
      {badge > 0 ? (
        <View style={styles.navBadge}>
          <Text style={styles.navBadgeLabel}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  desktop: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.adminCanvas,
  },
  sidebar: {
    width: 268,
    backgroundColor: colors.sidebar,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.lg,
  },
  brandBlock: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  sidebarList: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  navGroup: {
    gap: 2,
  },
  navGroupTitle: {
    ...typography.captionStrong,
    color: colors.sidebarMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 11,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  navItem: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  navItemActive: {
    backgroundColor: colors.sidebarActive,
  },
  navLabel: {
    ...typography.body,
    fontSize: 14,
    color: colors.sidebarMuted,
    flex: 1,
  },
  navLabelActive: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.white,
  },
  navBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.emergency,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  navBadgeLabel: {
    ...typography.captionStrong,
    color: colors.white,
    fontSize: 10,
    lineHeight: 12,
  },
  sidebarFooter: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  footerArt: {
    width: 120,
    height: 88,
  },
  footerCopy: {
    ...typography.caption,
    color: colors.sidebarMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  desktopMain: {
    flex: 1,
    backgroundColor: colors.adminCanvas,
  },
  desktopBody: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBarCompact: {
    paddingHorizontal: spacing.md,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    backgroundColor: colors.adminCanvas,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  topBarSpacer: {
    flex: 1,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.adminCanvas,
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.emergency,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeLabel: {
    ...typography.captionStrong,
    color: colors.white,
    fontSize: 9,
    lineHeight: 11,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.sidebar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    ...typography.bodyStrong,
    color: colors.white,
  },
  profileName: {
    ...typography.bodyStrong,
    color: colors.text,
    textTransform: 'capitalize',
  },
  profileRole: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  mobile: {
    flex: 1,
    backgroundColor: colors.adminCanvas,
  },
  mobileMain: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    minHeight: 72,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: minTouchSize,
    gap: 2,
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.emergency,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeLabel: {
    ...typography.captionStrong,
    color: colors.white,
    fontSize: 8,
    lineHeight: 10,
  },
  tabLabel: {
    ...typography.captionStrong,
    fontSize: 11,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
});
