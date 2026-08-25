import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ConfirmDialog } from '@/components';
import { colors, minTouchSize, radius, shadows, spacing, typography } from '@/constants/theme';
import { AUTH_ROLE_LABELS } from '@/features/auth/authTypes';
import { useAuth } from '@/features/auth/useAuth';
import { AdminScreen } from './components/AdminScreen';

export function AdminProfileScreen() {
  const { user, signOut } = useAuth();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  return (
    <AdminScreen title="Profile" subtitle="Signed-in staff account.">
      {user ? (
        <View style={[styles.card, shadows.card]}>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.line}>Role: {AUTH_ROLE_LABELS[user.role]}</Text>
          <Text style={styles.line}>Phone: {user.phone}</Text>
        </View>
      ) : null}
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
          setConfirmVisible(false);
          setSigningOut(true);
          void signOut();
        }}
        onCancel={() => setConfirmVisible(false)}
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
  email: {
    ...typography.subtitle,
    color: colors.text,
  },
  line: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
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
