import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { emergencyStatusLabel, emergencyTypeLabel } from '@/features/emergency/selectors';
import type { EmergencyCase, EmergencyStatus } from '@/features/emergency/types/emergency';
import { formatLongDate, formatTime } from '@/utils/date';
import { AdminCollection } from './components/AdminCollection';
import { AdminFilterChips } from './components/AdminFilterChips';
import { AdminPagination } from './components/AdminPagination';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { useAdminEmergencies, useAdminEmergency, useAdminEmergencyEvents, useUpdateAdminEmergency } from './hooks';
import { getAdminErrorMessage, getSectionState } from './selectors';
import { ADMIN_PAGE_SIZE } from './types';

const STATUSES: { value: EmergencyStatus; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function AdminEmergenciesScreen() {
  const params = useLocalSearchParams<{ seniorId?: string }>();
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<EmergencyStatus | undefined>();
  const query = useAdminEmergencies({ limit: ADMIN_PAGE_SIZE, offset, status, seniorId: params.seniorId });
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: (query.data?.items.length ?? 0) === 0,
  });

  return (
    <AdminScreen title="Emergencies" subtitle="Status management only. No dispatch, GPS, or calling.">
      <AdminFilterChips
        label="Status"
        value={status}
        options={STATUSES}
        onChange={(next) => {
          setOffset(0);
          setStatus(next);
        }}
      />
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading emergencies..."
        emptyTitle="No emergencies"
        emptyMessage="No emergency cases match this filter."
      >
        <AdminCollection
          items={query.data?.items ?? []}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) => `${emergencyTypeLabel(item.type)}, ${emergencyStatusLabel(item.status)}`}
          onPress={(item) => router.push(`/(admin)/emergencies/${item.id}` as Href)}
          columns={[
            { key: 'type', label: 'Type', render: (item: EmergencyCase) => <Text style={cell}>{emergencyTypeLabel(item.type)}</Text> },
            { key: 'senior', label: 'Senior', render: (item) => <Text style={cell}>{item.seniorId}</Text> },
            { key: 'status', label: 'Status', render: (item) => <Text style={cell}>{emergencyStatusLabel(item.status)}</Text> },
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

export function AdminEmergencyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useAdminEmergency(id);
  const events = useAdminEmergencyEvents(id);
  const update = useUpdateAdminEmergency();
  const [formError, setFormError] = useState<string | null>(null);
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: query.isSuccess && !query.data,
  });

  return (
    <AdminScreen title="Emergency" subtitle="Timeline events are existing emergency_events rows only.">
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading emergency..."
        emptyTitle="Emergency not found"
        emptyMessage="This emergency case is not in AgeWell."
      >
        {query.data ? (
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.name}>{emergencyTypeLabel(query.data.type)}</Text>
            <Text style={styles.line}>Senior: {query.data.seniorId}</Text>
            <Text style={styles.line}>Status: {emergencyStatusLabel(query.data.status)}</Text>
            <AdminFilterChips
              label="Update status"
              value={query.data.status}
              options={STATUSES}
              allowAll={false}
              onChange={(next) => {
                if (!next || next === query.data?.status) return;
                setFormError(null);
                update.mutate({ id: query.data.id, status: next }, { onError: (error) => setFormError(getAdminErrorMessage(error)) });
              }}
            />
            {formError ? <Text style={styles.error}>{formError}</Text> : null}
          </View>
        ) : null}
        <Text style={styles.section}>Timeline</Text>
        {(events.data?.items ?? []).length === 0 ? <Text style={styles.line}>No events on file.</Text> : null}
        {(events.data?.items ?? []).map((event) => (
          <Text key={event.id} style={styles.line}>
            {event.createdAt ? `${formatLongDate(event.createdAt)} ${formatTime(event.createdAt)}` : 'No date'} ·{' '}
            {event.eventDescription ?? 'Event'}
          </Text>
        ))}
      </AdminQueryView>
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
  name: {
    ...typography.subtitle,
    color: colors.text,
  },
  line: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  section: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.emergency,
    marginBottom: spacing.md,
  },
});
