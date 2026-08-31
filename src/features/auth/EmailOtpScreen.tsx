import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams, useNavigation, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getApiErrorMessage } from '@/api/errors';
import { AgeWellLogo, brandGreen } from '@/components/AgeWellLogo';
import { TextField } from '@/components';
import { Icon } from '@/components/ui';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { createPasswordHref, forgotPasswordHref } from './authEntry';
import { requestEmailOtp, verifyEmailOtp } from './emailOtpApi';
import { useAuthStore } from './authStore';
import { setIdentityToken, setVerifiedEmail } from './onboardingProfile';
import { useAuth } from './useAuth';

type SignInMethod = 'password' | 'code';

export function EmailOtpScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { signIn } = useAuth();
  const completeLogin = useAuthStore((state) => state.completeLogin);
  const params = useLocalSearchParams<{ intent?: string | string[] }>();
  const intent = Array.isArray(params.intent) ? params.intent[0] : params.intent;
  const isSignIn = intent === 'signin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [method, setMethod] = useState<SignInMethod>(isSignIn ? 'password' : 'code');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goBack = () => {
    if (sent) {
      setSent(false);
      setCode('');
      setError(null);
      return;
    }
    if (navigation.canGoBack()) {
      router.back();
      return;
    }
    router.replace(isSignIn ? ('/(auth)/login' as Href) : ('/(auth)/welcome' as Href));
  };

  const switchMethod = (next: SignInMethod) => {
    setMethod(next);
    setSent(false);
    setCode('');
    setError(null);
  };

  const onPasswordSignIn = async () => {
    if (busy) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : getApiErrorMessage(caught, 'login'));
      setBusy(false);
    }
  };

  const onSend = async () => {
    if (busy) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await requestEmailOtp(email.trim());
      setSent(true);
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async () => {
    if (busy) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const result = await verifyEmailOtp(email.trim(), code.trim());
      setVerifiedEmail(result.email);
      if (result.otpSessionToken) {
        setIdentityToken(result.otpSessionToken);
      }
      if (!result.isNew && result.accessToken && result.refreshToken) {
        await completeLogin(result.accessToken, result.refreshToken);
        return;
      }
      if (isSignIn) {
        setError('No AgeWell account uses this email yet. Create an account from Welcome.');
        setBusy(false);
        return;
      }
      router.replace(createPasswordHref());
    } catch (caught) {
      setError(getApiErrorMessage(caught));
      setBusy(false);
    }
  };

  const title = sent
    ? 'Enter verification code'
    : isSignIn
      ? 'Sign in with email'
      : 'Continue with email';

  const subtitle = sent
    ? `We sent a 6-digit code to ${email.trim()}. Check your inbox (and spam).`
    : isSignIn
      ? method === 'password'
        ? 'Use the password you created, or email a one-time code instead.'
        : 'We’ll email a one-time code. This is not your password.'
      : 'We’ll email a one-time code to verify this address. This is not your password.';

  const primaryLabel = sent ? 'Verify code' : method === 'password' && isSignIn ? 'Sign in' : 'Send code';
  const onPrimary = sent ? onVerify : method === 'password' && isSignIn ? onPasswordSignIn : onSend;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + spacing.md }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      >
        <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
          <Icon name="arrow-back" size={22} color="#1A1A1A" />
        </Pressable>

        <View style={styles.hero}>
          <AgeWellLogo compact />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {sent ? (
          <TextField
            label="Verification code"
            placeholder="6-digit code"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
          />
        ) : (
          <>
            <TextField
              label="Email"
              placeholder="you@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
            />
            {isSignIn && method === 'password' ? (
              <TextField
                label="Password"
                placeholder="Enter your password"
                secureTextEntry
                showSecureToggle
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                value={password}
                onChangeText={setPassword}
              />
            ) : null}
          </>
        )}

        {error ? (
          <Text style={styles.formError} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        {isSignIn && !sent && method === 'password' ? (
          <Pressable
            onPress={() => router.push(forgotPasswordHref(email))}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Forgot password?"
            style={styles.forgotWrap}
          >
            <Text style={styles.link}>Forgot password?</Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => void onPrimary()}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={primaryLabel}
          style={({ pressed }) => [
            styles.submit,
            pressed && !busy ? styles.submitPressed : null,
            busy ? styles.submitDisabled : null,
          ]}
        >
          {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitLabel}>{primaryLabel}</Text>}
        </Pressable>

        {isSignIn && !sent ? (
          <Pressable
            onPress={() => switchMethod(method === 'password' ? 'code' : 'password')}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={method === 'password' ? 'Email me a code instead' : 'Use password instead'}
            style={styles.linkWrap}
          >
            <Text style={styles.link}>
              {method === 'password' ? 'Email me a code instead' : 'Use password instead'}
            </Text>
          </Pressable>
        ) : null}

        {sent ? (
          <Pressable
            onPress={() => void onSend()}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Resend code"
            style={styles.linkWrap}
          >
            <Text style={styles.link}>Resend code</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginTop: spacing.xxxl,
  },
  subtitle: {
    ...typography.body,
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  formError: {
    ...typography.body,
    color: '#E5484D',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  forgotWrap: {
    minHeight: minTouchSize,
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginTop: -spacing.md,
    marginBottom: spacing.md,
  },
  submit: {
    minHeight: 56,
    backgroundColor: brandGreen,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  submitPressed: {
    opacity: 0.9,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitLabel: {
    ...typography.bodyStrong,
    color: '#FFFFFF',
  },
  linkWrap: {
    minHeight: minTouchSize,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  link: {
    ...typography.captionStrong,
    color: brandGreen,
  },
});
