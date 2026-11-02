import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useNavigation, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getApiErrorMessage } from '@/api/errors';
import { AgeWellLogo, brandGreen } from '@/components/AgeWellLogo';
import { KeyboardAwareScrollView, TextField } from '@/components';
import { Icon } from '@/components/ui';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { useAuthStore } from './authStore';
import {
  completeFamilyInvite,
  requestFamilyInviteOtp,
  verifyFamilyInviteOtp,
} from '@/features/family/api/familyInviteApi';

type Step = 'contact' | 'otp' | 'password';
type Channel = 'email' | 'phone';

export function FamilyInviteClaimScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const completeLogin = useAuthStore((state) => state.completeRegistration);

  const [step, setStep] = useState<Step>('contact');
  const [channel, setChannel] = useState<Channel>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [claimToken, setClaimToken] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState<string | null>(null);
  const [invitePhone, setInvitePhone] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goBack = () => {
    if (step === 'password') {
      setStep('otp');
      setError(null);
      return;
    }
    if (step === 'otp') {
      setStep('contact');
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
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const result = await requestFamilyInviteOtp(
        channel === 'email' ? { email: email.trim() } : { phone: phone.trim() },
      );
      setDebugCode(result.debugCode);
      setStep('otp');
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const result = await verifyFamilyInviteOtp({
        email: channel === 'email' ? email.trim() : undefined,
        phone: channel === 'phone' ? phone.trim() : undefined,
        code: code.trim(),
      });
      setClaimToken(result.claimToken);
      setFirstName(result.firstName);
      setLastName(result.lastName);
      setInviteEmail(result.email);
      setInvitePhone(result.phone);
      setStep('password');
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const onComplete = async () => {
    if (busy || !claimToken) return;
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    const needPhone = !invitePhone;
    const needEmail = !inviteEmail;
    if (needPhone && phone.trim().length < 8) {
      setError('Add your mobile number to finish.');
      return;
    }
    if (needEmail && !email.trim().includes('@')) {
      setError('Add your email to finish.');
      return;
    }
    setBusy(true);
    try {
      const result = await completeFamilyInvite({
        claimToken,
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        email: inviteEmail || email.trim() || undefined,
        phone: invitePhone || phone.trim() || undefined,
      });
      completeLogin(result.user);
      router.replace('/(tabs)' as Href);
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      >
        <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
          <Icon name="arrow-back" size={22} color="#1A1A1A" />
        </Pressable>

        <View style={styles.hero}>
          <AgeWellLogo compact />
          <Text style={styles.title}>
            {step === 'contact'
              ? 'Family invite'
              : step === 'otp'
                ? 'Enter verification code'
                : 'Set your password'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'contact'
              ? 'Use the email or mobile your senior invited. Email uses inbox OTP; mobile uses WhatsApp when configured.'
              : step === 'otp'
                ? `Enter the 6-digit code${debugCode ? ` (demo: ${debugCode})` : channel === 'phone' ? ' from WhatsApp.' : '.'}`
                : 'Choose a password you’ll use to sign in. You can change it later from Profile.'}
          </Text>
        </View>

        {step === 'contact' ? (
          <>
            <View style={styles.channelRow}>
              <Pressable
                style={[styles.channelChip, channel === 'email' ? styles.channelActive : null]}
                onPress={() => setChannel('email')}
                accessibilityRole="button"
              >
                <Text style={[styles.channelLabel, channel === 'email' ? styles.channelLabelActive : null]}>
                  Email
                </Text>
              </Pressable>
              <Pressable
                style={[styles.channelChip, channel === 'phone' ? styles.channelActive : null]}
                onPress={() => setChannel('phone')}
                accessibilityRole="button"
              >
                <Text style={[styles.channelLabel, channel === 'phone' ? styles.channelLabelActive : null]}>
                  Mobile
                </Text>
              </Pressable>
            </View>
            {channel === 'email' ? (
              <TextField
                label="Email on invite"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            ) : (
              <TextField
                label="Mobile on invite"
                placeholder="10-digit mobile"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            )}
          </>
        ) : null}

        {step === 'otp' ? (
          <TextField
            label="Verification code"
            placeholder="6-digit code"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
          />
        ) : null}

        {step === 'password' ? (
          <>
            <TextField label="First name" value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
            <TextField label="Last name" value={lastName} onChangeText={setLastName} autoCapitalize="words" />
            {!inviteEmail ? (
              <TextField
                label="Email"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            ) : null}
            {!invitePhone ? (
              <TextField
                label="Mobile"
                placeholder="10-digit mobile"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            ) : null}
            <TextField
              label="Password"
              placeholder="At least 8 characters"
              secureTextEntry
              showSecureToggle
              value={password}
              onChangeText={setPassword}
            />
            <TextField
              label="Confirm password"
              placeholder="Re-enter password"
              secureTextEntry
              showSecureToggle
              value={confirm}
              onChangeText={setConfirm}
            />
          </>
        ) : null}

        {error ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        <Pressable
          style={[styles.submit, busy ? styles.submitDisabled : null]}
          onPress={() => {
            if (step === 'contact') void onSend();
            else if (step === 'otp') void onVerify();
            else void onComplete();
          }}
          disabled={busy}
          accessibilityRole="button"
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitLabel}>
              {step === 'contact' ? 'Send code' : step === 'otp' ? 'Verify code' : 'Join EldCare'}
            </Text>
          )}
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.lg,
  },
  back: {
    width: minTouchSize,
    height: minTouchSize,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  hero: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    color: '#1A1A1A',
  },
  subtitle: {
    ...typography.body,
    color: '#6B6B6B',
  },
  channelRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  channelChip: {
    flex: 1,
    minHeight: minTouchSize,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDEDED',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F7F5',
  },
  channelActive: {
    borderColor: brandGreen,
    backgroundColor: '#F3FAF4',
  },
  channelLabel: {
    ...typography.body,
    color: '#6B6B6B',
    fontWeight: '600',
  },
  channelLabelActive: {
    color: brandGreen,
  },
  error: {
    ...typography.body,
    color: '#E5484D',
    marginTop: spacing.sm,
  },
  submit: {
    marginTop: spacing.lg,
    minHeight: minTouchSize,
    borderRadius: 12,
    backgroundColor: brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { opacity: 0.65 },
  submitLabel: {
    ...typography.bodyStrong,
    color: '#FFFFFF',
  },
});
