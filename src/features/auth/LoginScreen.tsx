import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useNavigation, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AgeWellLogo, brandGreen } from '@/components/AgeWellLogo';
import { TextField } from '@/components';
import { Icon } from '@/components/ui';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { AuthMethodButtons } from './AuthMethodButtons';
import { emailOtpHref, forgotPasswordHref } from './authEntry';
import { useAuth } from './useAuth';
import { useGoogleSignIn } from './useGoogleSignIn';
import {
  loginSchema,
  mobileLoginSchema,
  type LoginFormValues,
  type MobileLoginFormValues,
} from './schemas';

type LoginStep = 'methods' | 'email' | 'mobile';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { signIn } = useAuth();
  const { continueWithGoogle, ready, busy, error } = useGoogleSignIn();
  const [step, setStep] = useState<LoginStep>('methods');

  useEffect(() => {
    if (error) {
      Alert.alert('Google sign-in', error);
    }
  }, [error]);

  const goBack = () => {
    if (step !== 'methods') {
      setStep('methods');
      return;
    }
    if (navigation.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(auth)/welcome' as Href);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + spacing.md }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl, flexGrow: 1 }}
      >
        <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
          <Icon name="arrow-back" size={22} color="#1A1A1A" />
        </Pressable>

        {step === 'methods' ? (
          <SignInMethods
            onGoogle={() => {
              if (!ready) {
                Alert.alert(
                  'Google sign-in',
                  'Google sign-in is only in the Android APK (not Expo Go). Wait for the EAS build, then install that APK.',
                );
                return;
              }
              void continueWithGoogle();
            }}
            onMobile={() => setStep('mobile')}
            onEmail={() => router.push(emailOtpHref('signin'))}
            googleDisabled={busy}
          />
        ) : null}
        {step === 'email' ? <EmailSignIn signIn={signIn} /> : null}
        {step === 'mobile' ? <MobileSignIn signIn={signIn} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SignInMethods({
  onGoogle,
  onMobile,
  onEmail,
  googleDisabled = false,
}: {
  onGoogle: () => void;
  onMobile: () => void;
  onEmail: () => void;
  googleDisabled?: boolean;
}) {
  return (
    <>
      <View style={styles.hero}>
        <AgeWellLogo compact />
        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.subtitle}>Choose how you want to sign in to AgeWell.</Text>
      </View>
      <AuthMethodButtons
        onGoogle={onGoogle}
        onMobile={onMobile}
        onEmail={onEmail}
        googleDisabled={googleDisabled}
      />
      <Pressable
        style={styles.linkWrap}
        onPress={() => router.replace('/(auth)/welcome' as Href)}
        accessibilityRole="button"
      >
        <Text style={styles.link}>New to AgeWell? Create an account</Text>
      </Pressable>
    </>
  );
}

function EmailSignIn({ signIn }: { signIn: (email: string, password: string) => Promise<void> }) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async ({ email, password }: LoginFormValues) => {
    try {
      await signIn(email.trim(), password);
    } catch (caught) {
      setError('root', {
        message: caught instanceof Error ? caught.message : 'Unable to sign in right now.',
      });
    }
  };

  return (
    <>
      <View style={styles.hero}>
        <AgeWellLogo compact />
        <Text style={styles.title}>Sign in with email</Text>
        <Text style={styles.subtitle}>
          If you registered in the app, your password is the mobile number you entered.
        </Text>
      </View>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
            showSecureToggle
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            textContentType="password"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.password?.message}
          />
        )}
      />
      {errors.root?.message ? (
        <Text style={styles.formError} accessibilityLiveRegion="polite">
          {errors.root.message}
        </Text>
      ) : null}
      <ForgotPasswordLink />
      <SignInSubmit loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
    </>
  );
}

function MobileSignIn({ signIn }: { signIn: (phone: string, password: string) => Promise<void> }) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<MobileLoginFormValues>({
    resolver: zodResolver(mobileLoginSchema),
    defaultValues: { phone: '', password: '' },
  });

  const onSubmit = async ({ phone, password }: MobileLoginFormValues) => {
    try {
      await signIn(phone.replace(/\s+/g, ''), password);
    } catch (caught) {
      setError('root', {
        message: caught instanceof Error ? caught.message : 'Unable to sign in right now.',
      });
    }
  };

  return (
    <>
      <View style={styles.hero}>
        <AgeWellLogo compact />
        <Text style={styles.title}>Sign in with mobile</Text>
        <Text style={styles.subtitle}>
          Enter your mobile number. If you registered in the app, your password is that same number.
        </Text>
      </View>
      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Mobile number"
            placeholder="Enter mobile number"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.phone?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
            showSecureToggle
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            textContentType="password"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.password?.message}
          />
        )}
      />
      {errors.root?.message ? (
        <Text style={styles.formError} accessibilityLiveRegion="polite">
          {errors.root.message}
        </Text>
      ) : null}
      <ForgotPasswordLink />
      <SignInSubmit loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
    </>
  );
}

function ForgotPasswordLink() {
  return (
    <Pressable
      onPress={() => router.push(forgotPasswordHref())}
      accessibilityRole="button"
      accessibilityLabel="Forgot password?"
      style={styles.forgotWrap}
    >
      <Text style={styles.forgot}>Forgot password?</Text>
    </Pressable>
  );
}

function SignInSubmit({ loading, onPress }: { loading: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel="Sign In"
      accessibilityHint="Signs in to your AgeWell account"
      accessibilityState={{ disabled: loading, busy: loading }}
      style={({ pressed }) => [
        styles.submit,
        pressed && !loading ? styles.submitPressed : null,
        loading ? styles.submitDisabled : null,
      ]}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitLabel}>Sign In</Text>}
    </Pressable>
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
  forgot: {
    ...typography.captionStrong,
    color: brandGreen,
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
    marginTop: spacing.xl,
  },
  link: {
    ...typography.captionStrong,
    color: brandGreen,
  },
});
