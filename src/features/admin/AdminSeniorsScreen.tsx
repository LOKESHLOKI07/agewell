import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { ConfirmDialog, PrimaryButton, PremiumCard, StatusPill, TextField, statusToneFromLabel } from '@/components';
import { colors, minTouchSize, radius, spacing, typography } from '@/constants/theme';
import { formatLongDate, formatRelativeDay, formatTime, toDisplayDate } from '@/utils/date';
import { AdminCollection } from './components/AdminCollection';
import { AdminRowIconActions, AdminSelectCheckbox, AdminSelectionToolbar } from './components/AdminListActions';
import { AdminPagination } from './components/AdminPagination';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { AdminSearchPicker } from './components/AdminSearchPicker';
import { deleteAdminSenior, updateAdminUser } from './api';
import { useDeletePeopleRecords } from './hooks/useDeletePeopleRecords';
import {
  useAdminAccess,
  useAdminAppointments,
  useAdminCurrentMembership,
  useAdminEmergencies,
  useAdminFamilies,
  useAdminMedicalRecords,
  useAdminMembershipUsage,
  useAdminSenior,
  useAdminSeniors,
  useAdminUser,
  useAdminUsers,
  useAdminVisits,
  useCreateAdminSenior,
  useGrantAdminAccess,
  useRevokeAdminAccess,
  useUpdateAdminSenior,
} from './hooks';
import { adminFamilyDisplay, adminSeniorDisplay, getAdminErrorMessage, getSectionState, humanizeStatus } from './selectors';
import type { AdminSenior } from './types';
import { ADMIN_PAGE_SIZE } from './types';

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

  const selection = useDeletePeopleRecords(`${offset}|${search}`, deleteAdminSenior);
  const pageIds = items.map((item) => item.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selection.selectedIds.includes(id));

  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: items.length === 0,
  });

  return (
    <AdminScreen
      title="Seniors"
      subtitle="Edit opens registration profile fields. Delete removes the senior record and login account."
      actions={
        <PrimaryButton label="Create senior" fullWidth={false} onPress={() => router.push('/(admin)/seniors/new' as Href)} />
      }
    >
      <TextField label="Search name or email" value={search} onChangeText={setSearch} />
      {selection.actionError ? <Text style={styles.error}>{selection.actionError}</Text> : null}
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
          columns={[
            {
              key: 'select',
              label: 'Select',
              flex: 0.45,
              header: (
                <AdminSelectCheckbox
                  checked={allSelected}
                  label="Select all seniors on this page"
                  onPress={() => selection.toggleAll(pageIds)}
                />
              ),
              render: (item: AdminSenior) => (
                <AdminSelectCheckbox
                  checked={selection.selectedIds.includes(item.id)}
                  label={`Select ${adminSeniorDisplay(item)}`}
                  onPress={() => selection.toggleOne(item.id)}
                />
              ),
            },
            { key: 'name', label: 'Name', flex: 1.2, render: (item: AdminSenior) => <Text style={cell}>{adminSeniorDisplay(item)}</Text> },
            { key: 'email', label: 'Email', flex: 1.3, render: (item) => <Text style={cell}>{item.email ?? 'Not on file'}</Text> },
            {
              key: 'status',
              label: 'Account',
              render: (item) => <Text style={cell}>{item.accountStatus ? humanizeStatus(item.accountStatus) : '—'}</Text>,
            },
            { key: 'contact', label: 'Emergency contact', render: (item) => <Text style={cell}>{item.emergencyContact}</Text> },
            {
              key: 'actions',
              label: 'Actions',
              flex: 1.1,
              render: (item) => (
                <AdminRowIconActions
                  editLabel={`Edit ${adminSeniorDisplay(item)}`}
                  viewLabel={`View ${adminSeniorDisplay(item)}`}
                  deleteLabel={`Delete ${adminSeniorDisplay(item)}`}
                  onEdit={() => router.push(`/(admin)/seniors/${item.id}?edit=1` as Href)}
                  onView={() => router.push(`/(admin)/seniors/${item.id}` as Href)}
                  onDelete={() => selection.requestDeleteOne(item.id, adminSeniorDisplay(item))}
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
        title="Delete this senior?"
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
        title="Delete selected seniors?"
        message={`${selection.selectedIds.length} senior record(s) and their login accounts will be permanently removed.`}
        confirmLabel={selection.busy ? 'Working…' : 'Delete selected'}
        onCancel={() => selection.setBulkDelete(false)}
        onConfirm={() => {
          void selection.deleteRecords(selection.selectedIds);
        }}
      />
    </AdminScreen>
  );
}

export function AdminSeniorDetailScreen() {
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const query = useAdminSenior(id);
  const user = useAdminUser(query.data?.userId);
  const visits = useAdminVisits({ seniorId: id, limit: 20, offset: 0 });
  const access = useAdminAccess({ seniorId: id, limit: 50, offset: 0 });
  const families = useAdminFamilies({ limit: 100, offset: 0 });
  const appointments = useAdminAppointments({ seniorId: id, limit: 5, offset: 0 });
  const health = useAdminMedicalRecords(id);
  const membership = useAdminCurrentMembership(id);
  const usage = useAdminMembershipUsage(id);
  const emergencies = useAdminEmergencies({ seniorId: id, limit: 5, offset: 0 });
  const update = useUpdateAdminSenior(id ?? '');
  const grant = useGrantAdminAccess();
  const revoke = useRevokeAdminAccess();

  const [editing, setEditing] = useState(edit === '1');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [accountStatus, setAccountStatus] = useState('ACTIVE');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingFamilyIds, setPendingFamilyIds] = useState<string[]>([]);
  const [confirmGrant, setConfirmGrant] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  useEffect(() => {
    if (edit === '1') setEditing(true);
  }, [edit]);

  useEffect(() => {
    if (query.data) {
      setFirstName(query.data.firstName);
      setLastName(query.data.lastName);
      setDateOfBirth(toDisplayDate(query.data.dateOfBirth));
      setAddress(query.data.address);
      setEmergencyContact(query.data.emergencyContact);
      setEmail(query.data.email ?? '');
      setPhone(query.data.phone ?? '');
      setAccountStatus(query.data.accountStatus ?? user.data?.accountStatus ?? 'ACTIVE');
    }
  }, [query.data, user.data?.accountStatus]);

  const linkedFamilyIds = useMemo(
    () => new Set((access.data?.items ?? []).map((row) => row.familyId)),
    [access.data?.items],
  );

  const familyOptions = useMemo(
    () =>
      (families.data?.items ?? []).map((family) => ({
        id: family.id,
        title: adminFamilyDisplay(family),
        subtitle: family.relationship ?? family.userId,
      })),
    [families.data?.items],
  );

  const careAssociatesOnVisits = useMemo(() => {
    const names = new Set<string>();
    for (const visit of visits.data?.items ?? []) {
      if (visit.careManagerName) names.add(visit.careManagerName);
    }
    return names.size;
  }, [visits.data?.items]);

  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: query.isSuccess && !query.data,
  });

  return (
    <AdminScreen
      title="Senior Details"
      subtitle="Registration profile fields can be edited below. Family access and visits stay on this page."
      backHref="/(admin)/seniors"
    >
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading senior..."
        emptyTitle="Senior not found"
        emptyMessage="This senior is not in AgeWell."
      >
        {query.data ? (
          <PremiumCard style={styles.card}>
            <View style={styles.headerRow}>
              <View style={styles.flex}>
                <Text style={styles.name}>{adminSeniorDisplay(query.data)}</Text>
                <Text style={styles.line}>Senior</Text>
              </View>
              <StatusPill
                label={query.data.accountStatus ? humanizeStatus(query.data.accountStatus) : 'Active'}
                tone={statusToneFromLabel(query.data.accountStatus ?? 'ACTIVE')}
              />
            </View>
            {!editing ? (
              <>
                <Text style={styles.line}>Email: {query.data.email ?? 'Not on file'}</Text>
                <Text style={styles.line}>Phone: {query.data.phone ?? user.data?.phone ?? 'Not on file'}</Text>
                <Text style={styles.line}>Date of birth: {formatLongDate(query.data.dateOfBirth)}</Text>
                <Text style={styles.line}>Address: {query.data.address}</Text>
                <Text style={styles.line}>Emergency contact: {query.data.emergencyContact}</Text>
                <PrimaryButton label="Edit Profile" onPress={() => setEditing(true)} />
              </>
            ) : (
              <>
                <Text style={styles.formHint}>Same fields collected at senior registration (password is not shown).</Text>
                <TextField label="First name" value={firstName} onChangeText={setFirstName} />
                <TextField label="Last name" value={lastName} onChangeText={setLastName} />
                <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                <TextField label="Date of birth (DD-MM-YYYY)" value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="10-03-1952" />
                <TextField label="Address" value={address} onChangeText={setAddress} />
                <TextField label="Emergency contact" value={emergencyContact} onChangeText={setEmergencyContact} />
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
                      { firstName, lastName, dateOfBirth, address, emergencyContact, email, phone },
                      {
                        onError: (error) => {
                          setSaving(false);
                          setFormError(getAdminErrorMessage(error));
                        },
                        onSuccess: async () => {
                          try {
                            if (query.data.userId && accountStatus.trim()) {
                              await updateAdminUser(query.data.userId, {
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
                      setFirstName(query.data.firstName);
                      setLastName(query.data.lastName);
                      setDateOfBirth(toDisplayDate(query.data.dateOfBirth));
                      setAddress(query.data.address);
                      setEmergencyContact(query.data.emergencyContact);
                      setEmail(query.data.email ?? '');
                      setPhone(query.data.phone ?? '');
                      setAccountStatus(query.data.accountStatus ?? user.data?.accountStatus ?? 'ACTIVE');
                    }
                  }}
                />
              </>
            )}
          </PremiumCard>
        ) : null}

        <PremiumCard style={styles.card}>
          <Text style={styles.section}>Family Access</Text>
          <Text style={styles.line}>
            {(access.data?.items.length ?? 0)} Authorized Family Member{(access.data?.items.length ?? 0) === 1 ? '' : 's'}
          </Text>
          <AdminQueryView
            state={getSectionState({
              isPending: access.isPending,
              isError: access.isError,
              isEmpty: (access.data?.items.length ?? 0) === 0,
            })}
            error={access.error}
            onRetry={() => void access.refetch()}
            loadingMessage="Loading family access..."
            emptyTitle="No family access"
            emptyMessage="Grant access to link family members through family_senior_access."
            errorKind="access"
          >
            {(access.data?.items ?? []).map((row) => (
              <View key={row.id} style={styles.rowCard}>
                <Text style={styles.rowTitle}>{row.familyName ?? row.familyId}</Text>
                <Text style={styles.line}>{row.familyEmail ?? 'Email not on file'}</Text>
                <PrimaryButton label="Remove Access" onPress={() => setRevokeId(row.id)} />
              </View>
            ))}
          </AdminQueryView>
          <AdminSearchPicker
            label="Add Family Member"
            multiple
            options={familyOptions}
            values={pendingFamilyIds}
            disabledIds={[...linkedFamilyIds]}
            loading={families.isPending}
            emptyMessage="No family profiles available."
            confirmLabel="Select family members"
            onChangeMultiple={setPendingFamilyIds}
          />
          <PrimaryButton
            label="Grant Access"
            loading={grant.isPending}
            onPress={() => {
              if (!pendingFamilyIds.length) {
                setFormError('Select at least one family member.');
                return;
              }
              setFormError(null);
              setConfirmGrant(true);
            }}
          />
          {formError ? <Text style={styles.error}>{formError}</Text> : null}
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.section}>Care / Visits</Text>
          <Text style={styles.line}>
            {(visits.data?.items.length ?? 0)} visits · {careAssociatesOnVisits} Care Associates (visit-based)
          </Text>
          <AdminQueryView
            state={getSectionState({
              isPending: visits.isPending,
              isError: visits.isError,
              isEmpty: (visits.data?.items.length ?? 0) === 0,
            })}
            error={visits.error}
            onRetry={() => void visits.refetch()}
            loadingMessage="Loading visits..."
            emptyTitle="No visits"
            emptyMessage="Create a visit to assign a Care Associate for a specific date/time."
          >
            {(visits.data?.items ?? []).map((visit) => (
              <View key={visit.id} style={styles.rowCard}>
                <Text style={styles.rowTitle}>{visit.careManagerName ?? 'Unassigned'}</Text>
                <Text style={styles.line}>
                  Employee ID: {visit.employeeId ?? 'Not on file'}
                </Text>
                <Text style={styles.line}>
                  {visit.scheduledAt
                    ? `${formatRelativeDay(visit.scheduledAt)} · ${formatTime(visit.scheduledAt)}`
                    : 'Schedule not set'}
                </Text>
                <Text style={styles.line}>{humanizeStatus(visit.status)} · Assigned to visit</Text>
                <PrimaryButton label="View Visit" onPress={() => router.push(`/(admin)/visits/${visit.id}` as Href)} />
              </View>
            ))}
          </AdminQueryView>
          <PrimaryButton
            label="Create Visit"
            onPress={() => router.push(`/(admin)/visits/new?seniorId=${id}` as Href)}
          />
        </PremiumCard>

        <Related title="Health" loading={health.isPending} error={health.isError} empty={!health.data?.items.length}>
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
                </Text>
              ))}
            </>
          ) : null}
        </Related>
        <Related title="Appointments" href={`/(admin)/appointments?seniorId=${id}`} loading={appointments.isPending} error={appointments.isError} empty={!appointments.data?.items.length}>
          {(appointments.data?.items ?? []).map((item) => (
            <Text key={item.id} style={styles.line}>
              {item.doctorName ?? 'Doctor'} · {humanizeStatus(item.status)}
            </Text>
          ))}
        </Related>
        <Related title="Emergencies" href={`/(admin)/emergencies?seniorId=${id}`} loading={emergencies.isPending} error={emergencies.isError} empty={!emergencies.data?.items.length}>
          {(emergencies.data?.items ?? []).map((item) => (
            <Text key={item.id} style={styles.line}>
              {humanizeStatus(item.status)} · {item.createdAt ? formatLongDate(item.createdAt) : 'No date'}
            </Text>
          ))}
        </Related>
      </AdminQueryView>

      <ConfirmDialog
        visible={confirmGrant}
        title="Grant family access?"
        message="Selected family members will gain authorized access to this senior."
        confirmLabel="Grant Access"
        onCancel={() => setConfirmGrant(false)}
        onConfirm={() => {
          setConfirmGrant(false);
          void (async () => {
            try {
              for (const familyId of pendingFamilyIds) {
                await grant.mutateAsync({ familyId, seniorId: id as string });
              }
              setPendingFamilyIds([]);
            } catch (error) {
              setFormError(getAdminErrorMessage(error, 'access'));
            }
          })();
        }}
      />
      <ConfirmDialog
        visible={Boolean(revokeId)}
        title="Revoke family access?"
        message="This family member will lose authorized access to this senior."
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

export function AdminSeniorCreateScreen() {
  const create = useCreateAdminSenior();
  const users = useAdminUsers({ limit: 100, offset: 0, role: 'SENIOR' });
  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
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
    <AdminScreen title="Create senior" subtitle="Links an existing SENIOR user account to a senior profile.">
      <AdminSearchPicker
        label="SENIOR user"
        options={userOptions}
        value={userId}
        loading={users.isPending}
        emptyMessage="No SENIOR users on this page. Paste a User ID below if needed."
        onChange={setUserId}
      />
      <TextField label="Or paste User ID" value={userId ?? ''} onChangeText={setUserId} autoCapitalize="none" />
      <TextField label="First name" value={firstName} onChangeText={setFirstName} />
      <TextField label="Last name" value={lastName} onChangeText={setLastName} />
      <TextField label="Date of birth (DD-MM-YYYY)" value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="10-03-1952" />
      <TextField label="Address" value={address} onChangeText={setAddress} />
      <TextField label="Emergency contact" value={emergencyContact} onChangeText={setEmergencyContact} />
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <PrimaryButton
        label="Create senior"
        loading={create.isPending}
        onPress={() => {
          if (!userId) {
            setFormError('Select a user account.');
            return;
          }
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
    marginBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  flex: {
    flex: 1,
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
    marginVertical: spacing.md,
  },
});
