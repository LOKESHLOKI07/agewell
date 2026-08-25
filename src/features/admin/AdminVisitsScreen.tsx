import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { PrimaryButton, PremiumCard, TextField } from '@/components';
import { colors, spacing, typography } from '@/constants/theme';
import type { Visit, VisitStatus } from '@/features/home/types/home';
import { combineDateAndTime, DISPLAY_DATE_PLACEHOLDER, formatRelativeDay, formatTime, splitDateAndTime } from '@/utils/date';
import { AdminCollection } from './components/AdminCollection';
import { AdminFilterChips } from './components/AdminFilterChips';
import { AdminPagination } from './components/AdminPagination';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { AdminSearchPicker } from './components/AdminSearchPicker';
import {
  useAdminCareManagers,
  useAdminSeniors,
  useAdminVisit,
  useAdminVisitReports,
  useAdminVisitTasks,
  useAdminVisits,
  useCreateAdminVisit,
  useUpdateAdminVisit,
} from './hooks';
import { adminCareManagerDisplay, adminSeniorDisplay, getAdminErrorMessage, getSectionState, humanizeStatus } from './selectors';
import { ADMIN_PAGE_SIZE } from './types';

const VISIT_STATUSES: { value: VisitStatus; label: string }[] = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'CHECKED_IN', label: 'Checked in' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'CHECKED_OUT', label: 'Checked out' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No show' },
];

export function AdminVisitsScreen() {
  const params = useLocalSearchParams<{ seniorId?: string; careManagerId?: string }>();
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<VisitStatus | undefined>();
  const query = useAdminVisits({
    limit: ADMIN_PAGE_SIZE,
    offset,
    status,
    seniorId: params.seniorId,
    careManagerId: params.careManagerId,
  });
  const seniors = useAdminSeniors({ limit: 100, offset: 0 });
  const seniorName = (seniorId: string) => {
    const senior = seniors.data?.items.find((item) => item.id === seniorId);
    return senior ? adminSeniorDisplay(senior) : seniorId;
  };
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: (query.data?.items.length ?? 0) === 0,
  });

  return (
    <AdminScreen
      title="Visits"
      subtitle="Assign Care Associates to individual visits through visits.care_manager_id."
      actions={<PrimaryButton label="Create visit" onPress={() => router.push('/(admin)/visits/new' as Href)} />}
    >
      <AdminFilterChips
        label="Status"
        value={status}
        options={VISIT_STATUSES}
        onChange={(next) => {
          setOffset(0);
          setStatus(next);
        }}
      />
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading visits..."
        emptyTitle="No visits"
        emptyMessage="No visits match this filter."
      >
        <AdminCollection
          items={query.data?.items ?? []}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) => `${item.careManagerName ?? 'Unassigned'}, ${humanizeStatus(item.status)}`}
          onPress={(item) => router.push(`/(admin)/visits/${item.id}` as Href)}
          columns={[
            { key: 'senior', label: 'Senior', render: (item: Visit) => <Text style={cell}>{seniorName(item.seniorId)}</Text> },
            { key: 'manager', label: 'Care Associate', render: (item) => <Text style={cell}>{item.careManagerName ?? 'Unassigned'}</Text> },
            { key: 'status', label: 'Status', render: (item) => <Text style={cell}>{humanizeStatus(item.status)}</Text> },
            {
              key: 'when',
              label: 'When',
              render: (item) => (
                <Text style={cell}>
                  {item.scheduledAt ? `${formatRelativeDay(item.scheduledAt)} ${formatTime(item.scheduledAt)}` : '—'}
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

export function AdminVisitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useAdminVisit(id);
  const tasks = useAdminVisitTasks(id);
  const reports = useAdminVisitReports(id);
  const managers = useAdminCareManagers();
  const seniors = useAdminSeniors({ limit: 100, offset: 0 });
  const update = useUpdateAdminVisit(id ?? '');
  const [status, setStatus] = useState<VisitStatus>('SCHEDULED');
  const [notes, setNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [careManagerId, setCareManagerId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (query.data) {
      setStatus(query.data.status);
      setNotes(query.data.notes ?? '');
      setCareManagerId(query.data.careManagerId ?? null);
      const parts = splitDateAndTime(query.data.scheduledAt);
      setScheduledDate(parts.date);
      setScheduledTime(parts.time);
    }
  }, [query.data]);

  const activeManagers = useMemo(
    () =>
      (managers.data ?? [])
        .filter((item) => !item.status || item.status.toUpperCase() === 'ACTIVE')
        .map((item) => ({
          id: item.id,
          title: adminCareManagerDisplay(item),
          subtitle: item.employeeId ?? undefined,
        })),
    [managers.data],
  );

  const seniorLabel = useMemo(() => {
    const senior = seniors.data?.items.find((item) => item.id === query.data?.seniorId);
    return senior ? adminSeniorDisplay(senior) : query.data?.seniorId;
  }, [query.data?.seniorId, seniors.data?.items]);

  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: query.isSuccess && !query.data,
  });

  return (
    <AdminScreen title="Visit" subtitle="Change Care Associate assignment on this visit only.">
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading visit..."
        emptyTitle="Visit not found"
        emptyMessage="This visit is not in AgeWell."
      >
        {query.data ? (
          <PremiumCard style={styles.card}>
            <Text style={styles.line}>Senior: {seniorLabel}</Text>
            <Text style={styles.line}>Employee ID: {query.data.employeeId ?? 'Not on file'}</Text>
            <AdminFilterChips label="Status" value={status} options={VISIT_STATUSES} onChange={(next) => next && setStatus(next)} allowAll={false} />
            <AdminSearchPicker
              label="Assign Care Associate"
              options={activeManagers}
              value={careManagerId}
              loading={managers.isPending}
              emptyMessage="No ACTIVE care associates."
              onChange={setCareManagerId}
            />
            <TextField
              label="Date"
              value={scheduledDate}
              onChangeText={setScheduledDate}
              placeholder={DISPLAY_DATE_PLACEHOLDER}
              autoCapitalize="none"
            />
            <TextField
              label="Time"
              value={scheduledTime}
              onChangeText={setScheduledTime}
              placeholder="HH:MM"
              autoCapitalize="none"
            />
            <TextField label="Notes" value={notes} onChangeText={setNotes} />
            {formError ? <Text style={styles.error}>{formError}</Text> : null}
            <PrimaryButton
              label="Save visit"
              loading={update.isPending}
              onPress={() => {
                setFormError(null);
                update.mutate(
                  {
                    status,
                    notes,
                    careManagerId: careManagerId ?? undefined,
                    scheduledAt: scheduledDate && scheduledTime ? combineDateAndTime(scheduledDate, scheduledTime) : undefined,
                  },
                  { onError: (error) => setFormError(getAdminErrorMessage(error)) },
                );
              }}
            />
          </PremiumCard>
        ) : null}
        <Text style={styles.section}>Tasks</Text>
        {(tasks.data ?? []).length === 0 ? <Text style={styles.line}>No tasks on file.</Text> : null}
        {(tasks.data ?? []).map((task) => (
          <Text key={task.id} style={styles.line}>
            {task.taskName ?? 'Task'} · {task.isCompleted ? 'Completed' : 'Not completed'}
          </Text>
        ))}
        <Text style={styles.section}>Reports</Text>
        {(reports.data ?? []).length === 0 ? <Text style={styles.line}>No reports on file.</Text> : null}
        {(reports.data ?? []).map((report) => (
          <Text key={report.id} style={styles.line}>
            {report.summary ?? 'Report'} {report.issuesNoted ? `· ${report.issuesNoted}` : ''}
          </Text>
        ))}
      </AdminQueryView>
    </AdminScreen>
  );
}

export function AdminVisitCreateScreen() {
  const params = useLocalSearchParams<{ seniorId?: string; careManagerId?: string }>();
  const create = useCreateAdminVisit();
  const managers = useAdminCareManagers();
  const seniors = useAdminSeniors({ limit: 100, offset: 0 });
  const [seniorId, setSeniorId] = useState<string | null>(params.seniorId ?? null);
  const [careManagerId, setCareManagerId] = useState<string | null>(params.careManagerId ?? null);
  const [status, setStatus] = useState<VisitStatus>('SCHEDULED');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const seniorOptions = useMemo(
    () =>
      (seniors.data?.items ?? []).map((senior) => ({
        id: senior.id,
        title: adminSeniorDisplay(senior),
        subtitle: senior.email ?? undefined,
      })),
    [seniors.data?.items],
  );
  const activeManagers = useMemo(
    () =>
      (managers.data ?? [])
        .filter((item) => !item.status || item.status.toUpperCase() === 'ACTIVE')
        .map((item) => ({
          id: item.id,
          title: adminCareManagerDisplay(item),
          subtitle: item.employeeId ?? undefined,
        })),
    [managers.data],
  );

  return (
    <AdminScreen title="Create visit" subtitle="Links one Senior and one Care Associate for a specific visit.">
      <AdminSearchPicker
        label="Senior"
        options={seniorOptions}
        value={seniorId}
        loading={seniors.isPending}
        emptyMessage="No senior profiles."
        onChange={setSeniorId}
      />
      <AdminSearchPicker
        label="Care Associate"
        options={activeManagers}
        value={careManagerId}
        loading={managers.isPending}
        emptyMessage="No ACTIVE care associates."
        onChange={setCareManagerId}
      />
      <AdminFilterChips label="Status" value={status} options={VISIT_STATUSES} onChange={(next) => next && setStatus(next)} allowAll={false} />
      <TextField label="Date" value={scheduledDate} onChangeText={setScheduledDate} placeholder={DISPLAY_DATE_PLACEHOLDER} autoCapitalize="none" />
      <TextField label="Time" value={scheduledTime} onChangeText={setScheduledTime} placeholder="HH:MM" autoCapitalize="none" />
      <TextField label="Notes" value={notes} onChangeText={setNotes} />
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <PrimaryButton
        label="Create visit"
        loading={create.isPending}
        onPress={() => {
          if (!seniorId) {
            setFormError('Select a senior.');
            return;
          }
          setFormError(null);
          create.mutate(
            {
              seniorId,
              careManagerId: careManagerId ?? undefined,
              status,
              scheduledAt: scheduledDate && scheduledTime ? combineDateAndTime(scheduledDate, scheduledTime) : undefined,
              notes,
            },
            {
              onError: (error) => setFormError(getAdminErrorMessage(error)),
              onSuccess: (visit) => router.replace(`/(admin)/visits/${visit.id}` as Href),
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
    marginBottom: spacing.xl,
  },
  line: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    ...typography.subtitle,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.emergency,
    marginBottom: spacing.md,
  },
});
