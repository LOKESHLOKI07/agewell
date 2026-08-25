import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { ConfirmDialog, ErrorState, PrimaryButton, SecondaryButton, TextField } from '@/components';
import { getApiErrorMessage } from '@/api/errors';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { HealthQueryView } from '@/features/health/components/HealthQueryView';
import { HealthSubScreen } from '@/features/health/components/HealthSubScreen';
import { getSectionState, humanizeStatus } from '@/features/home/selectors/homeViewModel';
import { formatLongDate, formatTime } from '@/utils/date';
import { useAppointment, useUpdateAppointment } from './hooks';
import { rescheduleAppointmentSchema, type RescheduleAppointmentFormValues } from './schemas';
import { canManageAppointment, scheduledAtToDateTime, toScheduledAtIso } from './selectors';

interface ScreenShellProps {
  title: string;
  children: ReactNode;
}

interface AppointmentDetailScreenProps {
  appointmentId: string | undefined;
  title?: string;
  Shell?: ComponentType<ScreenShellProps>;
}

export function AppointmentDetailScreen({
  appointmentId,
  title = 'Appointment',
  Shell = HealthSubScreen,
}: AppointmentDetailScreenProps) {
  const query = useAppointment(appointmentId);
  const update = useUpdateAppointment(appointmentId ?? '');
  const appointment = query.data;
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [actionError, setActionError] = useState<unknown>(null);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RescheduleAppointmentFormValues>({
    resolver: zodResolver(rescheduleAppointmentSchema),
    defaultValues: { date: '', time: '' },
  });

  useEffect(() => {
    if (appointment?.scheduledAt) {
      reset(scheduledAtToDateTime(appointment.scheduledAt));
    }
  }, [appointment?.scheduledAt, reset]);

  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: query.isSuccess && !query.data,
  });
  const manageable = appointment ? canManageAppointment(appointment.status) : false;
  const when = appointment?.scheduledAt
    ? `${formatLongDate(appointment.scheduledAt)} · ${formatTime(appointment.scheduledAt)}`
    : 'Not scheduled';

  const onCancel = async () => {
    setActionError(null);
    try {
      await update.mutateAsync({ status: 'CANCELLED' });
      setConfirmCancel(false);
    } catch (caught) {
      setActionError(caught);
      setConfirmCancel(false);
    }
  };

  const onReschedule = async (values: RescheduleAppointmentFormValues) => {
    setActionError(null);
    try {
      await update.mutateAsync({ scheduledAt: toScheduledAtIso(values.date, values.time) });
      setRescheduleOpen(false);
    } catch (caught) {
      setActionError(caught);
    }
  };

  return (
    <Shell title={title}>
      <HealthQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading appointment..."
        emptyIcon="calendar-outline"
        emptyTitle="Appointment not found"
        emptyMessage="This appointment is not available."
      >
        {appointment ? (
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.label}>Doctor</Text>
            <Text style={styles.value}>{appointment.doctorName ?? 'Doctor'}</Text>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{humanizeStatus(appointment.status)}</Text>
            <Text style={styles.label}>Scheduled</Text>
            <Text style={styles.value}>{when}</Text>
          </View>
        ) : null}

        {actionError ? (
          <View style={styles.actionError}>
            <ErrorState message={getApiErrorMessage(actionError)} onRetry={() => setActionError(null)} />
          </View>
        ) : null}

        {manageable && rescheduleOpen ? (
          <View style={styles.reschedule}>
            <Controller
              control={control}
              name="date"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="New date"
                  placeholder="YYYY-MM-DD"
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
                  label="New time"
                  placeholder="HH:MM"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  autoCapitalize="none"
                  error={errors.time?.message}
                />
              )}
            />
            <PrimaryButton
              label="Save new time"
              onPress={handleSubmit(onReschedule)}
              loading={isSubmitting || update.isPending}
            />
            <SecondaryButton label="Keep current time" onPress={() => setRescheduleOpen(false)} />
          </View>
        ) : null}

        {manageable && !rescheduleOpen ? (
          <View style={styles.actions}>
            <PrimaryButton label="Reschedule" onPress={() => setRescheduleOpen(true)} disabled={update.isPending} />
            <SecondaryButton label="Cancel appointment" onPress={() => setConfirmCancel(true)} disabled={update.isPending} />
          </View>
        ) : null}
      </HealthQueryView>

      <ConfirmDialog
        visible={confirmCancel}
        title="Cancel this appointment?"
        message="The appointment will be marked cancelled. You can book a new time afterwards."
        confirmLabel="Cancel appointment"
        cancelLabel="Keep appointment"
        onConfirm={() => void onCancel()}
        onCancel={() => setConfirmCancel(false)}
      />
    </Shell>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  value: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.xs,
  },
  actions: {
    gap: spacing.md,
  },
  reschedule: {
    gap: spacing.sm,
  },
  actionError: {
    marginBottom: spacing.lg,
  },
});
