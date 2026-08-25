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
import { registerFamily } from './registrationApi';
import { registrationSuccessHref } from './registrationNavigation';
import { registerFamilySchema, type RegisterFamilyValues } from './registrationSchemas';

export function RegisterFamilyScreen() {
  const completeRegistration = useAuthStore((state) => state.completeRegistration);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFamilyValues>({
    resolver: zodResolver(registerFamilySchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      relationship: '',
      requestedSeniorReference: '',
    },
  });

  const onSubmit = async (values: RegisterFamilyValues) => {
    setFormError(null);
    try {
      const result = await registerFamily(values);
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
      <AgeWellHeader title="Family registration" showBack showProfile={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.step}>Step 1 of 2 · Family profile</Text>
        <Text style={styles.intro}>
          Create your family account. Access to a senior is granted only by AgeWell staff — entering a reference does not
          link accounts.
        </Text>
        <Field control={control} name="firstName" label="First name" error={errors.firstName?.message} />
        <Field control={control} name="lastName" label="Last name" error={errors.lastName?.message} />
        <Field control={control} name="email" label="Email" keyboardType="email-address" autoCapitalize="none" error={errors.email?.message} />
        <Field control={control} name="phone" label="Phone" keyboardType="phone-pad" error={errors.phone?.message} />
        <Field control={control} name="password" label="Password" secureTextEntry error={errors.password?.message} />
        <Field control={control} name="relationship" label="Relationship to senior" placeholder="Son, Daughter, Spouse…" error={errors.relationship?.message} />
        <Field
          control={control}
          name="requestedSeniorReference"
          label="Senior reference (optional)"
          placeholder="Parent name or membership ID"
          error={errors.requestedSeniorReference?.message}
        />
        {formError ? (
          <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
            {formError}
          </Text>
        ) : null}
        <PrimaryButton label="Create family account" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
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
  name: keyof RegisterFamilyValues;
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
