import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { ConfirmDialog, PrimaryButton, StatusPill, TextField, statusToneFromLabel } from '@/components';
import { Avatar, Icon } from '@/components/ui';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { STAFF_KIND_LABELS, STAFF_KINDS, type StaffKind } from '@/features/care/staffKind';
import { AdminFilterChips } from './components/AdminFilterChips';
import { AdminSelectCheckbox, AdminSelectionToolbar } from './components/AdminListActions';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { deleteAdminCareManager } from './api';
import { useDeletePeopleRecords } from './hooks/useDeletePeopleRecords';
import { useAdminCareManagers, useApproveAdminCareManager, useProvisionAdminStaff } from './hooks';
import { ADMIN_STAFF_DEFAULT_PASSWORD } from './staffDefaults';
import { adminCareManagerDisplay, adminStaffKindLabel, getAdminErrorMessage, getSectionState, humanizeStatus } from './selectors';
import type { AdminCareManager } from './types';
import { useAdminLayout } from './useAdminLayout';

export function AdminCareManagersScreen() {
  const { isDesktop } = useAdminLayout();
  const query = useAdminCareManagers();
  const approve = useApproveAdminCareManager();
  const [search, setSearch] = useState('');
  const items = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const rows = query.data ?? [];
    if (!needle) {
      return rows;
    }
    return rows.filter((item) =>
      `${adminCareManagerDisplay(item)} ${item.employeeId ?? ''} ${item.skills ?? ''}`.toLowerCase().includes(needle),
    );
  }, [query.data, search]);
  const selection = useDeletePeopleRecords('care', deleteAdminCareManager);
  const pageIds = items.map((item) => item.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selection.selectedIds.includes(id));
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: items.length === 0,
  });

  return (
    <>
    <AdminScreen
      title="Care Team"
      subtitle="Staff profiles, roles, and visit assignments."
      actions={
        <PrimaryButton
          label="Register staff"
          fullWidth={false}
          onPress={() => router.push('/(admin)/care-managers/new' as Href)}
        />
      }
    >
      <View style={styles.toolbarCard}>
        <TextField label="Search name, employee ID, or skills" value={search} onChangeText={setSearch} />
      </View>
      {selection.actionError ? <Text style={styles.error}>{selection.actionError}</Text> : null}
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading care team..."
        emptyTitle="No care team members"
        emptyMessage="No staff records are on file."
        errorKind="care"
      >
        <AdminSelectionToolbar
          allSelected={allSelected}
          selectedCount={selection.selectedIds.length}
          onToggleAll={() => selection.toggleAll(pageIds)}
          onDeleteSelected={() => selection.setBulkDelete(true)}
          onClear={selection.clear}
        />
        <View style={[styles.grid, isDesktop ? styles.gridDesktop : null]}>
          {items.map((item) => (
            <CareListCard
              key={item.id}
              staff={item}
              selected={selection.selectedIds.includes(item.id)}
              approving={approve.isPending}
              onSelect={() => selection.toggleOne(item.id)}
              onDelete={() => selection.requestDeleteOne(item.id, adminCareManagerDisplay(item))}
              onApprove={() => approve.mutate({ id: item.id, status: 'ACTIVE' })}
            />
          ))}
        </View>
      </AdminQueryView>
    </AdminScreen>
      <ConfirmDialog
        visible={Boolean(selection.deleteId)}
        title="Delete this care team member?"
        message={
          selection.deleteId
            ? `${selection.deleteLabel} and their login account will be permanently removed.`
            : ''
        }
        confirmLabel={selection.busy ? 'Working…' : 'Delete record'}
        busy={selection.busy}
        error={selection.actionError}
        onCancel={() => selection.setDeleteId(null)}
        onConfirm={() => {
          if (selection.deleteId) void selection.deleteRecords([selection.deleteId]);
        }}
      />
      <ConfirmDialog
        visible={selection.bulkDelete}
        title="Delete selected care team members?"
        message={`${selection.selectedIds.length} staff record(s) and their login accounts will be permanently removed.`}
        confirmLabel={selection.busy ? 'Working…' : 'Delete selected'}
        busy={selection.busy}
        error={selection.actionError}
        onCancel={() => selection.setBulkDelete(false)}
        onConfirm={() => {
          void selection.deleteRecords([...selection.selectedIds]);
        }}
      />
    </>
  );
}

function CareListCard({
  staff,
  selected,
  approving,
  onSelect,
  onDelete,
  onApprove,
}: {
  staff: AdminCareManager;
  selected: boolean;
  approving: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onApprove: () => void;
}) {
  const name = adminCareManagerDisplay(staff);
  const pending = (staff.status ?? '').toUpperCase() === 'PENDING';
  return (
    <View style={styles.personCard}>
      <View style={styles.personTop}>
        <AdminSelectCheckbox checked={selected} label={`Select ${name}`} onPress={onSelect} />
        <Pressable
          onPress={() => router.push(`/(admin)/care-managers/${staff.id}` as Href)}
          accessibilityRole="button"
          accessibilityLabel={name}
          style={({ pressed }) => [styles.personMain, pressed ? styles.pressed : null]}
        >
          <Avatar name={name} size={48} />
          <View style={styles.personCopy}>
            <View style={styles.personNameRow}>
              <Text style={styles.personName}>{name}</Text>
              <StatusPill
                label={staff.status ? humanizeStatus(staff.status) : 'Unknown'}
                tone={statusToneFromLabel(staff.status ?? '')}
              />
            </View>
            <Text style={styles.personMeta}>
              {adminStaffKindLabel(staff.staffKind)}
              {staff.employeeId ? ` · ${staff.employeeId}` : ''}
            </Text>
          </View>
        </Pressable>
      </View>
      <Text style={styles.personLine}>{staff.skills ?? 'No skills on file'}</Text>
      <Text style={styles.personLine}>{staff.availability ?? 'Availability not set'}</Text>
      <View style={styles.personActions}>
        <Pressable
          onPress={() => router.push(`/(admin)/care-managers/${staff.id}` as Href)}
          accessibilityRole="button"
          accessibilityLabel={`View ${name}`}
          style={styles.iconBtn}
        >
          <Icon name="eye-outline" size={18} color={colors.sidebarActive} />
        </Pressable>
        <Pressable
          onPress={() => router.push(`/(admin)/care-managers/${staff.id}?edit=1` as Href)}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${name}`}
          style={styles.iconBtn}
        >
          <Icon name="create-outline" size={18} color={colors.primary} />
        </Pressable>
        <Pressable onPress={onDelete} accessibilityRole="button" accessibilityLabel={`Delete ${name}`} style={styles.iconBtn}>
          <Icon name="trash-outline" size={18} color={colors.emergency} />
        </Pressable>
        {pending ? (
          <PrimaryButton label="Approve" fullWidth={false} loading={approving} onPress={onApprove} />
        ) : null}
      </View>
    </View>
  );
}

export function AdminCareManagerCreateScreen() {
  const provision = useProvisionAdminStaff();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(ADMIN_STAFF_DEFAULT_PASSWORD);
  const [employeeId, setEmployeeId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [staffKind, setStaffKind] = useState<StaffKind>('CARE_MANAGER');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [languages, setLanguages] = useState('');
  const [availability, setAvailability] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  return (
    <AdminScreen
      title="Register care staff"
      subtitle="Creates login account and profile in one step. Share the default password with the staff member."
      backHref="/(admin)/care-managers"
    >
      <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextField label="Password" value={password} onChangeText={setPassword} autoCapitalize="none" secureTextEntry />
      <TextField label="Employee ID" value={employeeId} onChangeText={setEmployeeId} />
      <TextField label="First name" value={firstName} onChangeText={setFirstName} />
      <TextField label="Last name" value={lastName} onChangeText={setLastName} />
      <AdminFilterChips
        label="Staff role"
        value={staffKind}
        options={STAFF_KINDS.map((kind) => ({ value: kind, label: STAFF_KIND_LABELS[kind] }))}
        onChange={(next) => next && setStaffKind(next)}
        allowAll={false}
      />
      <TextField label="Skills (optional)" value={skills} onChangeText={setSkills} />
      <TextField label="Experience (optional)" value={experience} onChangeText={setExperience} />
      <TextField label="Languages (optional)" value={languages} onChangeText={setLanguages} />
      <TextField label="Availability (optional)" value={availability} onChangeText={setAvailability} />
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <PrimaryButton
        label="Register staff"
        loading={provision.isPending}
        onPress={() => {
          const trimmedEmail = email.trim();
          const trimmedPhone = phone.trim();
          const trimmedEmployeeId = employeeId.trim();
          const trimmedFirst = firstName.trim();
          const trimmedLast = lastName.trim();
          if (!trimmedEmail || !trimmedPhone || !trimmedEmployeeId || !trimmedFirst || !trimmedLast) {
            setFormError('Email, phone, employee ID, and name are required.');
            return;
          }
          if (password.length < 8) {
            setFormError('Password must be at least 8 characters.');
            return;
          }
          setFormError(null);
          provision.mutate(
            {
              email: trimmedEmail,
              phone: trimmedPhone,
              password,
              employeeId: trimmedEmployeeId,
              firstName: trimmedFirst,
              lastName: trimmedLast,
              staffKind,
              skills: skills.trim() || undefined,
              experience: experience.trim() || undefined,
              languages: languages.trim() || undefined,
              availability: availability.trim() || undefined,
              status: 'ACTIVE',
            },
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

const styles = StyleSheet.create({
  toolbarCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  grid: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  gridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  personCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    flexGrow: 1,
    flexBasis: 340,
    minWidth: 280,
    ...shadows.card,
  },
  personTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  personMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 0,
  },
  personCopy: {
    flex: 1,
    minWidth: 0,
  },
  personNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  personName: {
    ...typography.subtitle,
    color: colors.text,
  },
  personMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  personLine: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  personActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.adminCanvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    ...typography.caption,
    color: colors.emergency,
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.94,
  },
});
