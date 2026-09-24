import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, ConfirmDialog } from '@/components';
import { Icon, type IconName } from '@/components/ui';
import { cardSurface, colors, minTouchSize, spacing, typography } from '@/constants/theme';
import { getSectionState, humanizeStatus } from '@/features/home/selectors/homeViewModel';
import { STAFF_KIND_LABELS, parseStaffKind } from './staffKind';
import { useAuth } from '@/features/auth/useAuth';
import { CareQueryView } from './components/CareQueryView';
import { CareScreen } from './components/CareScreen';
import { useCareManagerProfile } from './hooks';

const MENU: { id: string; label: string; icon: IconName; href: Href }[] = [
  { id: 'attendance', label: 'Attendance', icon: 'time-outline', href: '/care/attendance' as Href },
  { id: 'history', label: 'Service History', icon: 'clipboard-outline', href: '/care/history' as Href },
  { id: 'training', label: 'Training & Documents', icon: 'document-outline', href: '/care/training' as Href },
  { id: 'support', label: 'Support', icon: 'help-circle-outline', href: '/care/support' as Href },
];

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
      <CareScreen title="Profile" subtitle="Your staff account and tools.">
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
            <View style={styles.hero}>
              <Avatar name={profile.name} size={72} />
              <Text style={styles.name}>{profile.name ?? 'Care associate'}</Text>
              <Text style={styles.line}>{STAFF_KIND_LABELS[parseStaffKind(profile.staffKind)]}</Text>
              <Text style={styles.line}>Employee: {profile.employeeId ?? 'Not on file'}</Text>
              <Text style={styles.line}>Status: {profile.status ? humanizeStatus(profile.status) : 'Not on file'}</Text>
            </View>
          ) : null}
        </CareQueryView>

        <View style={styles.menu}>
          {MENU.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(item.href)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              style={({ pressed }) => [styles.menuRow, pressed ? styles.pressed : null]}
            >
              <Icon name={item.icon} size={22} color={colors.primary} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>

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
        destructive
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
  hero: {
    ...cardSurface,
    alignItems: 'center',
    padding: spacing.xxl,
    gap: spacing.sm,
    marginBottom: spacing.xl,
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoft,
  },
  name: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  line: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  menu: {
    gap: spacing.md,
  },
  menuRow: {
    ...cardSurface,
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderColor: colors.border,
  },
  menuLabel: {
    ...typography.bodyStrong,
    color: colors.text,
    flex: 1,
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
  pressed: {
    opacity: 0.92,
  },
});
