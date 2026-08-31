import { QueryClientProvider } from '@tanstack/react-query';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { Stack } from 'expo-router';
import * as NativeSplash from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { queryClient } from '@/api/queryClient';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/authStore';
import { SplashScreen } from '@/features/auth/SplashScreen';
import { TrackingShareHost } from '@/features/tracking/TrackingShareHost';

WebBrowser.maybeCompleteAuthSession();
void NativeSplash.preventAutoHideAsync();

const SPLASH_MIN_MS = 1500;

export default function RootLayout() {
  const status = useAuthStore((state) => state.status);
  const hydrate = useAuthStore((state) => state.hydrate);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const [splashMinElapsed, setSplashMinElapsed] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const timer = setTimeout(() => setSplashMinElapsed(true), SPLASH_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void NativeSplash.hideAsync();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const isAuthenticated = status === 'AUTHENTICATED';
  const isUnauthenticated = status === 'UNAUTHENTICATED';
  const appReady = fontsLoaded && status !== 'INITIALIZING' && splashMinElapsed;

  if (!appReady) {
    return (
      <SplashScreen
        onReady={() => {
          void NativeSplash.hideAsync();
        }}
      />
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TrackingShareHost />
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
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
        </Stack.Protected>
        <Stack.Protected guard={isUnauthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </QueryClientProvider>
  );
}
