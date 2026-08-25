import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { ConfirmDialog, PrimaryButton, PremiumCard, StatusPill, TextField, statusToneFromLabel } from '@/components';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { formatRelativeDay, formatTime } from '@/utils/date';
import { AdminCollection } from './components/AdminCollection';
import { AdminRowIconActions, AdminSelectCheckbox, AdminSelectionToolbar } from './components/AdminListActions';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { AdminSearchPicker } from './components/AdminSearchPicker';
import { deleteAdminCareManager, updateAdminUser } from './api';
import { useDeletePeopleRecords } from './hooks/useDeletePeopleRecords';
import {
  useAdminCareManager,
  useAdminCareManagers,
  useAdminUser,
  useAdminUsers,
  useAdminVisits,
  useApproveAdminCareManager,
  useCreateAdminCareManager,
  useUpdateAdminCareManager,
} from './hooks';
import { adminCareManagerDisplay, getAdminErrorMessage, getSectionState, humanizeStatus } from './selectors';
import type { AdminCareManager } from './types';

export function AdminCareManagersScreen() {
  const query = useAdminCareManagers();
  const approve = useApproveAdminCareManager();
  const items = query.data ?? [];
  const selection = useDeletePeopleRecords('care', deleteAdminCareManager);
  const pageIds = items.map((item) => item.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selection.selectedIds.includes(id));

  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: items.length === 0,
  });

  return (
    <AdminScreen
      title="Care Associates"
      subtitle="Edit opens registration profile fields. Delete removes the care associate record and login account. Approve PENDING applicants before visits."
      actions={
        <PrimaryButton
          label="Create care associate"
          fullWidth={false}
          onPress={() => router.push('/(admin)/care-managers/new' as Href)}
        />
      }
    >
      {selection.actionError ? <Text style={styles.error}>{selection.actionError}</Text> : null}
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading care associates..."
        emptyTitle="No care associates"
        emptyMessage="No care associate records are on file."
        errorKind="care"
      >
        <AdminCollection
          items={items}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) => `${adminCareManagerDisplay(item)}, ${item.employeeId ?? 'no employee ID'}`}
          columns={[
            {
              key: 'select',
              label: 'Select',
              flex: 0.45,
              header: (
                <AdminSelectCheckbox
                  checked={allSelected}
                  label="Select all care associates"
                  onPress={() => selection.toggleAll(pageIds)}
                />
              ),
              render: (item: AdminCareManager) => (
                <AdminSelectCheckbox
                  checked={selection.selectedIds.includes(item.id)}
                  label={`Select ${adminCareManagerDisplay(item)}`}
                  onPress={() => selection.toggleOne(item.id)}
                />
              ),
            },
            {
              key: 'name',
              label: 'Name',
              flex: 1.2,
              render: (item: AdminCareManager) => <Text style={cell}>{adminCareManagerDisplay(item)}</Text>,
            },
            { key: 'employee', label: 'Employee ID', render: (item) => <Text style={cell}>{item.employeeId ?? 'Not on file'}</Text> },
            { key: 'skills', label: 'Skills', render: (item) => <Text style={cell}>{item.skills ?? 'Not on file'}</Text> },
            {
              key: 'status',
              label: 'Status',
              render: (item) => <Text style={cell}>{item.status ? humanizeStatus(item.status) : 'Not on file'}</Text>,
            },
            {
              key: 'actions',
              label: 'Actions',
              flex: 1.4,
              render: (item) => (
                <View style={styles.actionsCell}>
                  <AdminRowIconActions
                    editLabel={`Edit ${adminCareManagerDisplay(item)}`}
                    viewLabel={`View ${adminCareManagerDisplay(item)}`}
                    deleteLabel={`Delete ${adminCareManagerDisplay(item)}`}
                    onEdit={() => router.push(`/(admin)/care-managers/${item.id}?edit=1` as Href)}
                    onView={() => router.push(`/(admin)/care-managers/${item.id}` as Href)}
                    onDelete={() => selection.requestDeleteOne(item.id, adminCareManagerDisplay(item))}
                  />
                  {(item.status ?? '').toUpperCase() === 'PENDING' ? (
                    <PrimaryButton
                      label="Approve"
                      fullWidth={false}
                      loading={approve.isPending}
                      onPress={() => approve.mutate({ id: item.id, status: 'ACTIVE' })}
                    />
                  ) : null}
                </View>
              ),
            },
          ]}
          headerLeading={
            <AdminSelectionToolbar
              allSelected={allSelected}
              selectedCount={selection.selectedIds.length}
              onToggleAll={() => selection.toggleAll(pageIds)}
              onDeleteSelected={() => selection.setBulkDelete(true)}
              onClear={selection.clear}
            />
          }
        />
      </AdminQueryView>

      <ConfirmDialog
        visible={Boolean(selection.deleteId)}
        title="Delete this care associate?"
        message={
          selection.deleteId
            ? `${selection.deleteLabel} and their login account will be permanently removed.`
            : ''
        }
        confirmLabel={selection.busy ? 'Working…' : 'Delete record'}
        onCancel={() => selection.setDeleteId(null)}
        onConfirm={() => {
          if (selection.deleteId) void selection.deleteRecords([selection.deleteId]);
        }}
      />
      <ConfirmDialog
        visible={selection.bulkDelete}
        title="Delete selected care associates?"
        message={`${selection.selectedIds.length} care associate record(s) and their login accounts will be permanently removed.`}
        confirmLabel={selection.busy ? 'Working…' : 'Delete selected'}
        onCancel={() => selection.setBulkDelete(false)}
        onConfirm={() => {
          void selection.deleteRecords(selection.selectedIds);
        }}
      />
    </AdminScreen>
  );
}

export function AdminCareManagerDetailScreen() {
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const query = useAdminCareManager(id);
  const user = useAdminUser(query.data?.userId ?? undefined);
  const visits = useAdminVisits({ careManagerId: id, limit: 50, offset: 0 });
  const update = useUpdateAdminCareManager(id ?? '');
  const [employeeId, setEmployeeId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [accountStatus, setAccountStatus] = useState('ACTIVE');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [languages, setLanguages] = useState('');
  const [availability, setAvailability] = useState('');
  const [status, setStatus] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [editing, setEditing] = useState(edit === '1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (edit === '1') setEditing(true);
  }, [edit]);

  useEffect(() => {
    if (query.data) {
      setEmployeeId(query.data.employeeId ?? '');
      setFirstName(query.data.firstName ?? '');
      setLastName(query.data.lastName ?? '');
      setSkills(query.data.skills ?? '');
      setExperience(query.data.experience ?? '');
      setLanguages(query.data.languages ?? '');
      setAvailability(query.data.availability ?? '');
      setStatus(query.data.status ?? '');
    }
  }, [query.data]);

  useEffect(() => {
    if (user.data) {
      setEmail(user.data.email ?? '');
      setPhone(user.data.phone ?? '');
      setAccountStatus(user.data.accountStatus ?? 'ACTIVE');
    }
  }, [user.data]);

  const seniorsViaVisits = useMemo(() => {
    const map = new Map<string, string>();
    for (const visit of visits.data?.items ?? []) {
      map.set(visit.seniorId, visit.seniorId);
    }
    return map.size;
  }, [visits.data?.items]);

  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: query.isSuccess && !query.data,
  });

  return (
    <AdminScreen
      title="Care Associate Details"
      subtitle="Registration profile fields can be edited below. Assignments are visit-based."
      backHref="/(admin)/care-managers"
    >
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading care associate..."
        emptyTitle="Care associate not found"
        emptyMessage="This care associate is not in AgeWell."
        errorKind="care"
      >
        {query.data ? (
          <PremiumCard style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.name}>{adminCareManagerDisplay(query.data)}</Text>
              <StatusPill
                label={query.data.status ? humanizeStatus(query.data.status) : 'Unknown'}
                tone={statusToneFromLabel(query.data.status ?? '')}
              />
            </View>
            {!editing ? (
              <>
                <Text style={styles.line}>Email: {user.data?.email ?? 'Not on file'}</Text>
                <Text style={styles.line}>Phone: {user.data?.phone ?? 'Not on file'}</Text>
                <Text style={styles.line}>Employee ID: {query.data.employeeId ?? 'Not on file'}</Text>
                <Text style={styles.line}>Skills: {query.data.skills ?? 'Not on file'}</Text>
                <Text style={styles.line}>Experience: {query.data.experience ?? 'Not on file'}</Text>
                <Text style={styles.line}>Languages: {query.data.languages ?? 'Not on file'}</Text>
                <Text style={styles.line}>Availability: {query.data.availability ?? 'Not on file'}</Text>
                <Text style={styles.line}>
                  Account status: {user.data?.accountStatus ? humanizeStatus(user.data.accountStatus) : '—'}
                </Text>
                <PrimaryButton label="Edit Profile" onPress={() => setEditing(true)} />
              </>
            ) : (
              <>
                <Text style={styles.formHint}>Same fields collected at care-associate registration (password is not shown).</Text>
                <TextField label="First name" value={firstName} onChangeText={setFirstName} />
                <TextField label="Last name" value={lastName} onChangeText={setLastName} />
                <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                <TextField label="Employee ID" value={employeeId} onChangeText={setEmployeeId} />
                <TextField label="Skills" value={skills} onChangeText={setSkills} />
                <TextField label="Experience" value={experience} onChangeText={setExperience} />
                <TextField label="Languages" value={languages} onChangeText={setLanguages} />
                <TextField label="Availability" value={availability} onChangeText={setAvailability} />
                <TextField label="Care status (PENDING / ACTIVE / …)" value={status} onChangeText={setStatus} />
                <TextField
                  label="Account status (ACTIVE / DISABLED)"
                  value={accountStatus}
                  onChangeText={setAccountStatus}
                  autoCapitalize="characters"
                />
                {formError ? <Text style={styles.error}>{formError}</Text> : null}
                <PrimaryButton
                  label="Save registration details"
                  loading={saving || update.isPending}
                  onPress={() => {
                    if (!query.data) return;
                    setFormError(null);
                    setSaving(true);
                    update.mutate(
                      { employeeId, firstName, lastName, skills, experience, languages, availability, status },
                      {
                        onError: (error) => {
                          setSaving(false);
                          setFormError(getAdminErrorMessage(error, 'care'));
                        },
                        onSuccess: async () => {
                          try {
                            if (query.data.userId) {
                              await updateAdminUser(query.data.userId, {
                                email: email.trim(),
                                phone: phone.trim(),
                                accountStatus: accountStatus.trim().toUpperCase(),
                              });
                            }
                            setEditing(false);
                          } catch (error) {
                            setFormError(getAdminErrorMessage(error, 'user'));
                          } finally {
                            setSaving(false);
                          }
                        },
                      },
                    );
                  }}
                />
                <PrimaryButton
                  label="Cancel"
                  onPress={() => {
                    setEditing(false);
                    setFormError(null);
                    if (query.data) {
                      setEmployeeId(query.data.employeeId ?? '');
                      setFirstName(query.data.firstName ?? '');
                      setLastName(query.data.lastName ?? '');
                      setSkills(query.data.skills ?? '');
                      setExperience(query.data.experience ?? '');
                      setLanguages(query.data.languages ?? '');
                      setAvailability(query.data.availability ?? '');
                      setStatus(query.data.status ?? '');
                    }
                    if (user.data) {
                      setEmail(user.data.email ?? '');
                      setPhone(user.data.phone ?? '');
                      setAccountStatus(user.data.accountStatus ?? 'ACTIVE');
                    }
                  }}
                />
              </>
            )}
          </PremiumCard>
        ) : null}

        <PremiumCard style={styles.card}>
          <Text style={styles.section}>Assigned Visits</Text>
          <Text style={styles.line}>{seniorsViaVisits} seniors served through visits</Text>
          <AdminQueryView
            state={getSectionState({
              isPending: visits.isPending,
              isError: visits.isError,
              isEmpty: (visits.data?.items.length ?? 0) === 0,
            })}
            error={visits.error}
            onRetry={() => void visits.refetch()}
            loadingMessage="Loading visits..."
            emptyTitle="No assigned visits"
            emptyMessage="Create a visit to assign this Care Associate to a senior."
          >
            {(visits.data?.items ?? []).map((visit) => (
              <View key={visit.id} style={styles.rowCard}>
                <Text style={styles.rowTitle}>Senior: {visit.seniorId}</Text>
                <Text style={styles.line}>
                  {visit.scheduledAt
                    ? `${formatRelativeDay(visit.scheduledAt)} · ${formatTime(visit.scheduledAt)}`
                    : 'Schedule not set'}
                </Text>
                <Text style={styles.line}>Visit status: {humanizeStatus(visit.status)}</Text>
                <PrimaryButton label="View Visit" onPress={() => router.push(`/(admin)/visits/${visit.id}` as Href)} />
              </View>
            ))}
          </AdminQueryView>
          <PrimaryButton
            label="Create Visit"
            onPress={() => router.push(`/(admin)/visits/new?careManagerId=${id}` as Href)}
          />
        </PremiumCard>
      </AdminQueryView>
    </AdminScreen>
  );
}

export function AdminCareManagerCreateScreen() {
  const create = useCreateAdminCareManager();
  const users = useAdminUsers({ limit: 100, offset: 0, role: 'CARE_MANAGER' });
  const [userId, setUserId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [languages, setLanguages] = useState('');
  const [availability, setAvailability] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [formError, setFormError] = useState<string | null>(null);
  const userOptions = useMemo(
    () =>
      (users.data?.items ?? []).map((user) => ({
        id: user.id,
        title: user.email,
        subtitle: user.phone,
      })),
    [users.data?.items],
  );

  return (
    <AdminScreen title="Create care associate" subtitle="employee_id must be unique." backHref="/(admin)/care-managers">
      <AdminSearchPicker label="CARE_MANAGER user" options={userOptions} value={userId} loading={users.isPending} onChange={setUserId} />
      <TextField label="Or paste User ID" value={userId ?? ''} onChangeText={setUserId} autoCapitalize="none" />
      <TextField label="Employee ID" value={employeeId} onChangeText={setEmployeeId} />
      <TextField label="First name" value={firstName} onChangeText={setFirstName} />
      <TextField label="Last name" value={lastName} onChangeText={setLastName} />
      <TextField label="Skills" value={skills} onChangeText={setSkills} />
      <TextField label="Experience" value={experience} onChangeText={setExperience} />
      <TextField label="Languages" value={languages} onChangeText={setLanguages} />
      <TextField label="Availability" value={availability} onChangeText={setAvailability} />
      <TextField label="Status" value={status} onChangeText={setStatus} />
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <PrimaryButton
        label="Create care associate"
        loading={create.isPending}
        onPress={() => {
          if (!userId) {
            setFormError('Select a user account.');
            return;
          }
          setFormError(null);
          create.mutate(
            { userId, employeeId, firstName, lastName, skills, experience, languages, availability, status },
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
    marginBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  name: {
    ...typography.subtitle,
    color: colors.text,
  },
  section: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  line: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  formHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  actionsCell: {
    gap: spacing.sm,
  },
  rowCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  rowTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  error: {
    ...typography.caption,
    color: colors.emergency,
    marginBottom: spacing.md,
  },
});
