import { QueryClientProvider } from '@tanstack/react-query';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import * as NativeSplash from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { isEmergencyWidgetUrl } from '@/features/emergency/widget/widgetLink';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { queryClient } from '@/api/queryClient';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/authStore';
import { SplashScreen } from '@/features/auth/SplashScreen';
import { TrackingShareHost } from '@/features/tracking/TrackingShareHost';
import { EmergencyAlertHost } from '@/features/emergency/EmergencyAlertHost';
import { PushRegistrationHost } from '@/features/notifications/PushRegistrationHost';
import { useBlurFocusedOnWebNavigate } from '@/utils/useBlurFocusedOnWebNavigate';

WebBrowser.maybeCompleteAuthSession();
void NativeSplash.preventAutoHideAsync();

export default function RootLayout() {
  const status = useAuthStore((state) => state.status);
  const hydrate = useAuthStore((state) => state.hydrate);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const [splashVideoDone, setSplashVideoDone] = useState(Platform.OS === 'web');
  useBlurFocusedOnWebNavigate();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    let cancelled = false;
    void Linking.getInitialURL().then((url) => {
      if (cancelled || !isEmergencyWidgetUrl(url)) {
        return;
      }
      setSplashVideoDone(true);
      void NativeSplash.hideAsync();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const isAuthenticated = status === 'AUTHENTICATED';
  const isUnauthenticated = status === 'UNAUTHENTICATED';
  const appReady = fontsLoaded && status !== 'INITIALIZING' && splashVideoDone;

  if (!appReady) {
    return (
      <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
        <SplashScreen
          onReady={() => {
            void NativeSplash.hideAsync();
          }}
          onFinished={() => setSplashVideoDone(true)}
        />
      </KeyboardProvider>
    );
  }

  return (
    <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
      <QueryClientProvider client={queryClient}>
        <TrackingShareHost />
        <PushRegistrationHost />
        <EmergencyAlertHost />
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            // On web, animated stacks keep prior screens focusable under aria-hidden.
            animation: Platform.OS === 'web' ? 'none' : undefined,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Protected guard={isAuthenticated}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(care)" />
            <Stack.Screen name="(admin)" />
            <Stack.Screen name="pending-approval" />
            <Stack.Screen name="registration-success" />
            <Stack.Screen name="role-unavailable" />
            <Stack.Screen name="parent/[id]" />
            <Stack.Screen name="health" />
            <Stack.Screen name="care" />
            <Stack.Screen name="services" />
            <Stack.Screen name="membership" />
            <Stack.Screen name="visits" />
            <Stack.Screen name="appointments" />
            <Stack.Screen name="account" />
            <Stack.Screen name="emergency" />
            <Stack.Screen name="emergency-status" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="payments" />
            <Stack.Screen name="addons/index" />
            <Stack.Screen name="addons/[id]" />
            <Stack.Screen name="schedule/index" />
            <Stack.Screen name="life/index" />
            <Stack.Screen name="life/[category]" />
            <Stack.Screen name="community/events/[id]" />
            <Stack.Screen name="community/trips/[id]" />
            <Stack.Screen name="tracking" />
            {/* deliveries/[id]/track is file-based — do not declare a bare "deliveries" screen */}
          </Stack.Protected>
          <Stack.Protected guard={isUnauthenticated}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
        </Stack>
      </QueryClientProvider>
    </KeyboardProvider>
  );
}
