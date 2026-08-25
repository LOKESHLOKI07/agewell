import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { PrimaryButton, TextField } from '@/components';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { AUTH_ROLES, type AuthRole } from '@/features/auth/authTypes';
import { formatLongDate } from '@/utils/date';
import { AdminFilterChips } from './components/AdminFilterChips';
import { AdminQueryView } from './components/AdminQueryView';
import { AdminScreen } from './components/AdminScreen';
import { useAdminUser, useCreateAdminUser, useUpdateAdminUser } from './hooks';
import { adminRoleLabel, getAdminErrorMessage, getSectionState } from './selectors';

const ROLE_OPTIONS = AUTH_ROLES.map((role) => ({ value: role, label: adminRoleLabel(role) }));

export function AdminUserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useAdminUser(id);
  const update = useUpdateAdminUser(id ?? '');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<AuthRole>('SENIOR');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (query.data) {
      setEmail(query.data.email);
      setPhone(query.data.phone);
      setRole(query.data.role);
    }
  }, [query.data]);

  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: query.isSuccess && !query.data,
  });

  return (
    <AdminScreen title="User" subtitle="Edit email, phone, or role. Deactivation is not available.">
      <AdminQueryView
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingMessage="Loading user..."
        emptyTitle="User not found"
        emptyMessage="This user is not in AgeWell."
        errorKind="user"
      >
        {query.data ? (
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.meta}>ID: {query.data.id}</Text>
            <Text style={styles.meta}>
              Created: {query.data.createdAt ? formatLongDate(query.data.createdAt) : 'Not on file'}
            </Text>
            <Text style={styles.meta}>
              Updated: {query.data.updatedAt ? formatLongDate(query.data.updatedAt) : 'Not on file'}
            </Text>
            <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
            <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <AdminFilterChips label="Role" value={role} options={ROLE_OPTIONS} onChange={(next) => next && setRole(next)} allowAll={false} />
            {formError ? (
              <Text style={styles.error} accessibilityLiveRegion="polite">
                {formError}
              </Text>
            ) : null}
            <PrimaryButton
              label="Save changes"
              loading={update.isPending}
              onPress={() => {
                setFormError(null);
                update.mutate(
                  { email, phone, role },
                  {
                    onError: (error) => setFormError(getAdminErrorMessage(error, 'user')),
                    onSuccess: () => router.back(),
                  },
                );
              }}
            />
          </View>
        ) : null}
      </AdminQueryView>
    </AdminScreen>
  );
}

export function AdminUserCreateScreen() {
  const create = useCreateAdminUser();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AuthRole>('FAMILY');
  const [formError, setFormError] = useState<string | null>(null);

  return (
    <AdminScreen title="Create user" subtitle="Creates a login account. Password reset is not available in this phase.">
      <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextField label="Temporary password" value={password} onChangeText={setPassword} secureTextEntry />
      <AdminFilterChips label="Role" value={role} options={ROLE_OPTIONS} onChange={(next) => next && setRole(next)} allowAll={false} />
      {formError ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {formError}
        </Text>
      ) : null}
      <PrimaryButton
        label="Create user"
        loading={create.isPending}
        onPress={() => {
          setFormError(null);
          create.mutate(
            { email, phone, role, password },
            {
              onError: (error) => setFormError(getAdminErrorMessage(error, 'user')),
              onSuccess: (user) => router.replace(`/(admin)/users/${user.id}` as Href),
            },
          );
        }}
      />
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.emergency,
    marginBottom: spacing.md,
  },
});
