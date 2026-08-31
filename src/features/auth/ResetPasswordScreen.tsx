import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { router, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getApiErrorMessage } from '@/api/errors';
import { AgeWellLogo, brandGreen } from '@/components/AgeWellLogo';
import { TextField } from '@/components';
import { Icon } from '@/components/ui';
import { minTouchSize, spacing, typography } from '@/constants/theme';
import { emailOtpHref, forgotPasswordHref } from './authEntry';
import { resetPassword } from './passwordResetApi';
import { clearPasswordResetSession, getPasswordResetSession } from './passwordResetSession';

const schema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your password'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const session = getPasswordResetSession();
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [updated, setUpdated] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const goBack = () => {
    if (updated) {
      router.replace(emailOtpHref('signin'));
      return;
    }
    if (navigation.canGoBack()) {
      router.back();
      return;
    }
    router.replace(forgotPasswordHref(session?.email));
  };

  const onSubmit = async (values: FormValues) => {
    if (busy) {
      return;
    }
    const current = getPasswordResetSession();
    if (!current) {
      router.replace(forgotPasswordHref());
      return;
    }
    setFormError(null);
    setBusy(true);
    try {
      await resetPassword(current.resetToken, values.password);
      clearPasswordResetSession();
      setUpdated(true);
    } catch (caught) {
      setFormError(getApiErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  if (!session && !updated) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top + spacing.xl }]}>
        <Text style={styles.title}>Request a new code</Text>
        <Text style={styles.subtitle}>This password reset step expired. Start again from Forgot password.</Text>
        <Pressable
          onPress={() => router.replace(forgotPasswordHref())}
          accessibilityRole="button"
          accessibilityLabel="Forgot password"
          style={styles.submit}
        >
          <Text style={styles.submitLabel}>Forgot password</Text>
        </Pressable>
      </View>
    );
  }

  if (updated) {
    return (
      <View
        style={[
          styles.root,
          styles.centered,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <AgeWellLogo compact />
        <Text style={styles.title}>Password updated</Text>
        <Text style={styles.subtitle}>Sign in with your new password.</Text>
        <Pressable
          onPress={() => router.replace(emailOtpHref('signin'))}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
          style={styles.submit}
        >
          <Text style={styles.submitLabel}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

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
          <Text style={styles.title}>Create a new password</Text>
          <Text style={styles.subtitle}>
            Choose a new password
            {session?.email ? ` for ${session.email}` : ''}.
          </Text>
        </View>

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="New password"
              placeholder="At least 8 characters"
              secureTextEntry
              showSecureToggle
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.password?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Confirm password"
              placeholder="Re-enter password"
              secureTextEntry
              showSecureToggle
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        {formError ? (
          <Text style={styles.formError} accessibilityLiveRegion="polite">
            {formError}
          </Text>
        ) : null}

        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Update password"
          style={({ pressed }) => [
            styles.submit,
            pressed && !busy ? styles.submitPressed : null,
            busy ? styles.submitDisabled : null,
          ]}
        >
          {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitLabel}>Update password</Text>}
        </Pressable>
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
  centered: {
    justifyContent: 'center',
    gap: spacing.md,
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
});
