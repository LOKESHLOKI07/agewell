import { router, usePathname, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, minTouchSize, radius, spacing, typography } from '@/constants/theme';
import { Icon, type IconName } from '@/components/ui';
import { AUTH_ROLE_LABELS } from '@/features/auth/authTypes';
import { useAuthStore } from '@/features/auth/authStore';
import { ADMIN_NAV, adminMobileTabs, isAdminPathActive } from '../selectors';
import { useAdminLayout } from '../useAdminLayout';

interface AdminShellProps {
  children: ReactNode;
}

const NAV_GROUPS: { title: string; keys: string[] }[] = [
  { title: 'Overview', keys: ['dashboard'] },
  { title: 'People', keys: ['users', 'seniors', 'families', 'access', 'careManagers'] },
  { title: 'Care ops', keys: ['visits', 'appointments', 'services', 'requests', 'emergencies'] },
  { title: 'Programs', keys: ['community', 'memberships'] },
  { title: 'System', keys: ['notifications', 'audit', 'profile'] },
];

export function AdminShell({ children }: AdminShellProps) {
  const { isDesktop } = useAdminLayout();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const role = useAuthStore((state) => state.user?.role);
  const email = useAuthStore((state) => state.user?.email);

  if (isDesktop) {
    return (
      <View style={[styles.desktop, { paddingTop: insets.top }]}>
        <View style={styles.sidebar} accessibilityRole="menu" accessibilityLabel="Admin navigation">
          <View style={styles.brandBlock}>
            <Text style={styles.brand}>AgeWell</Text>
            <Text style={styles.brandSub}>Administration</Text>
            <Text style={styles.role}>{role ? AUTH_ROLE_LABELS[role] : 'Staff'}</Text>
            {email ? <Text style={styles.email} numberOfLines={1}>{email}</Text> : null}
          </View>
          <ScrollView contentContainerStyle={styles.sidebarList} showsVerticalScrollIndicator={false}>
            {NAV_GROUPS.map((group) => {
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
                      active={isAdminPathActive(pathname, item.href)}
                      onPress={() => router.push(item.href as Href)}
                    />
                  ))}
                </View>
              );
            })}
          </ScrollView>
        </View>
        <View style={styles.desktopMain}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[styles.mobile, { paddingTop: insets.top }]}>
      <View style={styles.mobileMain}>{children}</View>
      <View
        style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}
        accessibilityRole="tablist"
        accessibilityLabel="Admin navigation"
      >
        {adminMobileTabs().map((item) => {
          const active = isAdminPathActive(pathname, item.href);
          return (
            <Pressable
              key={item.key}
              onPress={() => router.push(item.href as Href)}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [styles.tab, pressed ? styles.pressed : null]}
            >
              <Icon name={item.icon} size={20} color={active ? colors.primary : colors.textSecondary} />
              <Text style={[styles.tabLabel, active ? styles.tabLabelActive : null]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function NavButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: IconName;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitem"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.navItem, active ? styles.navItemActive : null, pressed ? styles.pressed : null]}
    >
      <Icon name={icon} size={18} color={active ? colors.white : colors.sidebarMuted} />
      <Text style={[styles.navLabel, active ? styles.navLabelActive : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  desktop: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  sidebar: {
    width: 248,
    backgroundColor: colors.sidebar,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.lg,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
  },
  brandBlock: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  brand: {
    ...typography.heading,
    color: colors.sidebarText,
  },
  brandSub: {
    ...typography.caption,
    color: colors.sidebarMuted,
    marginTop: 2,
  },
  role: {
    ...typography.captionStrong,
    color: colors.sidebarText,
    marginTop: spacing.md,
  },
  email: {
    ...typography.caption,
    color: colors.sidebarMuted,
    marginTop: 2,
  },
  sidebarList: {
    paddingBottom: spacing.huge,
    gap: spacing.md,
  },
  navGroup: {
    gap: 2,
  },
  navGroupTitle: {
    ...typography.captionStrong,
    color: colors.sidebarMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
  },
  navLabelActive: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.white,
  },
  desktopMain: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mobile: {
    flex: 1,
    backgroundColor: colors.background,
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
