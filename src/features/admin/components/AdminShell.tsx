import { router, usePathname, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, minTouchSize, spacing, typography } from '@/constants/theme';
import { Icon, type IconName } from '@/components/ui';
import { AUTH_ROLE_LABELS } from '@/features/auth/authTypes';
import { useAuthStore } from '@/features/auth/authStore';
import {
  ADMIN_NAV,
  adminMobileTabs,
  isAdminPathActive,
} from '../selectors';
import { useAdminLayout } from '../useAdminLayout';

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const { isDesktop } = useAdminLayout();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const role = useAuthStore((state) => state.user?.role);

  if (isDesktop) {
    return (
      <View style={[styles.desktop, { paddingTop: insets.top }]}>
        <View style={styles.sidebar} accessibilityRole="menu" accessibilityLabel="Admin navigation">
          <Text style={styles.brand}>AgeWell</Text>
          <Text style={styles.role}>{role ? AUTH_ROLE_LABELS[role] : 'Staff'}</Text>
          <ScrollView contentContainerStyle={styles.sidebarList}>
            {ADMIN_NAV.map((item) => (
              <NavButton
                key={item.key}
                label={item.label}
                icon={item.icon}
                active={isAdminPathActive(pathname, item.href)}
                onPress={() => router.push(item.href as Href)}
              />
            ))}
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
      <Icon name={icon} size={20} color={active ? colors.white : colors.sidebarMuted} />
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
    width: 260,
    backgroundColor: colors.sidebar,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  brand: {
    ...typography.heading,
    color: colors.sidebarText,
    paddingHorizontal: spacing.sm,
  },
  role: {
    ...typography.caption,
    color: colors.sidebarMuted,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  sidebarList: {
    paddingBottom: spacing.huge,
    gap: spacing.xs,
  },
  navItem: {
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: colors.sidebarActive,
  },
  navLabel: {
    ...typography.body,
    color: colors.sidebarMuted,
  },
  navLabelActive: {
    ...typography.bodyStrong,
    color: colors.white,
  },
  desktopMain: {
    flex: 1,
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
