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
import { registerCareAssociate } from './registrationApi';
import { registrationSuccessHref } from './registrationNavigation';
import { registerCareSchema, type RegisterCareValues } from './registrationSchemas';

export function RegisterCareScreen() {
  const completeRegistration = useAuthStore((state) => state.completeRegistration);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterCareValues>({
    resolver: zodResolver(registerCareSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      skills: '',
      experience: '',
      languages: '',
      availability: '',
    },
  });

  const onSubmit = async (values: RegisterCareValues) => {
    setFormError(null);
    try {
      const result = await registerCareAssociate(values);
      completeRegistration(result.user, result.careStatus);
      router.replace(
        registrationSuccessHref({
          email: result.user.email,
          role: result.user.role,
          message: result.message,
          careStatus: result.careStatus,
        }) as Href,
      );
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    }
  };

  return (
    <Screen>
      <AgeWellHeader title="Care Associate application" showBack showProfile={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.step}>Application · Pending review</Text>
        <Text style={styles.intro}>
          This is an application, not immediate access. AgeWell staff must approve you before visits can be assigned.
        </Text>
        <Field control={control} name="firstName" label="First name" error={errors.firstName?.message} />
        <Field control={control} name="lastName" label="Last name" error={errors.lastName?.message} />
        <Field control={control} name="email" label="Email" keyboardType="email-address" autoCapitalize="none" error={errors.email?.message} />
        <Field control={control} name="phone" label="Phone" keyboardType="phone-pad" error={errors.phone?.message} />
        <Field control={control} name="password" label="Password" secureTextEntry error={errors.password?.message} />
        <Field control={control} name="skills" label="Skills" placeholder="Companionship, mobility support…" error={errors.skills?.message} />
        <Field control={control} name="experience" label="Experience" error={errors.experience?.message} />
        <Field control={control} name="languages" label="Languages" error={errors.languages?.message} />
        <Field control={control} name="availability" label="Availability" placeholder="Weekdays mornings…" error={errors.availability?.message} />
        {formError ? (
          <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
            {formError}
          </Text>
        ) : null}
        <PrimaryButton label="Submit application" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
        <Text style={styles.hint}>If this succeeds, you will see a confirmation. Visits stay locked until AgeWell approves you.</Text>
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
  name: keyof RegisterCareValues;
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
    color: colors.warning,
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
