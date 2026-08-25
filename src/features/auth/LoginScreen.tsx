import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text } from 'react-native';
import { router, type Href } from 'expo-router';
import { BrandMark, PrimaryButton, Screen, TextField } from '@/components';
import { colors, minTouchSize, spacing, typography } from '@/constants/theme';
import { useAuth } from './useAuth';
import { loginSchema, type LoginFormValues } from './schemas';

export function LoginScreen() {
  const { signIn } = useAuth();
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
    <Screen>
      <BrandMark size="small" />
      <Text style={styles.title}>Welcome to AgeWell</Text>
      <Text style={styles.subtitle}>Sign in to stay connected to the care you need.</Text>
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
      <PrimaryButton
        label="Sign In"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        accessibilityHint="Signs in to your AgeWell account"
      />
      <Pressable
        style={styles.linkWrap}
        onPress={() => router.push('/(auth)/welcome' as Href)}
        accessibilityRole="button"
      >
        <Text style={styles.link}>Back to welcome · Create account</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.xxxl,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xxxl,
  },
  formError: {
    ...typography.body,
    color: colors.emergency,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  linkWrap: {
    minHeight: minTouchSize,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  link: {
    ...typography.captionStrong,
    color: colors.primary,
  },
});
