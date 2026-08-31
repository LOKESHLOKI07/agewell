import { ReactNode, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ApiError } from '@/api/errors';
import { AppHeader, ErrorState, LoadingState, Screen, SectionHeader } from '@/components';
import { colors, radius, shadows, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/authStore';
import { seniorDisplayName } from '@/features/home/api/mappers';
import { useCurrentMembership, useSeniorProfile } from '@/features/home/hooks/queries';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { toDisplayDate } from '@/utils/date';

function ageFromDateOfBirth(value: string | null | undefined): number | null {
  if (!value?.trim()) {
    return null;
  }
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  const birth = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
  if (Number.isNaN(birth.getTime())) {
    return null;
  }
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 && age < 130 ? age : null;
}

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

/** Personal info for the signed-in senior — loads GET /seniors/me (not mock Lakshmi data). */
export function ParentProfileScreen() {
  const email = useAuthStore((state) => state.user?.email);
  const phone = useAuthStore((state) => state.user?.phone);
  const seniorQuery = useSeniorProfile();
  const membershipQuery = useCurrentMembership();

  const seniorState = getSectionState({
    isPending: seniorQuery.isPending,
    isError: seniorQuery.isError,
    isEmpty: seniorQuery.isSuccess && !seniorQuery.data,
  });

  const membershipMissing = isNotFound(membershipQuery.error);
  const membership = membershipMissing ? null : membershipQuery.data ?? null;

  const age = useMemo(
    () => ageFromDateOfBirth(seniorQuery.data?.dateOfBirth),
    [seniorQuery.data?.dateOfBirth],
  );

  if (seniorState === 'loading') {
    return (
      <Screen>
        <AppHeader title="Personal info" showBack />
        <LoadingState message="Loading your profile..." />
      </Screen>
    );
  }

  if (seniorState === 'error' || !seniorQuery.data) {
    return (
      <Screen>
        <AppHeader title="Personal info" showBack />
        <ErrorState
          message={
            seniorQuery.error
              ? seniorQuery.error instanceof Error
                ? seniorQuery.error.message
                : 'Could not load your profile.'
              : 'Profile not found'
          }
          onRetry={() => void seniorQuery.refetch()}
        />
      </Screen>
    );
  }

  const senior = seniorQuery.data;
  const name = seniorDisplayName(senior);

  return (
    <Screen>
      <AppHeader title={name} subtitle="Your AgeWell profile" showBack />

      <View style={styles.stack}>
        <InfoCard title="Personal information">
          <InfoRow label="Name" value={name} />
          <InfoRow label="Date of birth" value={toDisplayDate(senior.dateOfBirth) || '—'} />
          {age != null ? <InfoRow label="Age" value={`${age}`} /> : null}
          <InfoRow label="Address" value={senior.address || '—'} />
          {email ? <InfoRow label="Email" value={email} /> : null}
          {phone ? <InfoRow label="Mobile" value={phone} /> : null}
        </InfoCard>

        <InfoCard title="Emergency contact">
          <InfoRow
            label="On file"
            value={senior.emergencyContact?.trim() || 'Not added yet'}
          />
        </InfoCard>

        <InfoCard title="Care plan">
          {membership ? (
            <>
              <InfoRow label="Plan" value={membership.planName} />
              <InfoRow label="Status" value={membership.status} />
              {membership.endDate ? (
                <InfoRow label="Valid till" value={toDisplayDate(membership.endDate) || membership.endDate} />
              ) : null}
            </>
          ) : (
            <InfoRow
              label="Plan"
              value={
                membershipQuery.isPending
                  ? 'Loading…'
                  : 'No active membership yet'
              }
            />
          )}
        </InfoCard>

        <Text style={styles.privacy}>
          Doctor and hospital details appear here after you add them in Health. This screen shows only what is saved on
          your AgeWell account.
        </Text>
      </View>
    </Screen>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View>
      <SectionHeader title={title} />
      <View style={[styles.card, shadows.card]}>{children}</View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    marginTop: spacing.xxl,
    gap: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  row: {
    gap: 4,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
  },
  value: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  privacy: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
