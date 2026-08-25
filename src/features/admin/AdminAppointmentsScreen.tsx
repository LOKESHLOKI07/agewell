import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { PrimaryButton, TextField } from '@/components';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { useAppointment, useCreateAppointment, useUpdateAppointment } from '@/features/appointments/hooks';
import { APPOINTMENT_STATUS_OPTIONS, scheduledAtToDateTime, toScheduledAtIso } from '@/features/appointments/selectors';
import type { Appointment, AppointmentStatus } from '@/features/home/types/home';
import { formatLongDate, formatTime } from '@/utils/date';
import { AdminCollection } from './components/AdminCollection';
import { AdminFilterChips } from './components/AdminFilterChips';
import { AdminPagination } from './components/AdminPagination';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { useAdminAppointments, useAdminProviders } from './hooks';
import { getAdminErrorMessage, getSectionState, humanizeStatus } from './selectors';
import { ADMIN_PAGE_SIZE } from './types';

export function AdminAppointmentsScreen() {
  const params = useLocalSearchParams<{ seniorId?: string }>();
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<AppointmentStatus | undefined>();
  const query = useAdminAppointments({
    limit: ADMIN_PAGE_SIZE,
    offset,
    seniorId: params.seniorId,
    status,
  });
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: (query.data?.items.length ?? 0) === 0,
  });

  return (
    <AdminScreen
      title="Appointments"
      subtitle="Book, confirm, reschedule, or cancel using the appointment API."
      actions={<PrimaryButton label="Book appointment" onPress={() => router.push('/(admin)/appointments/new' as Href)} />}
    >
      <AdminFilterChips
        label="Status"
        value={status}
        options={APPOINTMENT_STATUS_OPTIONS}
        onChange={(next) => {
          setOffset(0);
          setStatus(next);
        }}
      />
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading appointments..."
        emptyTitle="No appointments"
        emptyMessage="No appointments match this filter."
      >
        <AdminCollection
          items={query.data?.items ?? []}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) => `${item.doctorName ?? 'Appointment'}, ${humanizeStatus(item.status)}`}
          onPress={(item) => router.push(`/(admin)/appointments/${item.id}` as Href)}
          columns={[
            { key: 'doctor', label: 'Doctor', render: (item: Appointment) => <Text style={cell}>{item.doctorName ?? 'Not on file'}</Text> },
            { key: 'senior', label: 'Senior', render: (item) => <Text style={cell}>{item.seniorId}</Text> },
            { key: 'status', label: 'Status', render: (item) => <Text style={cell}>{humanizeStatus(item.status)}</Text> },
            {
              key: 'when',
              label: 'Scheduled',
              render: (item) => (
                <Text style={cell}>
                  {item.scheduledAt ? `${formatLongDate(item.scheduledAt)} ${formatTime(item.scheduledAt)}` : 'Not scheduled'}
                </Text>
              ),
            },
          ]}
        />
        <AdminPagination
          total={query.data?.total ?? 0}
          limit={query.data?.limit ?? ADMIN_PAGE_SIZE}
          offset={query.data?.offset ?? offset}
          onOffsetChange={setOffset}
        />
      </AdminQueryView>
    </AdminScreen>
  );
}

export function AdminAppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useAppointment(id);
  const update = useUpdateAppointment(id ?? '');
  const [status, setStatus] = useState<AppointmentStatus>('REQUESTED');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (query.data) {
      setStatus(query.data.status);
      const parts = scheduledAtToDateTime(query.data.scheduledAt);
      setDate(parts.date);
      setTime(parts.time);
    }
  }, [query.data]);

  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: query.isSuccess && !query.data,
  });

  return (
    <AdminScreen title="Appointment" subtitle="Status and scheduled time can be updated.">
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading appointment..."
        emptyTitle="Appointment not found"
        emptyMessage="This appointment is not in AgeWell."
      >
        {query.data ? (
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.line}>Doctor: {query.data.doctorName ?? 'Not on file'}</Text>
            <Text style={styles.line}>Senior: {query.data.seniorId}</Text>
            <AdminFilterChips
              label="Status"
              value={status}
              options={APPOINTMENT_STATUS_OPTIONS}
              onChange={(next) => next && setStatus(next)}
              allowAll={false}
            />
            <TextField label="Date" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} autoCapitalize="none" />
            <TextField label="Time" placeholder="HH:MM" value={time} onChangeText={setTime} autoCapitalize="none" />
            {formError ? <Text style={styles.error}>{formError}</Text> : null}
            <PrimaryButton
              label="Save appointment"
              loading={update.isPending}
              onPress={() => {
                setFormError(null);
                const scheduledAt = date && time ? toScheduledAtIso(date, time) : undefined;
                update.mutate(
                  { status, scheduledAt },
                  { onError: (error) => setFormError(getAdminErrorMessage(error)) },
                );
              }}
            />
          </View>
        ) : null}
      </AdminQueryView>
    </AdminScreen>
  );
}

export function AdminAppointmentCreateScreen() {
  const create = useCreateAppointment();
  const providers = useAdminProviders();
  const [seniorId, setSeniorId] = useState('');
  const [doctorId, setDoctorId] = useState<string | undefined>();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  return (
    <AdminScreen title="Book appointment">
      <TextField label="Senior ID" value={seniorId} onChangeText={setSeniorId} autoCapitalize="none" />
      <AdminFilterChips
        label="Doctor"
        value={doctorId}
        options={(providers.data?.items ?? []).map((item) => ({
          value: item.id,
          label: item.name ?? 'Doctor',
        }))}
        onChange={setDoctorId}
        allowAll={false}
      />
      <TextField label="Date" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} autoCapitalize="none" />
      <TextField label="Time" placeholder="HH:MM" value={time} onChangeText={setTime} autoCapitalize="none" />
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <PrimaryButton
        label="Book appointment"
        loading={create.isPending}
        onPress={() => {
          setFormError(null);
          if (!seniorId || !doctorId || !date || !time) {
            setFormError('Senior, doctor, date, and time are required.');
            return;
          }
          create.mutate(
            { seniorId, doctorId, scheduledAt: toScheduledAtIso(date, time) },
            {
              onError: (error) => setFormError(getAdminErrorMessage(error)),
              onSuccess: (appointment) => router.replace(`/(admin)/appointments/${appointment.id}` as Href),
            },
          );
        }}
      />
    </AdminScreen>
  );
}

const cell = { ...typography.body, color: colors.text };

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  line: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  error: {
    ...typography.caption,
    color: colors.emergency,
    marginBottom: spacing.md,
  },
});
