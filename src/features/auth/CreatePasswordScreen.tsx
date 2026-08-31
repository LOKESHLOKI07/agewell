import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
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
import { createAccountHref } from './authEntry';
import { getVerifiedEmail, setCreatedPassword } from './onboardingProfile';

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

export function CreatePasswordScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const email = getVerifiedEmail();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const goBack = () => {
    if (navigation.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(auth)/email-otp' as Href);
  };

  const onSubmit = (values: FormValues) => {
    setCreatedPassword(values.password);
    router.push(createAccountHref('email'));
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
          <Text style={styles.title}>Create your password</Text>
          <Text style={styles.subtitle}>
            Create a password so you can securely sign in to AgeWell
            {email ? ` with ${email}` : ''}.
          </Text>
        </View>

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Password"
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

        <Text style={styles.hint}>Use at least 8 characters. Do not share this password in OTP messages.</Text>

        <Pressable
          onPress={handleSubmit(onSubmit)}
          accessibilityRole="button"
          accessibilityLabel="Continue"
          style={({ pressed }) => [styles.submit, pressed ? styles.submitPressed : null]}
        >
          <Text style={styles.submitLabel}>Continue</Text>
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
  hint: {
    ...typography.caption,
    color: '#8A8A8A',
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
  submitLabel: {
    ...typography.bodyStrong,
    color: '#FFFFFF',
  },
});
