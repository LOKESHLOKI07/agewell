import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ConfirmDialog, PrimaryButton, TextField } from '@/components';
import { colors, minTouchSize, radius, shadows, spacing, typography } from '@/constants/theme';
import { changePassword } from '@/features/auth/authService';
import { useAuth } from '@/features/auth/useAuth';
import { staffScopeLabel } from '@/features/auth/serviceCities';
import { AdminScreen } from './components/AdminScreen';

export function AdminProfileScreen() {
  const { user, signOut } = useAuth();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  return (
    <AdminScreen title="Settings" subtitle="Signed-in staff account.">
      {user ? (
        <View style={[styles.card, shadows.card]}>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.line}>Role: {staffScopeLabel(user)}</Text>
          <Text style={styles.line}>Phone: {user.phone}</Text>
        </View>
      ) : null}
      <View style={[styles.card, shadows.card, styles.passwordCard]}>
        <Text style={styles.sectionTitle}>Change password</Text>
        <TextField
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />
        <TextField
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
        {passwordMessage ? <Text style={styles.success}>{passwordMessage}</Text> : null}
        <PrimaryButton
          label="Update password"
          fullWidth={false}
          loading={savingPassword}
          onPress={() => {
            setPasswordError(null);
            setPasswordMessage(null);
            if (newPassword.trim().length < 8) {
              setPasswordError('New password must be at least 8 characters.');
              return;
            }
            setSavingPassword(true);
            void changePassword(currentPassword, newPassword)
              .then(() => {
                setCurrentPassword('');
                setNewPassword('');
                setPasswordMessage('Password updated.');
              })
              .catch((error: unknown) => {
                setPasswordError(error instanceof Error ? error.message : 'Could not update password.');
              })
              .finally(() => setSavingPassword(false));
          }}
        />
      </View>
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
        destructive
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
  passwordCard: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.text,
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
  error: {
    ...typography.caption,
    color: colors.emergency,
  },
  success: {
    ...typography.caption,
    color: colors.safe,
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
