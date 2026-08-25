import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, SecondaryButton } from '@/components';
import { Icon, IconWell } from '@/components/ui';
import { cardSurface, colors, spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { useAuthStore } from './authStore';

export function PendingApprovalScreen() {
  const signOut = useAuthStore((state) => state.signOut);
  const careStatus = useAuthStore((state) => state.careStatus) ?? 'PENDING';

  return (
    <View style={styles.root}>
      <AgeWellHeader title="Application status" showProfile={false} />
      <View style={styles.content}>
        <IconWell tone="warning" size={72} rounded="full">
          <Icon name="time-outline" size={32} color={colors.warning} />
        </IconWell>
        <Text style={styles.title}>Pending review</Text>
        <Text style={styles.body}>
          Your Care Associate application is with AgeWell operations. You cannot access seniors or visits until you are
          approved.
        </Text>
        <View style={styles.card}>
          <Text style={styles.label}>Current status</Text>
          <Text style={styles.value}>{careStatus}</Text>
        </View>
        <PrimaryButton label="Refresh later" onPress={() => undefined} />
        <SecondaryButton label="Sign out" onPress={() => void signOut()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.md,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    ...cardSurface,
    width: '100%',
    padding: spacing.lg,
    marginVertical: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
  },
  value: {
    ...typography.subtitle,
    color: colors.warning,
    marginTop: spacing.xs,
  },
});
