import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, ConfirmDialog } from '@/components';
import { colors, minTouchSize, radius, shadows, spacing, typography } from '@/constants/theme';
import { getSectionState, humanizeStatus } from '@/features/home/selectors/homeViewModel';
import { useAuth } from '@/features/auth/useAuth';
import { CareQueryView } from './components/CareQueryView';
import { CareScreen } from './components/CareScreen';
import { useCareManagerProfile } from './hooks';

export function CareProfileScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const query = useCareManagerProfile();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: query.isSuccess && !query.data,
  });
  const profile = query.data;

  const onLogout = async () => {
    setConfirmVisible(false);
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <CareScreen title="Profile" subtitle="Your care associate record.">
        <CareQueryView
          state={state}
          error={query.error}
          onRetry={() => void query.refetch()}
          loadingMessage="Loading profile..."
          emptyIcon="person-outline"
          emptyTitle="No profile"
          emptyMessage="Your care manager profile will appear here."
        >
          {profile ? (
            <View style={[styles.card, shadows.card]}>
              <Avatar name={profile.name} size={64} />
              <Text style={styles.name}>{profile.name ?? 'Care manager'}</Text>
              <Text style={styles.line}>Employee: {profile.employeeId ?? 'Not on file'}</Text>
              <Text style={styles.line}>Skills: {profile.skills ?? 'Not on file'}</Text>
              <Text style={styles.line}>Status: {profile.status ? humanizeStatus(profile.status) : 'Not on file'}</Text>
            </View>
          ) : null}
        </CareQueryView>

        <Pressable
          style={styles.logout}
          onPress={() => setConfirmVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Logout"
        >
          <Text style={styles.logoutLabel}>{signingOut ? 'Signing out…' : 'Logout'}</Text>
        </Pressable>
      </CareScreen>
      <ConfirmDialog
        visible={confirmVisible}
        title="Sign out?"
        message="You will need to sign in again to see assigned visits."
        confirmLabel="Logout"
        onConfirm={() => {
          void onLogout();
        }}
        onCancel={() => setConfirmVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  line: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
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
