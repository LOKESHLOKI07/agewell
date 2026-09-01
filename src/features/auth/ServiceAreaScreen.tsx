import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { getApiErrorMessage, isEmailAlreadyRegistered, isPhoneAlreadyRegistered } from '@/api/errors';
import { brandGreen } from '@/components/AgeWellLogo';
import { Icon } from '@/components/ui';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { signInHref } from './authEntry';
import { useAuthStore } from './authStore';
import { getOnboardingProfile, getOnboardingServiceFor, hasOnboardingProfile, onboardingAccountFields } from './onboardingProfile';
import { setMembershipKind } from './membershipPlanPreference';
import { registerSenior } from './registrationApi';
import { authenticatedHomeHref } from './roleRouting';
import { SERVICE_AREA_CITIES } from './serviceArea';
import { setServiceAreaAvailable } from './serviceAreaPreference';

const ORANGE = '#F57C23';

export function ServiceAreaScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const completeRegistration = useAuthStore((state) => state.completeRegistration);
  const params = useLocalSearchParams<{ available?: string | string[] }>();
  const available = normalizeFlag(params.available);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [phoneTaken, setPhoneTaken] = useState(false);

  const goBack = () => {
    if (navigation.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(auth)/location' as Href);
  };

  const finishOnboarding = async () => {
    if (busy) {
      return;
    }
    if (!hasOnboardingProfile()) {
      router.replace('/(auth)/personal-details' as Href);
      return;
    }

    setBusy(true);
    setFormError(null);
    setEmailTaken(false);
    setPhoneTaken(false);

    try {
      await setServiceAreaAvailable(available);
      const profile = getOnboardingProfile();
      const account = onboardingAccountFields(profile);
      const membershipKind = getOnboardingServiceFor() ?? undefined;
      if (membershipKind) {
        await setMembershipKind(membershipKind);
      }
      const result = await registerSenior({
        ...account,
        emergencyContact: account.phone,
        membershipKind,
      });
      // Go straight to home — skip registration-success so auth-guard remount doesn't flash another screen.
      completeRegistration(result.user);
      router.replace(authenticatedHomeHref(result.user.role) as Href);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
      setEmailTaken(isEmailAlreadyRegistered(error));
      setPhoneTaken(isPhoneAlreadyRegistered(error));
      setBusy(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}>
      <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
        <Icon name="arrow-back" size={22} color="#1A1A1A" />
      </Pressable>

      <View style={styles.body}>
        {available ? <AvailableHero /> : <ComingSoonHero />}
        {available ? (
          <>
            <Text style={styles.title}>AgeWell is available in your area! 🥳</Text>
            <Text style={styles.subtitle}>We currently provide services in {SERVICE_AREA_CITIES}.</Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>
              AgeWell is coming to your area <Text style={styles.heart}>♡</Text>
            </Text>
            <Text style={styles.subtitle}>We are currently serving in Kandivali & Borivali region of Mumbai.</Text>
            <Text style={[styles.subtitle, styles.subtitleFollow]}>
              You can explore AgeWell now. Booking opens when we launch in your area.
            </Text>
          </>
        )}
      </View>

      {formError ? (
        <View style={styles.errorWrap}>
          <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
            {formError}
          </Text>
          {emailTaken ? (
            <Pressable
              onPress={() => router.replace(signInHref())}
              accessibilityRole="button"
              accessibilityLabel="Sign in instead"
              style={styles.errorAction}
            >
              <Text style={styles.errorActionLabel}>Sign in instead</Text>
            </Pressable>
          ) : null}
          {phoneTaken ? (
            <Pressable
              onPress={() => router.replace('/(auth)/personal-details' as Href)}
              accessibilityRole="button"
              accessibilityLabel="Change mobile number"
              style={styles.errorAction}
            >
              <Text style={styles.errorActionLabel}>Change mobile number</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <Pressable
        onPress={() => void finishOnboarding()}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={available ? 'Continue to AgeWell' : 'Explore AgeWell'}
        style={({ pressed }) => [
          styles.button,
          available ? styles.availableButton : styles.notifyButton,
          pressed || busy ? styles.pressed : null,
        ]}
      >
        {busy ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonLabel}>{available ? 'Continue to AgeWell' : 'Explore AgeWell'}</Text>
        )}
      </Pressable>

      {!available ? (
        <Pressable
          onPress={() =>
            Alert.alert(
              "We'll notify you",
              'We will let you know when AgeWell launches in your area.',
            )
          }
          accessibilityRole="button"
          accessibilityLabel="Notify Me When We Launch Here"
          style={styles.secondaryAction}
        >
          <Text style={styles.secondaryLabel}>Notify Me When We Launch Here</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function normalizeFlag(value: string | string[] | undefined): boolean {
  const flag = Array.isArray(value) ? value[0] : value;
  return flag === '1' || flag === 'true';
}

function Skyline() {
  return (
    <>
      <Ellipse cx="140" cy="196" rx="92" ry="11" fill="#E4F0E2" />
      <Rect x="28" y="132" width="30" height="56" rx="4" fill="#D2E2CE" />
      <Rect x="62" y="112" width="38" height="76" rx="4" fill="#DEEBDA" />
      <Rect x="104" y="124" width="26" height="64" rx="4" fill="#C9DCC4" />
      <Rect x="168" y="118" width="34" height="70" rx="4" fill="#D8E8D4" />
      <Rect x="206" y="130" width="28" height="58" rx="4" fill="#C9DCC4" />
      <Path d="M44 132c10-16 26-16 36 0v8H44v-8Z" fill="#B4CFAE" />
      <Path d="M214 130c10-18 28-18 36 0v10h-36v-10Z" fill="#B4CFAE" />
      <Circle cx="74" cy="128" r="3" fill="#EEF6EC" />
      <Circle cx="86" cy="128" r="3" fill="#EEF6EC" />
      <Circle cx="180" cy="132" r="3" fill="#EEF6EC" />
      <Circle cx="192" cy="132" r="3" fill="#EEF6EC" />
    </>
  );
}

function AvailableHero() {
  return (
    <View style={styles.hero} accessibilityRole="image" accessibilityLabel="Available in your area">
      <Svg width={280} height={220} viewBox="0 0 280 220">
        <Skyline />
        <Rect x="86" y="22" width="8" height="4" rx="1" fill={ORANGE} transform="rotate(-22 90 24)" />
        <Rect x="188" y="30" width="7" height="4" rx="1" fill={brandGreen} transform="rotate(28 192 32)" />
        <Rect x="74" y="54" width="6" height="3" rx="1" fill={brandGreen} transform="rotate(16 77 56)" />
        <Rect x="200" y="58" width="8" height="4" rx="1" fill={ORANGE} transform="rotate(-18 204 60)" />
        <Circle cx="140" cy="88" r="46" fill={brandGreen} />
        <Path
          d="M120 88l14 14 26-28"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

function ComingSoonHero() {
  return (
    <View style={styles.hero} accessibilityRole="image" accessibilityLabel="Coming to your area">
      <Svg width={280} height={220} viewBox="0 0 280 220">
        <Skyline />
        <Path
          d="M140 22c-32 0-58 26-58 58 0 42 58 98 58 98s58-56 58-98c0-32-26-58-58-58Z"
          fill={ORANGE}
        />
        <Path
          d="M140 22c-18 0-40 14-48 38 12-8 28-10 48-10 20 0 36 2 48 10-8-24-30-38-48-38Z"
          fill="#FF9A4A"
        />
        <Circle cx="140" cy="80" r="22" fill="#FFFFFF" />
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
    marginBottom: spacing.xxl,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  heart: {
    color: ORANGE,
  },
  subtitle: {
    ...typography.body,
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  subtitleFollow: {
    marginTop: spacing.sm,
  },
  errorWrap: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  error: {
    ...typography.body,
    color: '#B42318',
    textAlign: 'center',
  },
  errorAction: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
  },
  errorActionLabel: {
    ...typography.bodyStrong,
    color: brandGreen,
  },
  button: {
    minHeight: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  availableButton: {
    backgroundColor: brandGreen,
  },
  notifyButton: {
    backgroundColor: ORANGE,
  },
  secondaryAction: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  secondaryLabel: {
    ...typography.bodyStrong,
    color: ORANGE,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
  buttonLabel: {
    ...typography.bodyStrong,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
