import { useEffect } from 'react';
import { Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AgeWellLogo, brandGreen } from '@/components/AgeWellLogo';
import { KeyboardAwareScrollView } from '@/components/KeyboardAwareScrollView';
import { spacing, typography } from '@/constants/theme';
import { isCareApp } from '@/config/appVariant';
import { AuthMethodButtons } from './AuthMethodButtons';
import { createAccountHref, emailOtpHref, signInHref } from './authEntry';
import { useGoogleSignIn } from './useGoogleSignIn';

export function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const compact = height < 720 || width < 380;
  const { continueWithGoogle, ready, busy, error } = useGoogleSignIn();

  useEffect(() => {
    if (isCareApp()) {
      router.replace('/(auth)/login' as Href);
    }
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Google sign-in', error);
    }
  }, [error]);

  const onGoogle = () => {
    if (!ready) {
      Alert.alert(
        'Google sign-in',
        'Google sign-in is only in the Android APK (not Expo Go). Wait for the EAS build, then install that APK.',
      );
      return;
    }
    void continueWithGoogle();
  };

  return (
    <KeyboardAwareScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + (compact ? spacing.lg : spacing.xxxl),
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.hero, compact ? styles.heroCompact : null]}>
        <AgeWellLogo compact={compact} />
        <Text
          style={[styles.title, compact ? styles.titleCompact : null]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          maxFontSizeMultiplier={1.2}
        >
          {isCareApp() ? 'Welcome to AgeWell Care' : 'Welcome to AgeWell'}
        </Text>
        <Text style={styles.subtitle} maxFontSizeMultiplier={1.2}>
          {isCareApp()
            ? 'For care managers, companions, and delivery executives.'
            : 'Trusted support for you and your loved ones.'}
        </Text>
      </View>

      <View style={[styles.methods, compact ? styles.methodsCompact : null]}>
        <AuthMethodButtons
          onGoogle={isCareApp() ? undefined : onGoogle}
          onMobile={() => router.push(isCareApp() ? ('/(auth)/select-role' as const) : createAccountHref('mobile'))}
          onEmail={() => router.push(isCareApp() ? ('/(auth)/select-role' as const) : emailOtpHref('signup'))}
          googleDisabled={busy}
        />
        <Pressable
          onPress={() => router.push(signInHref())}
          accessibilityRole="button"
          accessibilityLabel="Already have an account? Sign in"
          style={({ pressed }) => [styles.signIn, pressed ? styles.pressed : null]}
        >
          <Text style={styles.signInText} maxFontSizeMultiplier={1.2}>
            Already have an account? Sign in
          </Text>
        </Pressable>
      </View>

      <View style={styles.footerSpacer} />

      <View style={styles.footer}>
        <Text style={styles.legal} maxFontSizeMultiplier={1.2}>
          By continuing, you agree to our{'\n'}
          <Text
            style={styles.legalLink}
            onPress={() =>
              Alert.alert('Terms & Conditions', 'AgeWell terms will be published here.')
            }
            accessibilityRole="link"
          >
            Terms & Conditions
          </Text>
          {' and '}
          <Text
            style={styles.legalLink}
            onPress={() =>
              Alert.alert('Privacy Policy', 'AgeWell privacy details will be published here.')
            }
            accessibilityRole="link"
          >
            Privacy Policy
          </Text>
        </Text>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 28,
  },
  hero: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  heroCompact: {
    paddingTop: spacing.sm,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginTop: 56,
    width: '100%',
  },
  titleCompact: {
    fontSize: 22,
    lineHeight: 28,
    marginTop: 20,
  },
  subtitle: {
    ...typography.body,
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  methods: {
    marginTop: 48,
    gap: 14,
  },
  methodsCompact: {
    marginTop: 28,
  },
  signIn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  pressed: {
    opacity: 0.92,
  },
  signInText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: brandGreen,
    textAlign: 'center',
  },
  footerSpacer: {
    flexGrow: 1,
    minHeight: 24,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  legal: {
    ...typography.caption,
    color: '#8A8A8A',
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: brandGreen,
    textDecorationLine: 'underline',
    fontFamily: 'Poppins_500Medium',
    fontWeight: '500',
  },
});
