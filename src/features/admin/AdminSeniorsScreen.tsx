import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { ConfirmDialog, PrimaryButton, StatusPill, TextField, statusToneFromLabel } from '@/components';
import { Avatar, Icon } from '@/components/ui';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { onboardingLanguageLabel } from '@/features/auth/onboardingProfile';
import { AdminFilterChips } from './components/AdminFilterChips';
import { AdminSelectCheckbox, AdminSelectionToolbar } from './components/AdminListActions';
import { AdminPagination } from './components/AdminPagination';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { AdminSearchPicker } from './components/AdminSearchPicker';
import { deleteAdminSenior } from './api';
import { useDeletePeopleRecords } from './hooks/useDeletePeopleRecords';
import { useAdminSeniors, useAdminUsers, useCreateAdminSenior } from './hooks';
import { adminSeniorDisplay, getAdminErrorMessage, getSectionState, humanizeStatus, seniorAgeYears } from './selectors';
import type { AdminSenior, AdminSeniorSegment } from './types';
import { ADMIN_PAGE_SIZE } from './types';
import { useAdminLayout } from './useAdminLayout';

const SENIOR_SEGMENTS: { value: AdminSeniorSegment; label: string }[] = [
  { value: 'membership', label: 'Membership person' },
  { value: 'outside_area', label: 'Not in service area' },
  { value: 'in_area_no_membership', label: 'In area · no membership' },
];

export function AdminSeniorsScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const { isDesktop } = useAdminLayout();
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState(typeof params.q === 'string' ? params.q : '');
  const [segment, setSegment] = useState<AdminSeniorSegment | undefined>(undefined);

  useEffect(() => {
    if (typeof params.q === 'string') {
      setSearch(params.q);
    }
  }, [params.q]);
  const query = useAdminSeniors({
    limit: ADMIN_PAGE_SIZE,
    offset,
    ...(segment ? { segment } : {}),
  });
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

  const selection = useDeletePeopleRecords(`${offset}|${search}|${segment ?? 'all'}`, deleteAdminSenior);
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
      title="Seniors"
      subtitle="People in AgeWell care. Open a card to view the full profile."
      actions={
        <PrimaryButton label="Create senior" fullWidth={false} onPress={() => router.push('/(admin)/seniors/new' as Href)} />
      }
    >
      <View style={styles.toolbarCard}>
        <AdminFilterChips
          label="Segment"
          value={segment}
          options={SENIOR_SEGMENTS}
          onChange={(next) => {
            setSegment(next);
            setOffset(0);
          }}
        />
        <TextField label="Search name or email" value={search} onChangeText={setSearch} />
      </View>
      {selection.actionError ? <Text style={styles.error}>{selection.actionError}</Text> : null}
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading seniors..."
        emptyTitle="No seniors"
        emptyMessage="No senior records match this view."
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
            <SeniorListCard
              key={item.id}
              senior={item}
              selected={selection.selectedIds.includes(item.id)}
              onSelect={() => selection.toggleOne(item.id)}
              onDelete={() => selection.requestDeleteOne(item.id, adminSeniorDisplay(item))}
            />
          ))}
        </View>
        <AdminPagination
          total={query.data?.total ?? 0}
          limit={query.data?.limit ?? ADMIN_PAGE_SIZE}
          offset={query.data?.offset ?? offset}
          onOffsetChange={setOffset}
        />
      </AdminQueryView>
    </AdminScreen>
      <ConfirmDialog
        visible={Boolean(selection.deleteId)}
        title="Delete this senior?"
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
        title="Delete selected seniors?"
        message={`${selection.selectedIds.length} senior record(s) and their login accounts will be permanently removed.`}
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

function SeniorListCard({
  senior,
  selected,
  onSelect,
  onDelete,
}: {
  senior: AdminSenior;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const name = adminSeniorDisplay(senior);
  const age = seniorAgeYears(senior.dateOfBirth);
  return (
    <View style={styles.personCard}>
      <View style={styles.personTop}>
        <AdminSelectCheckbox checked={selected} label={`Select ${name}`} onPress={onSelect} />
        <Pressable
          onPress={() => router.push(`/(admin)/seniors/${senior.id}` as Href)}
          accessibilityRole="button"
          accessibilityLabel={name}
          style={({ pressed }) => [styles.personMain, pressed ? styles.pressed : null]}
        >
          <Avatar name={name} size={48} />
          <View style={styles.personCopy}>
            <View style={styles.personNameRow}>
              <Text style={styles.personName}>{name}</Text>
              <StatusPill
                label={senior.accountStatus ? humanizeStatus(senior.accountStatus) : 'Active'}
                tone={statusToneFromLabel(senior.accountStatus ?? 'ACTIVE')}
              />
            </View>
            <Text style={styles.personMeta}>
              {[age != null ? `${age} years` : null, senior.address || null].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </Pressable>
      </View>
      <Text style={styles.personLine}>{senior.email ?? 'No email on file'}</Text>
      <Text style={styles.personLine}>
        {senior.inServiceArea ? 'In service area' : 'Outside service area'}
        {' · '}
        {senior.hasMembership ? 'Member' : 'No membership'}
        {' · '}
        {onboardingLanguageLabel(senior.preferredLanguage)}
      </Text>
      <View style={styles.personActions}>
        <Pressable
          onPress={() => router.push(`/(admin)/seniors/${senior.id}` as Href)}
          accessibilityRole="button"
          accessibilityLabel={`View ${name}`}
          style={styles.iconBtn}
        >
          <Icon name="eye-outline" size={18} color={colors.sidebarActive} />
        </Pressable>
        <Pressable
          onPress={() => router.push(`/(admin)/seniors/${senior.id}?edit=1` as Href)}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${name}`}
          style={styles.iconBtn}
        >
          <Icon name="create-outline" size={18} color={colors.primary} />
        </Pressable>
        <Pressable onPress={onDelete} accessibilityRole="button" accessibilityLabel={`Delete ${name}`} style={styles.iconBtn}>
          <Icon name="trash-outline" size={18} color={colors.emergency} />
        </Pressable>
      </View>
    </View>
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
  const [preferredLanguage, setPreferredLanguage] = useState('');
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
      <TextField
        label="Preferred language (en / hi / mr)"
        value={preferredLanguage}
        onChangeText={setPreferredLanguage}
        autoCapitalize="none"
      />
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
            {
              userId,
              firstName,
              lastName,
              dateOfBirth,
              address,
              emergencyContact,
              preferredLanguage: preferredLanguage || undefined,
            },
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
    marginVertical: spacing.md,
  },
  pressed: {
    opacity: 0.94,
  },
});
