import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { PrimaryButton, TextField } from '@/components';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import type { Visit, VisitStatus } from '@/features/home/types/home';
import { AdminCollection } from './components/AdminCollection';
import { AdminFilterChips } from './components/AdminFilterChips';
import { AdminPagination } from './components/AdminPagination';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import {
  useAdminCareManagers,
  useAdminVisit,
  useAdminVisitReports,
  useAdminVisitTasks,
  useAdminVisits,
  useCreateAdminVisit,
  useUpdateAdminVisit,
} from './hooks';
import { adminCareManagerDisplay, getAdminErrorMessage, getSectionState, humanizeStatus } from './selectors';
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
  const params = useLocalSearchParams<{ seniorId?: string }>();
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<VisitStatus | undefined>();
  const query = useAdminVisits({ limit: ADMIN_PAGE_SIZE, offset, status, seniorId: params.seniorId });
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: (query.data?.items.length ?? 0) === 0,
  });

  return (
    <AdminScreen
      title="Visits"
      subtitle="Assign care managers through visits.care_manager_id."
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
            { key: 'senior', label: 'Senior', render: (item: Visit) => <Text style={cell}>{item.seniorId}</Text> },
            { key: 'manager', label: 'Care manager', render: (item) => <Text style={cell}>{item.careManagerName ?? 'Unassigned'}</Text> },
            { key: 'status', label: 'Status', render: (item) => <Text style={cell}>{humanizeStatus(item.status)}</Text> },
            { key: 'notes', label: 'Notes', render: (item) => <Text style={cell}>{item.notes ?? 'None'}</Text> },
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
  const update = useUpdateAdminVisit(id ?? '');
  const [status, setStatus] = useState<VisitStatus>('SCHEDULED');
  const [notes, setNotes] = useState('');
  const [careManagerId, setCareManagerId] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (query.data) {
      setStatus(query.data.status);
      setNotes(query.data.notes ?? '');
      setCareManagerId(query.data.careManagerId ?? undefined);
    }
  }, [query.data]);

  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: query.isSuccess && !query.data,
  });

  return (
    <AdminScreen title="Visit" subtitle="Tasks and reports are read-only.">
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading visit..."
        emptyTitle="Visit not found"
        emptyMessage="This visit is not in AgeWell."
      >
        {query.data ? (
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.line}>Senior: {query.data.seniorId}</Text>
            <Text style={styles.line}>Employee ID: {query.data.employeeId ?? 'Not on file'}</Text>
            <AdminFilterChips label="Status" value={status} options={VISIT_STATUSES} onChange={(next) => next && setStatus(next)} allowAll={false} />
            <AdminFilterChips
              label="Care manager"
              value={careManagerId}
              options={(managers.data ?? []).map((item) => ({ value: item.id, label: adminCareManagerDisplay(item) }))}
              onChange={setCareManagerId}
              allowAll={false}
            />
            <TextField label="Notes" value={notes} onChangeText={setNotes} />
            {formError ? <Text style={styles.error}>{formError}</Text> : null}
            <PrimaryButton
              label="Save visit"
              loading={update.isPending}
              onPress={() => {
                setFormError(null);
                update.mutate(
                  { status, notes, careManagerId },
                  { onError: (error) => setFormError(getAdminErrorMessage(error)) },
                );
              }}
            />
          </View>
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
  const create = useCreateAdminVisit();
  const managers = useAdminCareManagers();
  const [seniorId, setSeniorId] = useState('');
  const [careManagerId, setCareManagerId] = useState<string | undefined>();
  const [status, setStatus] = useState<VisitStatus>('SCHEDULED');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  return (
    <AdminScreen title="Create visit">
      <TextField label="Senior ID" value={seniorId} onChangeText={setSeniorId} autoCapitalize="none" />
      <AdminFilterChips
        label="Care manager"
        value={careManagerId}
        options={(managers.data ?? []).map((item) => ({ value: item.id, label: adminCareManagerDisplay(item) }))}
        onChange={setCareManagerId}
      />
      <AdminFilterChips label="Status" value={status} options={VISIT_STATUSES} onChange={(next) => next && setStatus(next)} allowAll={false} />
      <TextField label="Notes" value={notes} onChangeText={setNotes} />
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <PrimaryButton
        label="Create visit"
        loading={create.isPending}
        onPress={() => {
          setFormError(null);
          create.mutate(
            { seniorId, careManagerId, status, notes },
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
