import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams, useNavigation, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { brandGreen } from '@/components/AgeWellLogo';
import { TextField } from '@/components';
import { Icon } from '@/components/ui';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import {
  openDeviceLocationSettings,
  requestOnboardingLocation,
  setOnboardingAuthMethod,
  setOnboardingGps,
  setOnboardingManualLocation,
  type OnboardingAuthMethod,
} from './onboardingLocation';
import { resolveServiceAreaFromGps, resolveServiceAreaFromQuery, serviceAreaHref } from './serviceArea';

const METHODS = new Set<OnboardingAuthMethod>(['google', 'mobile', 'email']);

export function LocationPermissionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ method?: string | string[] }>();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'ask' | 'manual'>('ask');
  const [place, setPlace] = useState('');
  const [placeError, setPlaceError] = useState<string | undefined>();

  const method = normalizeMethod(params.method);

  useEffect(() => {
    if (method) {
      setOnboardingAuthMethod(method);
    }
  }, [method]);

  const goBack = () => {
    if (mode === 'manual') {
      setMode('ask');
      setPlaceError(undefined);
      return;
    }
    if (navigation.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(auth)/service-for' as Href);
  };

  const goToServiceArea = (available: boolean) => {
    router.push(serviceAreaHref(available));
  };

  const onAllow = async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      const result = await requestOnboardingLocation();
      if (result.ok) {
        const hasCoords = result.latitude !== 0 || result.longitude !== 0;
        if (hasCoords) {
          setOnboardingGps(result.latitude, result.longitude);
          const available = await resolveServiceAreaFromGps(result.latitude, result.longitude);
          goToServiceArea(available);
          return;
        }
        goToServiceArea(false);
        return;
      }
      if (result.reason === 'blocked' || result.reason === 'unavailable') {
        Alert.alert(
          'Location is off',
          'Turn on location for AgeWell in Settings so we can check whether services are available in your area.',
          [
            { text: 'Not now', style: 'cancel' },
            { text: 'Open Settings', onPress: openDeviceLocationSettings },
          ],
        );
        return;
      }
    } finally {
      setBusy(false);
    }
  };

  const onCheckManual = async () => {
    const query = place.trim();
    if (!query) {
      setPlaceError('Enter your area or city');
      return;
    }
    if (busy) {
      return;
    }
    setBusy(true);
    setPlaceError(undefined);
    try {
      setOnboardingManualLocation();
      const available = await resolveServiceAreaFromQuery(query);
      goToServiceArea(available);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Pressable
        onPress={goBack}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={styles.back}
      >
        <Icon name="arrow-back" size={22} color="#1A1A1A" />
      </Pressable>

      <View style={styles.body}>
        <LocationHero />
        {mode === 'manual' ? (
          <>
            <Text style={styles.title}>Enter your location</Text>
            <Text style={styles.subtitle}>Tell us your area so we can check AgeWell service availability.</Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>AgeWell needs your location</Text>
            <Text style={styles.subtitle}>
              We use your location to check whether AgeWell services are currently available in your area.
            </Text>
          </>
        )}
      </View>

      <View style={styles.actions}>
        {mode === 'manual' ? (
          <>
            <TextField
              label="Area or city"
              placeholder="Kandivali, Mumbai"
              value={place}
              onChangeText={(value) => {
                setPlace(value);
                if (placeError) {
                  setPlaceError(undefined);
                }
              }}
              autoCapitalize="words"
              error={placeError}
            />
            <Pressable
              onPress={() => void onCheckManual()}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Check availability"
              accessibilityState={{ busy, disabled: busy }}
              style={({ pressed }) => [
                styles.allow,
                pressed && !busy ? styles.pressed : null,
                busy ? styles.disabled : null,
              ]}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.allowLabel}>Check availability</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              onPress={() => void onAllow()}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Allow Location Access"
              accessibilityState={{ busy, disabled: busy }}
              style={({ pressed }) => [
                styles.allow,
                pressed && !busy ? styles.pressed : null,
                busy ? styles.disabled : null,
              ]}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.allowLabel}>Allow Location Access</Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => setMode('manual')}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Enter location manually"
              style={styles.manualWrap}
            >
              <Text style={styles.manual}>Enter location manually</Text>
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function normalizeMethod(value: string | string[] | undefined): OnboardingAuthMethod | null {
  const method = Array.isArray(value) ? value[0] : value;
  return method && METHODS.has(method as OnboardingAuthMethod)
    ? (method as OnboardingAuthMethod)
    : null;
}

function LocationHero() {
  return (
    <View style={styles.hero} accessibilityRole="image" accessibilityLabel="Location pin">
      <Svg width={280} height={210} viewBox="0 0 280 210">
        <Ellipse cx="140" cy="188" rx="78" ry="10" fill="#E4F0E2" />
        <Rect x="36" y="128" width="28" height="54" rx="3" fill="#C8DCC4" />
        <Rect x="68" y="108" width="36" height="74" rx="3" fill="#D7E8D3" />
        <Rect x="108" y="118" width="24" height="64" rx="3" fill="#C5D9C1" />
        <Rect x="176" y="112" width="32" height="70" rx="3" fill="#D4E6D0" />
        <Rect x="212" y="124" width="26" height="58" rx="3" fill="#C8DCC4" />
        <Path d="M52 128c8-14 22-14 30 0v8H52v-8Z" fill="#B7D0B2" />
        <Path d="M226 124c8-16 24-16 32 0v10h-32v-10Z" fill="#B7D0B2" />
        <Circle cx="80" cy="122" r="3" fill="#EEF6EC" />
        <Circle cx="92" cy="122" r="3" fill="#EEF6EC" />
        <Circle cx="188" cy="126" r="3" fill="#EEF6EC" />
        <Circle cx="200" cy="126" r="3" fill="#EEF6EC" />
        <Path
          d="M140 18c-32 0-58 26-58 58 0 42 58 98 58 98s58-56 58-98c0-32-26-58-58-58Z"
          fill={brandGreen}
        />
        <Path
          d="M140 18c-18 0-40 14-48 38 12-8 28-10 48-10 20 0 36 2 48 10-8-24-30-38-48-38Z"
          fill="#5FAE55"
        />
        <Circle cx="140" cy="76" r="22" fill="#FFFFFF" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
  },
  back: {
    width: minTouchSize,
    height: minTouchSize,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  actions: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  allow: {
    minHeight: 56,
    backgroundColor: brandGreen,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.7,
  },
  allowLabel: {
    ...typography.bodyStrong,
    color: '#FFFFFF',
  },
  manualWrap: {
    minHeight: minTouchSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manual: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});
