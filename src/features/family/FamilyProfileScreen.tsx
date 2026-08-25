import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar, ConfirmDialog } from '@/components';
import { colors, minTouchSize, radius, shadows, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/useAuth';
import { seniorDisplayName } from '@/features/home/api/mappers';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { formatLongDate } from '@/utils/date';
import { FamilyQueryView } from './components/FamilyQueryView';
import { FamilySubScreen } from './components/FamilySubScreen';
import { useFamilyMe, useFamilySeniors } from './hooks';
import { useFamilyStore } from './familyStore';
import { familyDisplayName } from './mappers';

export function FamilyProfileScreen() {
  const { signOut } = useAuth();
  const me = useFamilyMe();
  const seniors = useFamilySeniors();
  const selectedSeniorId = useFamilyStore((state) => state.selectedSeniorId);
  const resetFamily = useFamilyStore((state) => state.reset);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const meState = getSectionState({
    isPending: me.isPending,
    isError: me.isError,
    isEmpty: me.isSuccess && !me.data,
  });
  const seniorsState = getSectionState({
    isPending: seniors.isPending,
    isError: seniors.isError,
    isEmpty: (seniors.data?.length ?? 0) === 0,
  });

  const onLogout = async () => {
    setConfirmVisible(false);
    setSigningOut(true);
    try {
      resetFamily();
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <FamilySubScreen title="Profile" showBack={false}>
      <FamilyQueryView
        state={meState}
        error={me.error}
        onRetry={() => void me.refetch()}
        loadingMessage="Loading profile..."
        emptyIcon="person-outline"
        emptyTitle="No family profile"
        emptyMessage="Your family profile will appear here when it is on file."
      >
        {me.data ? (
          <View style={[styles.card, shadows.card]}>
            <Avatar name={familyDisplayName(me.data)} size={64} />
            <Text style={styles.name}>{familyDisplayName(me.data) || 'Family member'}</Text>
            <Text style={styles.line}>
              Joined: {me.data.createdAt ? formatLongDate(me.data.createdAt) : 'Not on file'}
            </Text>
            <Text style={styles.line}>
              Updated: {me.data.updatedAt ? formatLongDate(me.data.updatedAt) : 'Not on file'}
            </Text>
          </View>
        ) : null}
      </FamilyQueryView>

      <Text style={styles.section}>Connected seniors</Text>
      <FamilyQueryView
        state={seniorsState}
        error={seniors.error}
        onRetry={() => void seniors.refetch()}
        loadingMessage="Loading connected seniors..."
        emptyIcon="people-outline"
        emptyTitle="No connected seniors"
        emptyMessage="Seniors you are authorized to support will appear here."
      >
        <View style={styles.list}>
          {seniors.data?.map((senior) => (
            <View key={senior.id} style={[styles.card, shadows.card]}>
              <Text style={styles.seniorName}>{seniorDisplayName(senior)}</Text>
              {senior.id === selectedSeniorId ? <Text style={styles.selected}>Currently viewing</Text> : null}
            </View>
          ))}
        </View>
      </FamilyQueryView>

      <Pressable
        style={styles.logout}
        onPress={() => setConfirmVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Logout"
      >
        <Text style={styles.logoutLabel}>{signingOut ? 'Signing out…' : 'Logout'}</Text>
      </Pressable>

      <ConfirmDialog
        visible={confirmVisible}
        title="Sign out?"
        message="You will need to sign in again."
        confirmLabel="Logout"
        onConfirm={() => {
          void onLogout();
        }}
        onCancel={() => setConfirmVisible(false)}
      />
    </FamilySubScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  name: {
    ...typography.title,
    color: colors.text,
  },
  seniorName: {
    ...typography.subtitle,
    color: colors.text,
  },
  selected: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  line: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  section: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  logout: {
    minHeight: minTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxl,
  },
  logoutLabel: {
    ...typography.bodyStrong,
    color: colors.emergency,
  },
});
