import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfirmDialog } from '@/components';
import { colors, minTouchSize, spacing, typography } from '@/constants/theme';
import { AUTH_ROLE_LABELS, type AuthRole, isAuthRole } from '@/features/auth/authTypes';
import { useAuth } from '@/features/auth/useAuth';
import { CareScreen } from '@/features/care/components/CareScreen';

export function RoleUnavailableScreen() {
  const insets = useSafeAreaInsets();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const { signOut } = useAuth();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const label = role && isAuthRole(role) ? AUTH_ROLE_LABELS[role as AuthRole] : 'This';

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <CareScreen title={`${label} mode`} subtitle="This workspace is not available yet.">
        <Text style={styles.body}>
          You are signed in, but this role does not have a mobile workspace in this phase.
        </Text>
        <Pressable
          style={styles.logout}
          onPress={() => setConfirmVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Logout"
        >
          <Text style={styles.logoutLabel}>Logout</Text>
        </Pressable>
      </CareScreen>
      <ConfirmDialog
        visible={confirmVisible}
        title="Sign out?"
        message="You will need to sign in again."
        confirmLabel="Logout"
        onConfirm={() => {
          setConfirmVisible(false);
          void signOut();
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
  body: {
    ...typography.body,
    color: colors.textSecondary,
  },
  logout: {
    minHeight: minTouchSize,
    justifyContent: 'center',
    marginTop: spacing.xxl,
  },
  logoutLabel: {
    ...typography.bodyStrong,
    color: colors.emergency,
  },
});
