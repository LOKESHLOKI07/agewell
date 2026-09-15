import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, TextField } from '@/components';
import { spacing, typography } from '@/constants/theme';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import {
  membershipOnboardingSchema,
  type MembershipOnboardingValues,
} from './onboardingForm';

export function MembershipOnboardingForm({
  planName,
  defaultValues,
  submitting,
  onBack,
  onSubmit,
}: {
  planName: string;
  defaultValues: MembershipOnboardingValues;
  submitting: boolean;
  onBack: () => void;
  onSubmit: (values: MembershipOnboardingValues) => void;
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MembershipOnboardingValues>({
    resolver: zodResolver(membershipOnboardingSchema),
    defaultValues,
  });

  return (
    <View style={styles.form}>
      <Text style={styles.kicker}>{planName}</Text>
      <Text style={styles.title}>Emergency details</Text>
      <Text style={styles.intro}>
        Add two family members AgeWell can call, and the nearby hospital to use if admission is needed.
      </Text>

      <Text style={styles.section}>Family member 1</Text>
      <Field
        control={control}
        name="familyContact1Name"
        label="Name"
        error={errors.familyContact1Name?.message}
      />
      <Field
        control={control}
        name="familyContact1Phone"
        label="Phone number"
        keyboardType="phone-pad"
        error={errors.familyContact1Phone?.message}
      />

      <Text style={styles.section}>Family member 2</Text>
      <Text style={styles.hint}>Optional — add a second contact if you can.</Text>
      <Field
        control={control}
        name="familyContact2Name"
        label="Name"
        error={errors.familyContact2Name?.message}
      />
      <Field
        control={control}
        name="familyContact2Phone"
        label="Phone number"
        keyboardType="phone-pad"
        error={errors.familyContact2Phone?.message}
      />

      <Text style={styles.section}>Nearby hospital</Text>
      <Field
        control={control}
        name="preferredHospital"
        label="Hospital for emergency admission"
        placeholder="Name and area, e.g. Apex Hospital, Borivali"
        error={errors.preferredHospital?.message}
      />

      <PrimaryButton
        label={submitting ? 'Sending…' : 'Submit membership request'}
        loading={submitting}
        onPress={handleSubmit(onSubmit)}
      />
      <Pressable
        onPress={onBack}
        disabled={submitting}
        accessibilityRole="button"
        accessibilityLabel="Back to plans"
        style={({ pressed }) => [styles.back, pressed ? styles.pressed : null]}
      >
        <Text style={styles.backLabel}>Back to plans</Text>
      </Pressable>
    </View>
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
  name: keyof MembershipOnboardingValues;
  label: string;
  error?: string;
  keyboardType?: 'phone-pad' | 'default';
  placeholder?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <TextField
          label={label}
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error}
          {...rest}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.sm,
  },
  kicker: {
    ...typography.captionStrong,
    color: familyHome.greenDark,
  },
  title: {
    ...typography.title,
    color: familyHome.text,
  },
  intro: {
    ...typography.body,
    color: familyHome.muted,
    marginBottom: spacing.sm,
  },
  section: {
    ...typography.subtitle,
    color: familyHome.text,
    marginTop: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: familyHome.muted,
    marginBottom: spacing.xs,
  },
  back: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLabel: {
    ...typography.bodyStrong,
    color: familyHome.green,
  },
  pressed: {
    opacity: 0.85,
  },
});
