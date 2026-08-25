import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { cardSurface, typography, colors, spacing } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { Avatar, SectionTitle } from '@/components/ui';
import { EmptyState, ErrorState, LoadingState } from '@/components';
import { useAuthStore } from '@/features/auth/authStore';
import { isFamilyRole, isSeniorRole } from '@/features/auth/roleRouting';
import { useFamilyMe, useFamilySeniors } from '@/features/family/hooks';
import { familyDisplayName } from '@/features/family/mappers';
import { seniorDisplayName } from '@/features/home/api/mappers';
import { getSectionState } from '@/features/home/selectors/homeViewModel';

/**
 * Family relationship screen — no mock people or fake invitations.
 * Family role: shows connected seniors via /families/seniors.
 * Senior role: no consumer API lists family members today — honest empty state.
 */
export default function FamilyScreen() {
  const role = useAuthStore((state) => state.user?.role);
  const family = isFamilyRole(role);
  const senior = isSeniorRole(role);

  if (!family) {
    return (
      <View style={styles.container}>
        <AgeWellHeader title="Family Members" showBack />
        <ScrollView contentContainerStyle={styles.content}>
          <EmptyState
            icon="people-outline"
            title={senior ? 'Family list not available yet' : 'Family relationships'}
            message={
              senior
                ? 'Your family connections are managed by AgeWell. There is no consumer API yet to list or invite family members from this screen.'
                : 'Sign in as a family member to see seniors you are authorized to support.'
            }
          />
          <Text style={styles.backendNote}>
            Backend required: family invitations, relationship labels, and senior-facing family member list.
          </Text>
        </ScrollView>
      </View>
    );
  }

  return <FamilyMembersForFamilyRole />;
}

function FamilyMembersForFamilyRole() {
  const me = useFamilyMe();
  const seniors = useFamilySeniors();
  const seniorsState = getSectionState({
    isPending: seniors.isPending,
    isError: seniors.isError,
    isEmpty: (seniors.data?.length ?? 0) === 0,
  });

  return (
    <View style={styles.container}>
      <AgeWellHeader title="Family & Seniors" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        {me.data ? (
          <View style={styles.card}>
            <Avatar name={familyDisplayName(me.data)} size={52} />
            <View style={styles.info}>
              <Text style={styles.name}>{familyDisplayName(me.data)}</Text>
              <Text style={styles.meta}>Your AgeWell family profile</Text>
            </View>
          </View>
        ) : null}

        <SectionTitle title="Connected seniors" subtitle="Only seniors you are authorized to support" />
        {seniorsState === 'loading' ? <LoadingState message="Loading…" /> : null}
        {seniorsState === 'error' ? (
          <ErrorState title="Unable to load" message="Please try again." onRetry={() => void seniors.refetch()} />
        ) : null}
        {seniorsState === 'empty' ? (
          <EmptyState
            icon="people-outline"
            title="No connected seniors"
            message="AgeWell staff link family access. There is no self-serve invite API yet."
          />
        ) : null}
        {seniors.data?.map((person) => (
          <View key={person.id} style={styles.card}>
            <Avatar name={seniorDisplayName(person)} size={52} />
            <View style={styles.info}>
              <Text style={styles.name}>{seniorDisplayName(person)}</Text>
              <Text style={styles.meta}>Authorized senior · Access granted by AgeWell</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.md },
  card: {
    ...cardSurface,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  info: { flex: 1 },
  name: { ...typography.subtitle, color: colors.text },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  backendNote: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
