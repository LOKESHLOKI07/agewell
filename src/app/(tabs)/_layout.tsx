import { Redirect, Tabs, type Href } from 'expo-router';
import { colors, typography } from '@/constants/theme';
import { Icon } from '@/components/ui';
import { useAuthStore } from '@/features/auth/authStore';
import { authenticatedHomeHref, isMemberHomeRole } from '@/features/auth/roleRouting';
import { brandGreen } from '@/components/AgeWellLogo';
import { useSafeTabBarStyle } from '@/utils/safeBottom';

export default function TabsLayout() {
  const role = useAuthStore((state) => state.user?.role);
  const tabBarStyle = useSafeTabBarStyle();
  if (role && !isMemberHomeRole(role)) {
    return <Redirect href={authenticatedHomeHref(role) as Href} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: brandGreen,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          ...typography.captionStrong,
        },
        tabBarStyle,
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
