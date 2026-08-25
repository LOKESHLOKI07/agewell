import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar, ConfirmDialog, MenuRow, Screen } from '@/components';
import { colors, spacing, typography } from '@/constants/theme';
import { AUTH_ROLE_LABELS } from '@/features/auth/authTypes';
import { useAuth } from '@/features/auth/useAuth';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { useSeniorStore } from '@/store/seniorStore';

export function ProfileScreen() {
  const { signOut } = useAuth();
  const { user } = useCurrentUser();
  const senior = useSeniorStore((state) => state.selectedSenior);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const roleLabel = user ? AUTH_ROLE_LABELS[user.role] : 'Account';

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
    <Screen>
      <View style={styles.hero}>
        <Avatar name={user?.email} size={72} />
        <Text style={styles.name}>{user?.email ?? 'Signed in'}</Text>
        <Text style={styles.meta}>{roleLabel}</Text>
        {user?.phone ? <Text style={styles.meta}>{user.phone}</Text> : null}
      </View>

      <View style={styles.menu}>
        <MenuRow
          icon="person-outline"
          title="Personal Info"
          subtitle="Your AgeWell account"
          onPress={() => router.push({ pathname: '/parent/[id]', params: { id: senior.id } })}
        />
        <MenuRow icon="medkit-outline" title="Health Info" onPress={() => router.push('/(tabs)/health')} />
        <MenuRow icon="call-outline" title="Emergency Contacts" onPress={() => router.push('/health/emergency-info')} />
        <MenuRow icon="ribbon-outline" title="Membership" onPress={() => router.push('/account/membership')} />
        <MenuRow icon="settings-outline" title="Settings" onPress={() => router.push('/account/notification-settings')} />
        <MenuRow icon="help-circle-outline" title="Help & Support" onPress={() => router.push('/account/help')} />
        <MenuRow
          icon="log-out-outline"
          title={signingOut ? 'Signing out…' : 'Logout'}
          destructive
          onPress={() => setConfirmVisible(true)}
        />
      </View>

      <ConfirmDialog
        visible={confirmVisible}
        title="Sign out?"
        message="You will need to sign in again to see care updates."
        confirmLabel="Logout"
        onConfirm={() => {
          void onLogout();
        }}
        onCancel={() => setConfirmVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  name: {
    ...typography.heading,
    color: colors.text,
    textAlign: 'center',
  },
  meta: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  menu: {
    gap: spacing.sm,
  },
});
