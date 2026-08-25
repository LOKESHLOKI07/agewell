import { zodResolver } from '@hookform/resolvers/zod';
import { router, type Href } from 'expo-router';
import { useState, type ComponentType, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { UseQueryResult } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { ErrorState, PrimaryButton, TextField } from '@/components';
import { getApiErrorMessage } from '@/api/errors';
import { DISPLAY_DATE_PLACEHOLDER } from '@/utils/date';
import { colors, spacing, typography } from '@/constants/theme';
import { HealthQueryView } from '@/features/health/components/HealthQueryView';
import { HealthSubScreen } from '@/features/health/components/HealthSubScreen';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import type { HealthcareProvider, ListPage } from '@/features/home/types/home';
import { ProviderPicker } from './components/ProviderPicker';
import { useCreateAppointment } from './hooks';
import { bookAppointmentSchema, type BookAppointmentFormValues } from './schemas';
import { toScheduledAtIso } from './selectors';

interface ScreenShellProps {
  title: string;
  children: ReactNode;
}

interface BookAppointmentScreenProps {
  title?: string;
  subtitle?: string | null;
  seniorId: string | null;
  seniorPending?: boolean;
  providersQuery: UseQueryResult<ListPage<HealthcareProvider>>;
  successHref: Href;
  Shell?: ComponentType<ScreenShellProps>;
}

export function BookAppointmentScreen({
  title = 'Book appointment',
  subtitle,
  seniorId,
  seniorPending = false,
  providersQuery,
  successHref,
  Shell = HealthSubScreen,
}: BookAppointmentScreenProps) {
  const create = useCreateAppointment();
  const [submitError, setSubmitError] = useState<unknown>(null);
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookAppointmentFormValues>({
    resolver: zodResolver(bookAppointmentSchema),
    defaultValues: { doctorId: '', date: '', time: '' },
  });
  const selectedDoctorId = watch('doctorId');
  const providers = providersQuery.data?.items ?? [];
  const state = getSectionState({
    isPending: seniorPending || providersQuery.isPending,
    isError: providersQuery.isError,
    isEmpty: providers.length === 0,
  });

  const onSubmit = async (values: BookAppointmentFormValues) => {
    if (!seniorId) {
      return;
    }
    setSubmitError(null);
    try {
      await create.mutateAsync({
        seniorId,
        doctorId: values.doctorId,
        scheduledAt: toScheduledAtIso(values.date, values.time),
      });
      router.replace(successHref);
    } catch (caught) {
      setSubmitError(caught);
    }
  };

  return (
    <Shell title={title}>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {!seniorId && !seniorPending && !providersQuery.isPending ? (
        <ErrorState message="A senior is required to book an appointment." />
      ) : (
        <HealthQueryView
          state={state}
          error={providersQuery.error}
          onRetry={() => void providersQuery.refetch()}
          loadingMessage="Loading doctors..."
          emptyIcon="people-outline"
          emptyTitle="No doctors on file"
          emptyMessage="Appointments can be booked with a doctor already on record."
        >
          <Text style={styles.label}>Doctor</Text>
          <Controller
            control={control}
            name="doctorId"
            render={() => (
              <ProviderPicker
                providers={providers}
                value={selectedDoctorId || null}
                onChange={(id) => setValue('doctorId', id, { shouldValidate: true })}
              />
            )}
          />
          {errors.doctorId?.message ? <Text style={styles.error}>{errors.doctorId.message}</Text> : null}
          <Controller
            control={control}
            name="date"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Date"
                placeholder={DISPLAY_DATE_PLACEHOLDER}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                autoCapitalize="none"
                error={errors.date?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="time"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Time"
                placeholder="HH:MM"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                autoCapitalize="none"
                error={errors.time?.message}
              />
            )}
          />
          {submitError ? (
            <View style={styles.submitError}>
              <ErrorState message={getApiErrorMessage(submitError)} onRetry={() => void handleSubmit(onSubmit)()} />
            </View>
          ) : null}
          <PrimaryButton
            label="Book appointment"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting || create.isPending}
            disabled={!seniorId}
          />
        </HealthQueryView>
      )}
    </Shell>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.captionStrong,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.emergency,
    marginBottom: spacing.md,
  },
  submitError: {
    marginBottom: spacing.lg,
  },
});
