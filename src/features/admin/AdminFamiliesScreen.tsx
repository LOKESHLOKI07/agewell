import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { ConfirmDialog, PrimaryButton, PremiumCard, TextField } from '@/components';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { formatLongDate } from '@/utils/date';
import { AdminCollection } from './components/AdminCollection';
import { AdminRowIconActions, AdminSelectCheckbox, AdminSelectionToolbar } from './components/AdminListActions';
import { AdminPagination } from './components/AdminPagination';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { AdminSearchPicker } from './components/AdminSearchPicker';
import { deleteAdminFamily, revokeAdminAccess, updateAdminUser } from './api';
import { useDeletePeopleRecords } from './hooks/useDeletePeopleRecords';
import {
  useAdminAccess,
  useAdminFamilies,
  useAdminFamily,
  useAdminSeniors,
  useAdminUser,
  useAdminUsers,
  useCreateAdminFamily,
  useGrantAdminAccess,
  useRevokeAdminAccess,
  useUpdateAdminFamily,
} from './hooks';
import { adminFamilyDisplay, adminSeniorDisplay, getAdminErrorMessage, getSectionState } from './selectors';
import type { FamilyMember } from '@/features/family/types';
import { ADMIN_PAGE_SIZE } from './types';

export function AdminFamiliesScreen() {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const query = useAdminFamilies({ limit: ADMIN_PAGE_SIZE, offset });
  const items = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const rows = query.data?.items ?? [];
    if (!needle) return rows;
    return rows.filter((family) => adminFamilyDisplay(family).toLowerCase().includes(needle));
  }, [query.data?.items, search]);

  const selection = useDeletePeopleRecords(`${offset}|${search}`, deleteAdminFamily);
  const pageIds = items.map((item) => item.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selection.selectedIds.includes(id));

  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: items.length === 0,
  });

  return (
    <AdminScreen
      title="Families"
      subtitle="Edit opens registration profile fields. Delete removes the family record and login account."
      actions={
        <PrimaryButton label="Create family" fullWidth={false} onPress={() => router.push('/(admin)/families/new' as Href)} />
      }
    >
      <TextField label="Search name" value={search} onChangeText={setSearch} />
      {selection.actionError ? <Text style={styles.error}>{selection.actionError}</Text> : null}
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading families..."
        emptyTitle="No families"
        emptyMessage="No family records are on file."
      >
        <AdminCollection
          items={items}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) => adminFamilyDisplay(item)}
          columns={[
            {
              key: 'select',
              label: 'Select',
              flex: 0.45,
              header: (
                <AdminSelectCheckbox
                  checked={allSelected}
                  label="Select all families on this page"
                  onPress={() => selection.toggleAll(pageIds)}
                />
              ),
              render: (item: FamilyMember) => (
                <AdminSelectCheckbox
                  checked={selection.selectedIds.includes(item.id)}
                  label={`Select ${adminFamilyDisplay(item)}`}
                  onPress={() => selection.toggleOne(item.id)}
                />
              ),
            },
            { key: 'name', label: 'Name', flex: 1.2, render: (item: FamilyMember) => <Text style={cell}>{adminFamilyDisplay(item)}</Text> },
            { key: 'rel', label: 'Relationship', render: (item) => <Text style={cell}>{item.relationship ?? '—'}</Text> },
            { key: 'user', label: 'User ID', flex: 1.2, render: (item) => <Text style={cell}>{item.userId}</Text> },
            {
              key: 'actions',
              label: 'Actions',
              flex: 1.1,
              render: (item) => (
                <AdminRowIconActions
                  editLabel={`Edit ${adminFamilyDisplay(item)}`}
                  viewLabel={`View ${adminFamilyDisplay(item)}`}
                  deleteLabel={`Delete ${adminFamilyDisplay(item)}`}
                  onEdit={() => router.push(`/(admin)/families/${item.id}?edit=1` as Href)}
                  onView={() => router.push(`/(admin)/families/${item.id}` as Href)}
                  onDelete={() => selection.requestDeleteOne(item.id, adminFamilyDisplay(item))}
                />
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
        <AdminPagination
          total={query.data?.total ?? 0}
          limit={query.data?.limit ?? ADMIN_PAGE_SIZE}
          offset={query.data?.offset ?? offset}
          onOffsetChange={setOffset}
        />
      </AdminQueryView>

      <ConfirmDialog
        visible={Boolean(selection.deleteId)}
        title="Delete this family member?"
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
        title="Delete selected family members?"
        message={`${selection.selectedIds.length} family record(s) and their login accounts will be permanently removed.`}
        confirmLabel={selection.busy ? 'Working…' : 'Delete selected'}
        onCancel={() => selection.setBulkDelete(false)}
        onConfirm={() => {
          void selection.deleteRecords(selection.selectedIds);
        }}
      />
    </AdminScreen>
  );
}

export function AdminFamilyCreateScreen() {
  const create = useCreateAdminFamily();
  const users = useAdminUsers({ limit: 100, offset: 0, role: 'FAMILY' });
  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [reference, setReference] = useState('');
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
    <AdminScreen title="Create family profile" subtitle="Links an existing FAMILY user. Does not grant senior access.">
      <AdminSearchPicker
        label="FAMILY user"
        options={userOptions}
        value={userId}
        loading={users.isPending}
        onChange={setUserId}
      />
      <TextField label="Or paste User ID" value={userId ?? ''} onChangeText={setUserId} autoCapitalize="none" />
      <TextField label="First name" value={firstName} onChangeText={setFirstName} />
      <TextField label="Last name" value={lastName} onChangeText={setLastName} />
      <TextField label="Relationship" value={relationship} onChangeText={setRelationship} placeholder="Son, Daughter…" />
      <TextField label="Requested senior reference" value={reference} onChangeText={setReference} />
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <PrimaryButton
        label="Create family profile"
        loading={create.isPending}
        onPress={() => {
          if (!userId) {
            setFormError('Select a FAMILY user.');
            return;
          }
          setFormError(null);
          create.mutate(
            {
              userId,
              firstName,
              lastName,
              relationship: relationship || undefined,
              requestedSeniorReference: reference || undefined,
            },
            {
              onError: (error) => setFormError(getAdminErrorMessage(error, 'access')),
              onSuccess: (family) => router.replace(`/(admin)/families/${family.id}` as Href),
            },
          );
        }}
      />
    </AdminScreen>
  );
}

export function AdminFamilyDetailScreen() {
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const query = useAdminFamily(id);
  const user = useAdminUser(query.data?.userId);
  const access = useAdminAccess({ familyId: id, limit: 50, offset: 0 });
  const seniors = useAdminSeniors({ limit: 100, offset: 0 });
  const update = useUpdateAdminFamily(id ?? '');
  const grant = useGrantAdminAccess();
  const revoke = useRevokeAdminAccess();

  const [editing, setEditing] = useState(edit === '1');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [accountStatus, setAccountStatus] = useState('ACTIVE');
  const [relationship, setRelationship] = useState('');
  const [reference, setReference] = useState('');
  const [selectedSeniorId, setSelectedSeniorId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmGrant, setConfirmGrant] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  useEffect(() => {
    if (edit === '1') setEditing(true);
  }, [edit]);

  useEffect(() => {
    if (query.data) {
      setFirstName(query.data.firstName ?? '');
      setLastName(query.data.lastName ?? '');
      setRelationship(query.data.relationship ?? '');
      setReference(query.data.requestedSeniorReference ?? '');
    }
  }, [query.data]);

  useEffect(() => {
    if (user.data) {
      setEmail(user.data.email ?? '');
      setPhone(user.data.phone ?? '');
      setAccountStatus(user.data.accountStatus ?? 'ACTIVE');
    }
  }, [user.data]);

  const linkedSeniorIds = useMemo(
    () => new Set((access.data?.items ?? []).map((row) => row.seniorId)),
    [access.data?.items],
  );

  const seniorOptions = useMemo(
    () =>
      (seniors.data?.items ?? []).map((senior) => ({
        id: senior.id,
        title: adminSeniorDisplay(senior),
        subtitle: senior.email ?? senior.id,
      })),
    [seniors.data?.items],
  );

  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: query.isSuccess && !query.data,
  });

  return (
    <AdminScreen
      title="Family Details"
      subtitle="Registration profile fields can be edited below. Authorized seniors stay on this page."
      backHref="/(admin)/families"
    >
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading family..."
        emptyTitle="Family not found"
        emptyMessage="This family record is not in AgeWell."
      >
        {query.data ? (
          <PremiumCard style={styles.card}>
            <Text style={styles.name}>{adminFamilyDisplay(query.data)}</Text>
            {!editing ? (
              <>
                <Text style={styles.line}>Email: {user.data?.email ?? 'Not on file'}</Text>
                <Text style={styles.line}>Phone: {user.data?.phone ?? 'Not on file'}</Text>
                <Text style={styles.line}>Account status: {user.data?.accountStatus ? humanize(user.data.accountStatus) : '—'}</Text>
                <Text style={styles.line}>Relationship: {query.data.relationship ?? 'Not on file'}</Text>
                <Text style={styles.line}>Requested reference: {query.data.requestedSeniorReference ?? 'None'}</Text>
                <Text style={styles.line}>Created: {query.data.createdAt ? formatLongDate(query.data.createdAt) : 'Not on file'}</Text>
                <PrimaryButton label="Edit Profile" onPress={() => setEditing(true)} />
              </>
            ) : (
              <>
                <Text style={styles.formHint}>Same fields collected at family registration (password is not shown).</Text>
                <TextField label="First name" value={firstName} onChangeText={setFirstName} />
                <TextField label="Last name" value={lastName} onChangeText={setLastName} />
                <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                <TextField label="Relationship" value={relationship} onChangeText={setRelationship} />
                <TextField label="Requested senior reference" value={reference} onChangeText={setReference} />
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
                      {
                        firstName,
                        lastName,
                        relationship: relationship || undefined,
                        requestedSeniorReference: reference || undefined,
                      },
                      {
                        onError: (error) => {
                          setSaving(false);
                          setFormError(getAdminErrorMessage(error));
                        },
                        onSuccess: async () => {
                          try {
                            await updateAdminUser(query.data.userId, {
                              email: email.trim(),
                              phone: phone.trim(),
                              accountStatus: accountStatus.trim().toUpperCase(),
                            });
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
                      setFirstName(query.data.firstName ?? '');
                      setLastName(query.data.lastName ?? '');
                      setRelationship(query.data.relationship ?? '');
                      setReference(query.data.requestedSeniorReference ?? '');
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
          <Text style={styles.section}>Authorized Seniors</Text>
          <AdminQueryView
            state={getSectionState({
              isPending: access.isPending,
              isError: access.isError,
              isEmpty: (access.data?.items.length ?? 0) === 0,
            })}
            error={access.error}
            onRetry={() => void access.refetch()}
            loadingMessage="Loading access..."
            emptyTitle="No authorized seniors"
            emptyMessage="Grant senior access to connect this family member."
            errorKind="access"
          >
            {(access.data?.items ?? []).map((row) => (
              <View key={row.id} style={styles.rowCard}>
                <Text style={styles.rowTitle}>{row.seniorName ?? row.seniorId}</Text>
                <Text style={styles.line}>Senior ID: {row.seniorId}</Text>
                <Text style={styles.line}>{row.seniorEmail ?? 'Email not on file'}</Text>
                <PrimaryButton label="View Senior" onPress={() => router.push(`/(admin)/seniors/${row.seniorId}` as Href)} />
                <PrimaryButton label="Revoke Access" onPress={() => setRevokeId(row.id)} />
              </View>
            ))}
          </AdminQueryView>
          <AdminSearchPicker
            label="Grant Senior Access"
            options={seniorOptions}
            value={selectedSeniorId}
            disabledIds={[...linkedSeniorIds]}
            loading={seniors.isPending}
            emptyMessage="No senior profiles available."
            onChange={setSelectedSeniorId}
          />
          <PrimaryButton
            label="Grant Access"
            loading={grant.isPending}
            onPress={() => {
              if (!selectedSeniorId) {
                setFormError('Select a senior.');
                return;
              }
              setFormError(null);
              setConfirmGrant(true);
            }}
          />
          {formError ? <Text style={styles.error}>{formError}</Text> : null}
        </PremiumCard>
      </AdminQueryView>

      <ConfirmDialog
        visible={confirmGrant}
        title="Grant senior access?"
        message="This family member will gain authorized access to the selected senior."
        confirmLabel="Grant Access"
        onCancel={() => setConfirmGrant(false)}
        onConfirm={() => {
          setConfirmGrant(false);
          if (!selectedSeniorId || !id) return;
          grant.mutate(
            { familyId: id, seniorId: selectedSeniorId },
            {
              onError: (error) => setFormError(getAdminErrorMessage(error, 'access')),
              onSuccess: () => setSelectedSeniorId(null),
            },
          );
        }}
      />
      <ConfirmDialog
        visible={Boolean(revokeId)}
        title="Revoke family access?"
        message="This family member will lose authorized access to that senior."
        confirmLabel="Revoke Access"
        onCancel={() => setRevokeId(null)}
        onConfirm={() => {
          if (revokeId) {
            revoke.mutate(revokeId, {
              onError: (error) => setFormError(getAdminErrorMessage(error, 'access')),
            });
          }
          setRevokeId(null);
        }}
      />
    </AdminScreen>
  );
}

export function AdminAccessScreen() {
  const [offset, setOffset] = useState(0);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [seniorId, setSeniorId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const access = useAdminAccess({ limit: ADMIN_PAGE_SIZE, offset });
  const families = useAdminFamilies({ limit: 100, offset: 0 });
  const seniors = useAdminSeniors({ limit: 100, offset: 0 });
  const grant = useGrantAdminAccess();
  const items = access.data?.items ?? [];
  const selection = useDeletePeopleRecords(`${offset}`, revokeAdminAccess);
  const pageIds = items.map((item) => item.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selection.selectedIds.includes(id));

  const familyOptions = useMemo(
    () =>
      (families.data?.items ?? []).map((family) => ({
        id: family.id,
        title: adminFamilyDisplay(family),
        subtitle: family.relationship ?? family.id,
      })),
    [families.data?.items],
  );
  const seniorOptions = useMemo(
    () =>
      (seniors.data?.items ?? []).map((senior) => ({
        id: senior.id,
        title: adminSeniorDisplay(senior),
        subtitle: senior.email ?? senior.id,
      })),
    [seniors.data?.items],
  );

  const state = getSectionState({
    isPending: access.isPending,
    isError: access.isError,
    isEmpty: items.length === 0,
  });

  return (
    <AdminScreen title="Access" subtitle="Dedicated family ↔ senior relationship management. Delete revokes the relationship.">
      <AdminSearchPicker label="Family Member" options={familyOptions} value={familyId} loading={families.isPending} onChange={setFamilyId} />
      <AdminSearchPicker label="Senior" options={seniorOptions} value={seniorId} loading={seniors.isPending} onChange={setSeniorId} />
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      {selection.actionError ? <Text style={styles.error}>{selection.actionError}</Text> : null}
      <PrimaryButton
        label="Grant Access"
        loading={grant.isPending}
        onPress={() => {
          if (!familyId || !seniorId) {
            setFormError('Select both a family member and a senior.');
            return;
          }
          setFormError(null);
          grant.mutate(
            { familyId, seniorId },
            { onError: (error) => setFormError(getAdminErrorMessage(error, 'access')) },
          );
        }}
      />
      <AdminQueryView
        state={state}
        error={access.error}
        onRetry={() => void access.refetch()}
        loadingMessage="Loading access..."
        emptyTitle="No relationships"
        emptyMessage="Grant access to connect a family member to a senior."
        errorKind="access"
      >
        <AdminCollection
          items={items}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) => `${item.familyName ?? item.familyId} access to ${item.seniorName ?? item.seniorId}`}
          columns={[
            {
              key: 'select',
              label: 'Select',
              flex: 0.45,
              header: (
                <AdminSelectCheckbox
                  checked={allSelected}
                  label="Select all access rows on this page"
                  onPress={() => selection.toggleAll(pageIds)}
                />
              ),
              render: (item) => (
                <AdminSelectCheckbox
                  checked={selection.selectedIds.includes(item.id)}
                  label={`Select access for ${item.familyName ?? item.familyId}`}
                  onPress={() => selection.toggleOne(item.id)}
                />
              ),
            },
            {
              key: 'family',
              label: 'Family',
              render: (item) => <Text style={cell}>{item.familyName ?? item.familyId}</Text>,
            },
            {
              key: 'senior',
              label: 'Senior',
              render: (item) => <Text style={cell}>{item.seniorName ?? item.seniorId}</Text>,
            },
            {
              key: 'created',
              label: 'Created',
              render: (item) => <Text style={cell}>{item.createdAt ? formatLongDate(item.createdAt) : 'Not on file'}</Text>,
            },
            {
              key: 'actions',
              label: 'Actions',
              flex: 1.1,
              render: (item) => (
                <AdminRowIconActions
                  editLabel={`Edit access ${item.id}`}
                  viewLabel={`View access ${item.id}`}
                  deleteLabel={`Delete access for ${item.familyName ?? item.familyId}`}
                  onEdit={() => {
                    setFamilyId(item.familyId);
                    setSeniorId(item.seniorId);
                  }}
                  onView={() => {
                    setFamilyId(item.familyId);
                    setSeniorId(item.seniorId);
                  }}
                  onDelete={() =>
                    selection.requestDeleteOne(
                      item.id,
                      `${item.familyName ?? item.familyId} → ${item.seniorName ?? item.seniorId}`,
                    )
                  }
                />
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
        <AdminPagination
          total={access.data?.total ?? 0}
          limit={access.data?.limit ?? ADMIN_PAGE_SIZE}
          offset={access.data?.offset ?? offset}
          onOffsetChange={setOffset}
        />
      </AdminQueryView>
      <ConfirmDialog
        visible={Boolean(selection.deleteId)}
        title="Delete this access relationship?"
        message={
          selection.deleteId
            ? `${selection.deleteLabel} will be permanently removed.`
            : ''
        }
        confirmLabel={selection.busy ? 'Working…' : 'Delete access'}
        onCancel={() => selection.setDeleteId(null)}
        onConfirm={() => {
          if (selection.deleteId) void selection.deleteRecords([selection.deleteId]);
        }}
      />
      <ConfirmDialog
        visible={selection.bulkDelete}
        title="Delete selected access relationships?"
        message={`${selection.selectedIds.length} access relationship(s) will be permanently removed.`}
        confirmLabel={selection.busy ? 'Working…' : 'Delete selected'}
        onCancel={() => selection.setBulkDelete(false)}
        onConfirm={() => {
          void selection.deleteRecords(selection.selectedIds);
        }}
      />
    </AdminScreen>
  );
}

function humanize(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const cell = { ...typography.body, color: colors.text };

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.xl,
  },
  name: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  section: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.md,
  },
  line: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  formHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
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
