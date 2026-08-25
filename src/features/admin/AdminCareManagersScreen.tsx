import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { PrimaryButton, TextField } from '@/components';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { AdminCollection } from './components/AdminCollection';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { useAdminCareManager, useAdminCareManagers, useCreateAdminCareManager, useUpdateAdminCareManager } from './hooks';
import { adminCareManagerDisplay, getAdminErrorMessage, getSectionState, humanizeStatus } from './selectors';
import type { AdminCareManager } from './types';

export function AdminCareManagersScreen() {
  const query = useAdminCareManagers();
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: (query.data?.length ?? 0) === 0,
  });

  return (
    <AdminScreen
      title="Care Managers"
      subtitle="Assignment still uses visits.care_manager_id."
      actions={<PrimaryButton label="Create care manager" onPress={() => router.push('/(admin)/care-managers/new' as Href)} />}
    >
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading care managers..."
        emptyTitle="No care managers"
        emptyMessage="No care manager records are on file."
        errorKind="care"
      >
        <AdminCollection
          items={query.data ?? []}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) => `${adminCareManagerDisplay(item)}, ${item.employeeId ?? 'no employee ID'}`}
          onPress={(item) => router.push(`/(admin)/care-managers/${item.id}` as Href)}
          columns={[
            { key: 'name', label: 'Name', render: (item: AdminCareManager) => <Text style={cell}>{adminCareManagerDisplay(item)}</Text> },
            { key: 'employee', label: 'Employee ID', render: (item) => <Text style={cell}>{item.employeeId ?? 'Not on file'}</Text> },
            { key: 'skills', label: 'Skills', render: (item) => <Text style={cell}>{item.skills ?? 'Not on file'}</Text> },
            { key: 'status', label: 'Status', render: (item) => <Text style={cell}>{item.status ? humanizeStatus(item.status) : 'Not on file'}</Text> },
          ]}
        />
      </AdminQueryView>
    </AdminScreen>
  );
}

export function AdminCareManagerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useAdminCareManager(id);
  const update = useUpdateAdminCareManager(id ?? '');
  const [employeeId, setEmployeeId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [skills, setSkills] = useState('');
  const [status, setStatus] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (query.data) {
      setEmployeeId(query.data.employeeId ?? '');
      setFirstName(query.data.firstName ?? '');
      setLastName(query.data.lastName ?? '');
      setSkills(query.data.skills ?? '');
      setStatus(query.data.status ?? '');
    }
  }, [query.data]);

  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: query.isSuccess && !query.data,
  });

  return (
    <AdminScreen title="Care Manager" subtitle="Edit the existing care manager fields only.">
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading care manager..."
        emptyTitle="Care manager not found"
        emptyMessage="This care manager is not in AgeWell."
        errorKind="care"
      >
        {query.data ? (
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.name}>{adminCareManagerDisplay(query.data)}</Text>
            <Text style={styles.line}>User ID: {query.data.userId ?? 'Not on file'}</Text>
            <TextField label="Employee ID" value={employeeId} onChangeText={setEmployeeId} />
            <TextField label="First name" value={firstName} onChangeText={setFirstName} />
            <TextField label="Last name" value={lastName} onChangeText={setLastName} />
            <TextField label="Skills" value={skills} onChangeText={setSkills} />
            <TextField label="Status" value={status} onChangeText={setStatus} />
            {formError ? <Text style={styles.error}>{formError}</Text> : null}
            <PrimaryButton
              label="Save changes"
              loading={update.isPending}
              onPress={() => {
                setFormError(null);
                update.mutate(
                  { employeeId, firstName, lastName, skills, status },
                  { onError: (error) => setFormError(getAdminErrorMessage(error, 'care')) },
                );
              }}
            />
          </View>
        ) : null}
      </AdminQueryView>
    </AdminScreen>
  );
}

export function AdminCareManagerCreateScreen() {
  const create = useCreateAdminCareManager();
  const [userId, setUserId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [skills, setSkills] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [formError, setFormError] = useState<string | null>(null);

  return (
    <AdminScreen title="Create care manager" subtitle="employee_id must be unique.">
      <TextField label="User ID" value={userId} onChangeText={setUserId} autoCapitalize="none" />
      <TextField label="Employee ID" value={employeeId} onChangeText={setEmployeeId} />
      <TextField label="First name" value={firstName} onChangeText={setFirstName} />
      <TextField label="Last name" value={lastName} onChangeText={setLastName} />
      <TextField label="Skills" value={skills} onChangeText={setSkills} />
      <TextField label="Status" value={status} onChangeText={setStatus} />
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <PrimaryButton
        label="Create care manager"
        loading={create.isPending}
        onPress={() => {
          setFormError(null);
          create.mutate(
            { userId, employeeId, firstName, lastName, skills, status },
            {
              onError: (error) => setFormError(getAdminErrorMessage(error, 'care')),
              onSuccess: (row) => router.replace(`/(admin)/care-managers/${row.id}` as Href),
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
  },
  name: {
    ...typography.subtitle,
    color: colors.text,
  },
  line: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  error: {
    ...typography.caption,
    color: colors.emergency,
    marginBottom: spacing.md,
  },
});
