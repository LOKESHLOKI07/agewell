import { useEffect } from 'react';
import { View } from 'react-native';
import { Redirect, Tabs, type Href } from 'expo-router';
import { LoadingState } from '@/components';
import { Icon } from '@/components/ui';
import { colors, typography } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/authStore';
import { authenticatedHomeHref, isCareManagerRole } from '@/features/auth/roleRouting';
import { useCareManagerProfile } from '@/features/care/hooks';

export default function CareTabsLayout() {
  const role = useAuthStore((state) => state.user?.role);
  const setCareStatus = useAuthStore((state) => state.setCareStatus);
  const careStatus = useAuthStore((state) => state.careStatus);
  const profile = useCareManagerProfile();

  useEffect(() => {
    if (profile.data?.status) {
      setCareStatus(profile.data.status);
    }
  }, [profile.data?.status, setCareStatus]);

  if (role && !isCareManagerRole(role)) {
    return <Redirect href={authenticatedHomeHref(role) as Href} />;
  }

  if (profile.isPending && !profile.data) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
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
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          ...typography.captionStrong,
          fontSize: 13,
        },
        tabBarStyle: {
          backgroundColor: colors.surfaceElevated,
          borderTopColor: colors.border,
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
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
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color, size }) => <Icon name="medkit-outline" color={color} size={size} />,
          tabBarAccessibilityLabel: 'Appointments',
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
