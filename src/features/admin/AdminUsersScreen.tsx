import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { ApiError } from '@/api/errors';
import { ConfirmDialog, PrimaryButton, TextField } from '@/components';
import { colors, spacing, typography } from '@/constants/theme';
import { AUTH_ROLES, type AuthRole } from '@/features/auth/authTypes';
import { useAuthStore } from '@/features/auth/authStore';
import { formatLongDate } from '@/utils/date';
import { AdminCollection } from './components/AdminCollection';
import { AdminFilterChips } from './components/AdminFilterChips';
import { AdminRowIconActions, AdminSelectCheckbox, AdminSelectionToolbar } from './components/AdminListActions';
import { AdminPagination } from './components/AdminPagination';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { deleteAdminUser } from './api';
import { useDeletePeopleRecords } from './hooks/useDeletePeopleRecords';
import { useAdminCareManagers, useAdminFamilies, useAdminSeniors, useAdminUsers } from './hooks';
import { adminRoleLabel, getSectionState, humanizeStatus } from './selectors';
import type { AdminUser } from './types';
import { ADMIN_PAGE_SIZE } from './types';

const ROLE_OPTIONS = AUTH_ROLES.map((role) => ({ value: role, label: adminRoleLabel(role) }));

export function AdminUsersScreen() {
  const [offset, setOffset] = useState(0);
  const [role, setRole] = useState<AuthRole | undefined>();
  const [emailInput, setEmailInput] = useState('');
  const [email, setEmail] = useState<string | undefined>();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const query = useAdminUsers({ limit: ADMIN_PAGE_SIZE, offset, role, email });
  const seniors = useAdminSeniors({ limit: 100, offset: 0 });
  const families = useAdminFamilies({ limit: 100, offset: 0 });
  const careManagers = useAdminCareManagers();
  const items = query.data?.items ?? [];
  const deleteOne = useMemo(
    () => async (id: string) => {
      if (id === currentUserId) {
        throw new ApiError('You cannot delete your own account.', 400);
      }
      return deleteAdminUser(id);
    },
    [currentUserId],
  );
  const selection = useDeletePeopleRecords(`${offset}|${role ?? ''}|${email ?? ''}`, deleteOne);
  const pageIds = items.map((item) => item.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selection.selectedIds.includes(id));

  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: items.length === 0,
  });

  const viewProfile = (user: AdminUser) => {
    if (user.role === 'SENIOR') {
      const senior = (seniors.data?.items ?? []).find((item) => item.userId === user.id);
      if (senior) {
        router.push(`/(admin)/seniors/${senior.id}` as Href);
        return;
      }
      router.push('/(admin)/seniors' as Href);
      return;
    }
    if (user.role === 'FAMILY') {
      const family = (families.data?.items ?? []).find((item) => item.userId === user.id);
      if (family) {
        router.push(`/(admin)/families/${family.id}` as Href);
        return;
      }
      router.push('/(admin)/families' as Href);
      return;
    }
    if (user.role === 'CARE_MANAGER') {
      const care = (careManagers.data ?? []).find((item) => item.userId === user.id);
      if (care) {
        router.push(`/(admin)/care-managers/${care.id}` as Href);
        return;
      }
      router.push('/(admin)/care-managers' as Href);
      return;
    }
    router.push(`/(admin)/users/${user.id}` as Href);
  };

  return (
    <AdminScreen
      title="Users"
      subtitle="Login accounts and roles. Use Edit, View, or Delete on each row. Delete removes the account and its linked profile."
      actions={<PrimaryButton label="Create user" fullWidth={false} onPress={() => router.push('/(admin)/users/new' as Href)} />}
    >
      <View style={styles.toolbar}>
        <View style={styles.searchField}>
          <TextField
            label="Search email"
            value={emailInput}
            onChangeText={setEmailInput}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="search"
            onSubmitEditing={() => {
              setOffset(0);
              setEmail(emailInput.trim() || undefined);
            }}
          />
        </View>
        <PrimaryButton
          label="Search"
          fullWidth={false}
          onPress={() => {
            setOffset(0);
            setEmail(emailInput.trim() || undefined);
          }}
        />
      </View>

      <AdminFilterChips
        label="Role"
        value={role}
        options={ROLE_OPTIONS}
        onChange={(next) => {
          setOffset(0);
          setRole(next);
        }}
      />

      {selection.actionError ? <Text style={styles.error}>{selection.actionError}</Text> : null}

      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading users..."
        emptyTitle="No users"
        emptyMessage="No users match this search."
        errorKind="user"
      >
        <AdminCollection
          items={items}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) => `${item.email}, ${adminRoleLabel(item.role)}`}
          columns={[
            {
              key: 'select',
              label: 'Select',
              flex: 0.45,
              header: (
                <AdminSelectCheckbox
                  checked={allSelected}
                  label="Select all users on this page"
                  onPress={() => selection.toggleAll(pageIds)}
                />
              ),
              render: (item: AdminUser) => (
                <AdminSelectCheckbox
                  checked={selection.selectedIds.includes(item.id)}
                  label={`Select ${item.email}`}
                  onPress={() => selection.toggleOne(item.id)}
                />
              ),
            },
            { key: 'email', label: 'Email', flex: 1.5, render: (item: AdminUser) => <Text style={cell}>{item.email}</Text> },
            { key: 'phone', label: 'Phone', render: (item) => <Text style={cell}>{item.phone}</Text> },
            { key: 'role', label: 'Role', render: (item) => <Text style={cell}>{humanizeStatus(item.role)}</Text> },
            {
              key: 'status',
              label: 'Account status',
              render: (item) => <Text style={cell}>{humanizeStatus(item.accountStatus)}</Text>,
            },
            {
              key: 'created',
              label: 'Created',
              render: (item) => <Text style={cell}>{item.createdAt ? formatLongDate(item.createdAt) : '—'}</Text>,
            },
            {
              key: 'actions',
              label: 'Actions',
              flex: 1.1,
              render: (item) => (
                <AdminRowIconActions
                  editLabel={`Edit ${item.email}`}
                  viewLabel={`View profile for ${item.email}`}
                  deleteLabel={`Delete ${item.email}`}
                  onEdit={() => router.push(`/(admin)/users/${item.id}` as Href)}
                  onView={() => viewProfile(item)}
                  onDelete={() => selection.requestDeleteOne(item.id, item.email)}
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
        title="Delete this account?"
        message={
          selection.deleteId
            ? `${selection.deleteLabel} and any linked People profile will be permanently removed.`
            : ''
        }
        confirmLabel={selection.busy ? 'Working…' : 'Delete account'}
        onCancel={() => selection.setDeleteId(null)}
        onConfirm={() => {
          if (selection.deleteId) void selection.deleteRecords([selection.deleteId]);
        }}
      />
      <ConfirmDialog
        visible={selection.bulkDelete}
        title="Delete selected accounts?"
        message={`${selection.selectedIds.length} account(s) and any linked People profiles will be permanently removed.`}
        confirmLabel={selection.busy ? 'Working…' : 'Delete selected'}
        onCancel={() => selection.setBulkDelete(false)}
        onConfirm={() => {
          void selection.deleteRecords(selection.selectedIds);
        }}
      />
    </AdminScreen>
  );
}

const cell = { ...typography.body, color: colors.text };

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  searchField: {
    flexGrow: 1,
    flexBasis: 280,
  },
  error: {
    ...typography.caption,
    color: colors.emergency,
    marginBottom: spacing.md,
  },
});
