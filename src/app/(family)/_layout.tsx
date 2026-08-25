import { Redirect, Tabs, type Href } from 'expo-router';
import { useEffect } from 'react';
import { colors, shadows, typography } from '@/constants/theme';
import { Icon } from '@/components/ui';
import { useAuthStore } from '@/features/auth/authStore';
import { authenticatedHomeHref, isFamilyRole } from '@/features/auth/roleRouting';
import { useFamilyStore } from '@/features/family/familyStore';
import { useUnreadNotifications } from '@/features/notifications/hooks';

export default function FamilyTabsLayout() {
  const role = useAuthStore((state) => state.user?.role);
  const status = useAuthStore((state) => state.status);
  const resetFamily = useFamilyStore((state) => state.reset);
  const unread = useUnreadNotifications();
  const unreadTotal = unread.data?.total ?? 0;

  useEffect(() => {
    if (status !== 'AUTHENTICATED') {
      resetFamily();
    }
  }, [status, resetFamily]);

  if (role && !isFamilyRole(role)) {
    return <Redirect href={authenticatedHomeHref(role) as Href} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          ...typography.captionStrong,
          fontSize: 10,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 12,
          height: 68,
          borderRadius: 24,
          backgroundColor: colors.surfaceElevated,
          borderTopWidth: 0,
          ...shadows.float,
          paddingTop: 6,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Icon name="home-outline" color={color} size={size} />,
          tabBarAccessibilityLabel: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="visits"
        options={{
          title: 'Visits',
          tabBarIcon: ({ color, size }) => <Icon name="calendar-outline" color={color} size={size} />,
          tabBarAccessibilityLabel: 'Visits',
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: 'Health',
          tabBarIcon: ({ color, size }) => <Icon name="medkit-outline" color={color} size={size} />,
          tabBarAccessibilityLabel: 'Health',
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, size }) => <Icon name="people-outline" color={color} size={size} />,
          tabBarAccessibilityLabel: 'Community',
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => <Icon name="notifications-outline" color={color} size={size} />,
          tabBarAccessibilityLabel: unreadTotal > 0 ? `Notifications, ${unreadTotal} unread` : 'Notifications',
          tabBarBadge: unreadTotal > 0 ? (unreadTotal > 9 ? '9+' : unreadTotal) : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Icon name="person-outline" color={color} size={size} />,
          tabBarAccessibilityLabel: 'Profile',
        }}
      />
    </Tabs>
  );
}
