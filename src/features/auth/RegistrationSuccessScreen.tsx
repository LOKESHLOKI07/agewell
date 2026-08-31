import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { PrimaryButton } from '@/components';
import { Icon, IconWell } from '@/components/ui';
import { cardSurface, colors, spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { useAuthStore } from './authStore';
import { authenticatedHomeHref } from './roleRouting';
import { isAuthRole, type AuthRole } from './authTypes';

const AUTO_CONTINUE_MS = 2500;

function decodeParam(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) {
    return '';
  }
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function RegistrationSuccessScreen() {
  const params = useLocalSearchParams<{
    email?: string;
    role?: string;
    message?: string;
    careStatus?: string;
  }>();
  const user = useAuthStore((state) => state.user);
  const careStatusStore = useAuthStore((state) => state.careStatus);
  const didNavigate = useRef(false);

  const email = decodeParam(params.email) || user?.email || '';
  const roleParam = decodeParam(params.role);
  const role: AuthRole | null = isAuthRole(roleParam) ? roleParam : user?.role ?? null;
  const careStatus = decodeParam(params.careStatus) || careStatusStore;
  const message =
    decodeParam(params.message) ||
    (role === 'CARE_MANAGER'
      ? 'Your application was submitted. AgeWell will review it before you can take visits.'
      : 'Your account was created and saved. You are signed in.');

  const title = role === 'CARE_MANAGER' ? 'Application submitted' : 'Registration successful';

  const continueLabel =
    role === 'CARE_MANAGER' ? 'View application status' : 'Go to home';

  const goHome = () => {
    if (didNavigate.current || !role) {
      return;
    }
    didNavigate.current = true;
    router.replace(authenticatedHomeHref(role, { careStatus }) as Href);
  };

  useEffect(() => {
    if (!role) {
      return;
    }
    const timer = setTimeout(goHome, AUTO_CONTINUE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- navigate once after mount
  }, [role, careStatus]);

  return (
    <View style={styles.root}>
      <AgeWellHeader title="Almost done" showProfile={false} />
      <View style={styles.content}>
        <IconWell tone="safe" size={80} rounded="full">
          <Icon name="checkmark-circle-outline" size={36} color={colors.safe} />
        </IconWell>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{message}</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Signed in as</Text>
          <Text style={styles.value}>{email || 'Your AgeWell account'}</Text>
          <Text style={styles.note}>No need to sign in again. Continuing automatically…</Text>
        </View>
        <PrimaryButton label={continueLabel} onPress={goHome} accessibilityHint="Continues into your AgeWell home" />
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
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    textAlign: 'center',
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
    padding: spacing.xl,
    marginVertical: spacing.lg,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
  },
  value: {
    ...typography.subtitle,
    color: colors.text,
    marginTop: spacing.xs,
  },
  note: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
