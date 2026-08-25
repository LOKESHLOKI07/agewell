import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { PrimaryButton, TextField } from '@/components';
import { colors, minTouchSize, radius, shadows, spacing, typography } from '@/constants/theme';
import { AdminCollection } from './components/AdminCollection';
import { AdminPagination } from './components/AdminPagination';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import {
  useAdminAppointments,
  useAdminCurrentMembership,
  useAdminEmergencies,
  useAdminMedicalRecords,
  useAdminMembershipUsage,
  useAdminSenior,
  useAdminSeniors,
  useAdminVisits,
  useCreateAdminSenior,
} from './hooks';
import { adminSeniorDisplay, getAdminErrorMessage, getSectionState, humanizeStatus } from './selectors';
import type { AdminSenior } from './types';
import { ADMIN_PAGE_SIZE } from './types';
import { formatLongDate } from '@/utils/date';

export function AdminSeniorsScreen() {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const query = useAdminSeniors({ limit: ADMIN_PAGE_SIZE, offset });
  const items = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const rows = query.data?.items ?? [];
    if (!needle) {
      return rows;
    }
    return rows.filter((senior) =>
      `${senior.firstName} ${senior.lastName} ${senior.email ?? ''}`.toLowerCase().includes(needle),
    );
  }, [query.data?.items, search]);
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: items.length === 0,
  });

  return (
    <AdminScreen
      title="Seniors"
      subtitle="Directory from PostgreSQL. Search filters the current page."
      actions={<PrimaryButton label="Create senior" onPress={() => router.push('/(admin)/seniors/new' as Href)} />}
    >
      <TextField label="Search name or email" value={search} onChangeText={setSearch} />
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading seniors..."
        emptyTitle="No seniors"
        emptyMessage="No senior records match this view."
      >
        <AdminCollection
          items={items}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) => adminSeniorDisplay(item)}
          onPress={(item) => router.push(`/(admin)/seniors/${item.id}` as Href)}
          columns={[
            { key: 'name', label: 'Name', render: (item: AdminSenior) => <Text style={cell}>{adminSeniorDisplay(item)}</Text> },
            { key: 'email', label: 'Email', render: (item) => <Text style={cell}>{item.email ?? 'Not on file'}</Text> },
            { key: 'contact', label: 'Emergency contact', render: (item) => <Text style={cell}>{item.emergencyContact}</Text> },
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

export function AdminSeniorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useAdminSenior(id);
  const visits = useAdminVisits({ seniorId: id, limit: 5, offset: 0 });
  const appointments = useAdminAppointments({ seniorId: id, limit: 5, offset: 0 });
  const health = useAdminMedicalRecords(id);
  const membership = useAdminCurrentMembership(id);
  const usage = useAdminMembershipUsage(id);
  const emergencies = useAdminEmergencies({ seniorId: id, limit: 5, offset: 0 });
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: query.isSuccess && !query.data,
  });

  return (
    <AdminScreen title="Senior" subtitle="Profile and related operational records.">
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading senior..."
        emptyTitle="Senior not found"
        emptyMessage="This senior is not in AgeWell."
      >
        {query.data ? (
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.name}>{adminSeniorDisplay(query.data)}</Text>
            <Text style={styles.line}>Email: {query.data.email ?? 'Not on file'}</Text>
            <Text style={styles.line}>Date of birth: {query.data.dateOfBirth}</Text>
            <Text style={styles.line}>Address: {query.data.address}</Text>
            <Text style={styles.line}>Emergency contact: {query.data.emergencyContact}</Text>
          </View>
        ) : null}
        <Related title="Visits" href={`/(admin)/visits?seniorId=${id}`} loading={visits.isPending} error={visits.isError} empty={!visits.data?.items.length}>
          {(visits.data?.items ?? []).map((visit) => (
            <Text key={visit.id} style={styles.line}>
              {humanizeStatus(visit.status)} · {visit.careManagerName ?? 'Unassigned'}
            </Text>
          ))}
        </Related>
        <Related title="Appointments" href={`/(admin)/appointments?seniorId=${id}`} loading={appointments.isPending} error={appointments.isError} empty={!appointments.data?.items.length}>
          {(appointments.data?.items ?? []).map((item) => (
            <Text key={item.id} style={styles.line}>
              {item.doctorName ?? 'Doctor'} · {humanizeStatus(item.status)}
            </Text>
          ))}
        </Related>
        <Related title="Health" href={undefined} loading={health.isPending} error={health.isError} empty={!health.data?.items.length}>
          {(health.data?.items ?? []).map((item) => (
            <Text key={item.id} style={styles.line}>
              {item.providerName ?? 'Record'} · {item.notes ?? 'No notes'}
            </Text>
          ))}
        </Related>
        <Related title="Membership" href="/(admin)/memberships" loading={membership.isPending} error={membership.isError} empty={!membership.data}>
          {membership.data ? (
            <>
              <Text style={styles.line}>
                {membership.data.planName} · {humanizeStatus(membership.data.status)}
              </Text>
              {(usage.data ?? []).map((item) => (
                <Text key={item.benefitId} style={styles.line}>
                  {item.benefitName}: used {item.used}
                  {item.quota != null ? ` of ${item.quota}` : ''}
                  {item.remaining != null ? `, remaining ${item.remaining}` : ''}
                </Text>
              ))}
            </>
          ) : null}
        </Related>
        <Related title="Emergencies" href={`/(admin)/emergencies?seniorId=${id}`} loading={emergencies.isPending} error={emergencies.isError} empty={!emergencies.data?.items.length}>
          {(emergencies.data?.items ?? []).map((item) => (
            <Text key={item.id} style={styles.line}>
              {humanizeStatus(item.status)} · {item.createdAt ? formatLongDate(item.createdAt) : 'No date'}
            </Text>
          ))}
        </Related>
      </AdminQueryView>
    </AdminScreen>
  );
}

export function AdminSeniorCreateScreen() {
  const create = useCreateAdminSenior();
  const [userId, setUserId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  return (
    <AdminScreen title="Create senior" subtitle="Links an existing user account to a senior profile.">
      <TextField label="User ID" value={userId} onChangeText={setUserId} autoCapitalize="none" />
      <TextField label="First name" value={firstName} onChangeText={setFirstName} />
      <TextField label="Last name" value={lastName} onChangeText={setLastName} />
      <TextField label="Date of birth (YYYY-MM-DD)" value={dateOfBirth} onChangeText={setDateOfBirth} />
      <TextField label="Address" value={address} onChangeText={setAddress} />
      <TextField label="Emergency contact" value={emergencyContact} onChangeText={setEmergencyContact} />
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <PrimaryButton
        label="Create senior"
        loading={create.isPending}
        onPress={() => {
          setFormError(null);
          create.mutate(
            { userId, firstName, lastName, dateOfBirth, address, emergencyContact },
            {
              onError: (error) => setFormError(getAdminErrorMessage(error)),
              onSuccess: (senior) => router.replace(`/(admin)/seniors/${senior.id}` as Href),
            },
          );
        }}
      />
    </AdminScreen>
  );
}

function Related({
  title,
  href,
  loading,
  error,
  empty,
  children,
}: {
  title: string;
  href?: string;
  loading: boolean;
  error: boolean;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <View style={styles.related}>
      <View style={styles.relatedHeader}>
        <Text style={styles.relatedTitle}>{title}</Text>
        {href ? (
          <Pressable onPress={() => router.push(href as Href)} accessibilityRole="button" accessibilityLabel={`Open ${title}`}>
            <Text style={styles.link}>Open</Text>
          </Pressable>
        ) : null}
      </View>
      {loading ? <Text style={styles.line}>Loading...</Text> : null}
      {error ? <Text style={styles.line}>Unavailable</Text> : null}
      {!loading && !error && empty ? <Text style={styles.line}>None on file.</Text> : children}
    </View>
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
    marginTop: spacing.xs,
  },
  related: {
    marginBottom: spacing.xl,
  },
  relatedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: minTouchSize,
  },
  relatedTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  link: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  error: {
    ...typography.caption,
    color: colors.emergency,
    marginBottom: spacing.md,
  },
});
