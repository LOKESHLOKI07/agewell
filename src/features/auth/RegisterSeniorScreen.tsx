import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { router, type Href } from 'expo-router';
import { PrimaryButton, Screen, TextField } from '@/components';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { colors, spacing, typography } from '@/constants/theme';
import { getApiErrorMessage } from '@/api/errors';
import { useAuthStore } from './authStore';
import { registerSenior } from './registrationApi';
import { registrationSuccessHref } from './registrationNavigation';
import { registerSeniorSchema, type RegisterSeniorValues } from './registrationSchemas';

export function RegisterSeniorScreen() {
  const completeRegistration = useAuthStore((state) => state.completeRegistration);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterSeniorValues>({
    resolver: zodResolver(registerSeniorSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      dateOfBirth: '',
      address: '',
      emergencyContact: '',
    },
  });

  const onSubmit = async (values: RegisterSeniorValues) => {
    setFormError(null);
    try {
      const result = await registerSenior(values);
      completeRegistration(result.user);
      router.replace(
        registrationSuccessHref({
          email: result.user.email,
          role: result.user.role,
          message: result.message,
        }) as Href,
      );
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    }
  };

  return (
    <Screen>
      <AgeWellHeader title="Senior registration" showBack showProfile={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.step}>Step 1 of 2 · Account & profile</Text>
        <Text style={styles.intro}>Create your AgeWell senior account. No family or care links are created automatically.</Text>
        <Field control={control} name="firstName" label="First name" error={errors.firstName?.message} />
        <Field control={control} name="lastName" label="Last name" error={errors.lastName?.message} />
        <Field control={control} name="email" label="Email" keyboardType="email-address" autoCapitalize="none" error={errors.email?.message} />
        <Field control={control} name="phone" label="Phone" keyboardType="phone-pad" error={errors.phone?.message} />
        <Field control={control} name="password" label="Password" secureTextEntry error={errors.password?.message} />
        <Field control={control} name="dateOfBirth" label="Date of birth (DD-MM-YYYY)" placeholder="10-03-1952" error={errors.dateOfBirth?.message} />
        <Field control={control} name="address" label="Home address" error={errors.address?.message} />
        <Field control={control} name="emergencyContact" label="Emergency contact" error={errors.emergencyContact?.message} />
        {formError ? (
          <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
            {formError}
          </Text>
        ) : null}
        <PrimaryButton label="Create senior account" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
        <Text style={styles.hint}>If this succeeds, you will see a confirmation and enter the app signed in.</Text>
      </ScrollView>
    </Screen>
  );
}

function Field({
  control,
  name,
  label,
  error,
  ...rest
}: {
  control: any;
  name: keyof RegisterSeniorValues;
  label: string;
  error?: string;
  [key: string]: unknown;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <TextField label={label} value={value} onBlur={onBlur} onChangeText={onChange} error={error} {...rest} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xs,
  },
  step: {
    ...typography.captionStrong,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  intro: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  error: {
    ...typography.body,
    color: colors.emergency,
    marginVertical: spacing.md,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
