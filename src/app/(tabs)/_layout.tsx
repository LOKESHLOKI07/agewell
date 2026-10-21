import { Redirect, Tabs, type Href } from 'expo-router';
import { colors, typography } from '@/constants/theme';
import { isCareApp } from '@/config/appVariant';
import { Icon } from '@/components/ui';
import { useAuthStore } from '@/features/auth/authStore';
import { getServiceAreaAvailable } from '@/features/auth/serviceAreaPreference';
import { useServicesLive } from '@/features/auth/useServicesLive';
import { authenticatedHomeHref, isMemberHomeRole } from '@/features/auth/roleRouting';
import { brandGreen } from '@/components/AgeWellLogo';
import { useSeniorProfile } from '@/features/home/hooks/queries';
import { SosTabButton } from '@/features/membership/components/SosTabButton';
import { useSafeTabBarStyle } from '@/utils/safeBottom';

export default function TabsLayout() {
  const role = useAuthStore((state) => state.user?.role);
  const tabBarStyle = useSafeTabBarStyle();
  const senior = useSeniorProfile();
  const servicesLive = useServicesLive();
  if (isCareApp()) {
    return <Redirect href={authenticatedHomeHref(role ?? 'SENIOR') as Href} />;
  }
  if (role && !isMemberHomeRole(role)) {
    return <Redirect href={authenticatedHomeHref(role) as Href} />;
  }
  if (isMemberHomeRole(role)) {
    const localKnown = getServiceAreaAvailable();
    if (!(senior.isPending && localKnown === null) && !servicesLive) {
      return <Redirect href={'/account/service-unavailable' as Href} />;
    }
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
        tabBarStyle: {
          ...tabBarStyle,
          height: tabBarStyle.height + 8,
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
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color, size }) => <Icon name="grid-outline" color={color} size={size} />,
          tabBarAccessibilityLabel: 'Services',
        }}
      />
      <Tabs.Screen
        name="sos"
        options={{
          title: 'SOS',
          tabBarLabel: () => null,
          tabBarButton: (props) => (
            <SosTabButton
              accessibilityState={props.accessibilityState}
              onPress={props.onPress}
              onLongPress={props.onLongPress}
            />
          ),
          tabBarAccessibilityLabel: 'SOS',
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => <Icon name="cart-outline" color={color} size={size} />,
          tabBarAccessibilityLabel: 'Orders',
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
      <Tabs.Screen name="health" options={{ href: null }} />
      <Tabs.Screen name="community" options={{ href: null }} />
    </Tabs>
  );
}
