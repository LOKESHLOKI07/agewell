import { Redirect, Tabs, type Href } from 'expo-router';
import { colors, typography } from '@/constants/theme';
import { Icon } from '@/components/ui';
import { useAuthStore } from '@/features/auth/authStore';
import { authenticatedHomeHref, isSeniorRole } from '@/features/auth/roleRouting';

export default function TabsLayout() {
  const role = useAuthStore((state) => state.user?.role);
  if (role && !isSeniorRole(role)) {
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
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Icon name="home-outline" color={color} size={size} />,
          tabBarAccessibilityLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color, size }) => <Icon name="grid-outline" color={color} size={size} />,
          tabBarAccessibilityLabel: 'Services',
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
