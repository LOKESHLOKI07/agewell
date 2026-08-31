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
import { resetPasswordHref } from './authEntry';
import { requestPasswordResetOtp, verifyPasswordResetOtp } from './passwordResetApi';
import { setPasswordResetSession } from './passwordResetSession';

export function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const paramEmail = Array.isArray(params.email) ? params.email[0] : params.email;

  const [email, setEmail] = useState(paramEmail?.trim() ?? '');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
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
    router.replace('/(auth)/login' as Href);
  };

  const onSend = async () => {
    if (busy) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await requestPasswordResetOtp(email.trim());
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
      const result = await verifyPasswordResetOtp(email.trim(), code.trim());
      setPasswordResetSession(result.email, result.resetToken);
      router.push(resetPasswordHref());
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

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
          <Text style={styles.title}>{sent ? 'Enter verification code' : 'Forgot password'}</Text>
          <Text style={styles.subtitle}>
            {sent
              ? `We sent a 6-digit code to ${email.trim()}. Check your inbox (and spam).`
              : 'Enter the email on your AgeWell account. We’ll send a code so you can set a new password.'}
          </Text>
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
        )}

        {error ? (
          <Text style={styles.formError} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={() => void (sent ? onVerify() : onSend())}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={sent ? 'Verify code' : 'Send code'}
          style={({ pressed }) => [
            styles.submit,
            pressed && !busy ? styles.submitPressed : null,
            busy ? styles.submitDisabled : null,
          ]}
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitLabel}>{sent ? 'Verify code' : 'Send code'}</Text>
          )}
        </Pressable>

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
