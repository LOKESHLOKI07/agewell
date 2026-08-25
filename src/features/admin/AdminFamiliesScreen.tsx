import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { ConfirmDialog, PrimaryButton, TextField } from '@/components';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { formatLongDate } from '@/utils/date';
import { AdminCollection } from './components/AdminCollection';
import { AdminPagination } from './components/AdminPagination';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { useAdminAccess, useAdminFamilies, useAdminSeniors, useGrantAdminAccess, useRevokeAdminAccess } from './hooks';
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
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: items.length === 0,
  });

  return (
    <AdminScreen title="Families" subtitle="Family member records. Access is managed separately.">
      <TextField label="Search name" value={search} onChangeText={setSearch} />
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
          onPress={(item) => router.push(`/(admin)/families/${item.id}` as Href)}
          columns={[
            { key: 'name', label: 'Name', render: (item: FamilyMember) => <Text style={cell}>{adminFamilyDisplay(item)}</Text> },
            { key: 'user', label: 'User ID', render: (item) => <Text style={cell}>{item.userId}</Text> },
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

export function AdminFamilyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const families = useAdminFamilies({ limit: 100, offset: 0 });
  const family = families.data?.items.find((item) => item.id === id);
  const access = useAdminAccess({ familyId: id, limit: 50, offset: 0 });
  const seniors = useAdminSeniors({ limit: 100, offset: 0 });
  const state = getSectionState({
    isPending: families.isPending,
    isError: families.isError,
    isEmpty: families.isSuccess && !family,
  });
  const seniorName = (seniorId: string) => {
    const senior = seniors.data?.items.find((item) => item.id === seniorId);
    return senior ? adminSeniorDisplay(senior) : seniorId;
  };

  return (
    <AdminScreen title="Family" subtitle="Authorized seniors come from Admin access APIs, not Family Mode routes.">
      <AdminQueryView
        state={state}
        error={families.error}
        onRetry={() => void families.refetch()}
        loadingMessage="Loading family..."
        emptyTitle="Family not found"
        emptyMessage="This family record is not in the current directory page."
      >
        {family ? (
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.name}>{adminFamilyDisplay(family)}</Text>
            <Text style={styles.line}>User ID: {family.userId}</Text>
            <Text style={styles.line}>Created: {family.createdAt ? formatLongDate(family.createdAt) : 'Not on file'}</Text>
            <Text style={styles.line}>Updated: {family.updatedAt ? formatLongDate(family.updatedAt) : 'Not on file'}</Text>
          </View>
        ) : null}
        <Text style={styles.section}>Authorized seniors</Text>
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
          emptyMessage="Grant access from the Access screen."
        >
          {(access.data?.items ?? []).map((row) => (
            <Text key={row.id} style={styles.line}>
              {seniorName(row.seniorId)}
            </Text>
          ))}
        </AdminQueryView>
        <PrimaryButton label="Manage access" onPress={() => router.push('/(admin)/access' as Href)} />
      </AdminQueryView>
    </AdminScreen>
  );
}

export function AdminAccessScreen() {
  const [offset, setOffset] = useState(0);
  const [familyId, setFamilyId] = useState('');
  const [seniorId, setSeniorId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const access = useAdminAccess({ limit: ADMIN_PAGE_SIZE, offset });
  const families = useAdminFamilies({ limit: 100, offset: 0 });
  const seniors = useAdminSeniors({ limit: 100, offset: 0 });
  const grant = useGrantAdminAccess();
  const revoke = useRevokeAdminAccess();
  const familyName = (id: string) => {
    const family = families.data?.items.find((item) => item.id === id);
    return family ? adminFamilyDisplay(family) : id;
  };
  const seniorName = (id: string) => {
    const senior = seniors.data?.items.find((item) => item.id === id);
    return senior ? adminSeniorDisplay(senior) : id;
  };
  const state = getSectionState({
    isPending: access.isPending,
    isError: access.isError,
    isEmpty: (access.data?.items.length ?? 0) === 0,
  });

  return (
    <AdminScreen title="Access" subtitle="Family ↔ Senior relationships. There is no permission selector.">
      <TextField label="Family ID" value={familyId} onChangeText={setFamilyId} autoCapitalize="none" />
      <TextField label="Senior ID" value={seniorId} onChangeText={setSeniorId} autoCapitalize="none" />
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <PrimaryButton
        label="Grant access"
        loading={grant.isPending}
        onPress={() => {
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
          items={access.data?.items ?? []}
          keyExtractor={(item) => item.id}
          accessibilityLabel={(item) => `${familyName(item.familyId)} access to ${seniorName(item.seniorId)}`}
          columns={[
            { key: 'family', label: 'Family', render: (item) => <Text style={cell}>{familyName(item.familyId)}</Text> },
            { key: 'senior', label: 'Senior', render: (item) => <Text style={cell}>{seniorName(item.seniorId)}</Text> },
            {
              key: 'created',
              label: 'Created',
              render: (item) => <Text style={cell}>{item.createdAt ? formatLongDate(item.createdAt) : 'Not on file'}</Text>,
            },
            {
              key: 'revoke',
              label: 'Action',
              render: (item) => (
                <PrimaryButton label="Revoke access" onPress={() => setRevokeId(item.id)} />
              ),
            },
          ]}
        />
        <AdminPagination
          total={access.data?.total ?? 0}
          limit={access.data?.limit ?? ADMIN_PAGE_SIZE}
          offset={access.data?.offset ?? offset}
          onOffsetChange={setOffset}
        />
      </AdminQueryView>
      <ConfirmDialog
        visible={Boolean(revokeId)}
        title="Revoke family access?"
        message="This family member will lose authorized access to that senior."
        confirmLabel="Revoke access"
        onConfirm={() => {
          if (revokeId) {
            revoke.mutate(revokeId, {
              onError: (error) => setFormError(getAdminErrorMessage(error, 'access')),
            });
          }
          setRevokeId(null);
        }}
        onCancel={() => setRevokeId(null)}
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
    marginBottom: spacing.md,
  },
  error: {
    ...typography.caption,
    color: colors.emergency,
    marginBottom: spacing.md,
  },
});
