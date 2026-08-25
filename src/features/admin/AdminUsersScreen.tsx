import { useState } from 'react';
import { Text } from 'react-native';
import { router, type Href } from 'expo-router';
import { PrimaryButton, TextField } from '@/components';
import { colors, typography } from '@/constants/theme';
import { AUTH_ROLES, type AuthRole } from '@/features/auth/authTypes';
import { AdminCollection } from './components/AdminCollection';
import { AdminFilterChips } from './components/AdminFilterChips';
import { AdminPagination } from './components/AdminPagination';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { useAdminUsers } from './hooks';
import { adminRoleLabel, getSectionState, humanizeStatus } from './selectors';
import type { AdminUser } from './types';
import { ADMIN_PAGE_SIZE } from './types';

const ROLE_OPTIONS = AUTH_ROLES.map((role) => ({ value: role, label: adminRoleLabel(role) }));

export function AdminUsersScreen() {
  const [offset, setOffset] = useState(0);
  const [role, setRole] = useState<AuthRole | undefined>();
  const [emailInput, setEmailInput] = useState('');
  const [email, setEmail] = useState<string | undefined>();
  const query = useAdminUsers({ limit: ADMIN_PAGE_SIZE, offset, role, email });
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: (query.data?.items.length ?? 0) === 0,
  });

  return (
    <AdminScreen
      title="Users"
      subtitle="Staff directory. Password hashes and tokens are never shown."
      actions={<PrimaryButton label="Create user" onPress={() => router.push('/(admin)/users/new' as Href)} />}
    >
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
      <PrimaryButton
        label="Search"
        onPress={() => {
          setOffset(0);
          setEmail(emailInput.trim() || undefined);
        }}
      />
      <AdminFilterChips
        label="Role"
        value={role}
        options={ROLE_OPTIONS}
        onChange={(next) => {
          setOffset(0);
          setRole(next);
        }}
      />
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
          items={query.data?.items ?? []}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) => `${item.email}, ${adminRoleLabel(item.role)}`}
          onPress={(item) => router.push(`/(admin)/users/${item.id}` as Href)}
          columns={[
            { key: 'email', label: 'Email', flex: 1.4, render: (item: AdminUser) => <Text style={cell}>{item.email}</Text> },
            { key: 'phone', label: 'Phone', render: (item) => <Text style={cell}>{item.phone}</Text> },
            { key: 'role', label: 'Role', render: (item) => <Text style={cell}>{humanizeStatus(item.role)}</Text> },
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

const cell = { ...typography.body, color: colors.text };
