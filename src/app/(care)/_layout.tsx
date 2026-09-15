import { useEffect } from 'react';
import { View } from 'react-native';
import { Redirect, Tabs, type Href } from 'expo-router';
import { LoadingState } from '@/components';
import { Icon } from '@/components/ui';
import { colors, typography } from '@/constants/theme';
import { isCareApp } from '@/config/appVariant';
import { useAuthStore } from '@/features/auth/authStore';
import { authenticatedHomeHref, isCareManagerRole } from '@/features/auth/roleRouting';
import { parseStaffKind } from '@/features/care/staffKind';
import { useCareManagerProfile } from '@/features/care/hooks';
import { useSafeTabBarStyle } from '@/utils/safeBottom';

export default function CareTabsLayout() {
  const role = useAuthStore((state) => state.user?.role);
  const setCareStatus = useAuthStore((state) => state.setCareStatus);
  const careStatus = useAuthStore((state) => state.careStatus);
  const profile = useCareManagerProfile();
  const tabBarStyle = useSafeTabBarStyle();
  const staffKind = parseStaffKind(profile.data?.staffKind);
  const tasksTitle = staffKind === 'DELIVERY_EXECUTIVE' ? 'Deliveries' : 'Tasks';

  useEffect(() => {
    if (profile.data?.status) {
      setCareStatus(profile.data.status);
    }
  }, [profile.data?.status, setCareStatus]);

  if (!isCareApp()) {
    return <Redirect href={'/role-unavailable?role=CARE_MANAGER' as Href} />;
  }

  if (role && !isCareManagerRole(role)) {
    return <Redirect href={authenticatedHomeHref(role) as Href} />;
  }

  if (profile.isPending && !profile.data) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
        <LoadingState message="Loading care profile..." />
      </View>
    );
  }

  const status = (profile.data?.status ?? careStatus ?? 'PENDING').toUpperCase();
  if (status !== 'ACTIVE') {
    return <Redirect href={'/pending-approval' as Href} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          ...typography.captionStrong,
          fontSize: 13,
        },
        tabBarStyle: {
          ...tabBarStyle,
          backgroundColor: colors.white,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Icon name="home-outline" color={color} size={size} />,
          tabBarAccessibilityLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: tasksTitle,
          tabBarIcon: ({ color, size }) => <Icon name="clipboard-outline" color={color} size={size} />,
          tabBarAccessibilityLabel: tasksTitle,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => <Icon name="location" color={color} size={size} />,
          tabBarAccessibilityLabel: 'Map',
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => <Icon name="notifications-outline" color={color} size={size} />,
          tabBarAccessibilityLabel: 'Alerts',
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
      <Tabs.Screen
        name="visits"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
