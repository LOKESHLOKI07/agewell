import { useEffect } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AgeWellLogo, brandGreen } from '@/components/AgeWellLogo';
import { spacing, typography } from '@/constants/theme';
import { AuthMethodButtons } from './AuthMethodButtons';
import { createAccountHref, emailOtpHref, signInHref } from './authEntry';
import { useGoogleSignIn } from './useGoogleSignIn';

export function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { continueWithGoogle, ready, busy, error } = useGoogleSignIn();

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
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + spacing.xxxl, paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      <View style={styles.hero}>
        <AgeWellLogo />
        <Text style={styles.title}>Welcome to AgeWell</Text>
        <Text style={styles.subtitle}>Trusted support for you and your loved ones.</Text>
      </View>

      <View style={styles.methods}>
        <AuthMethodButtons
          onGoogle={onGoogle}
          onMobile={() => router.push(createAccountHref('mobile'))}
          onEmail={() => router.push(emailOtpHref('signup'))}
          googleDisabled={busy}
        />
        <Pressable
          onPress={() => router.push(signInHref())}
          accessibilityRole="button"
          accessibilityLabel="Already have an account? Sign in"
          style={({ pressed }) => [styles.signIn, pressed ? styles.pressed : null]}
        >
          <Text style={styles.signInText}>Already have an account? Sign in</Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.legal}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
  },
  hero: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginTop: 56,
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
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
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
