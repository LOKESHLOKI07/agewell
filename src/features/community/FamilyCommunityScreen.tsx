import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/components';
import { FamilySubScreen } from '@/features/family/components/FamilySubScreen';
import { colors, spacing, typography } from '@/constants/theme';
import { SeniorSelector } from '@/features/family/components/SeniorSelector';
import { FamilyQueryView } from '@/features/family/components/FamilyQueryView';
import { useFamilyScope, useSelectFamilySenior } from '@/features/family/hooks';
import { seniorDisplayName } from '@/features/home/api/mappers';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { CommunityFeedScreen } from './CommunityScreen';
import { EventDetailScreen } from './EventDetailScreen';
import { familyCommunityEventHref } from './selectors';

export function FamilyCommunityScreen() {
  const { seniorsQuery, selectedSeniorId, selectedSenior } = useFamilyScope();
  const selectSenior = useSelectFamilySenior();
  const seniorsState = getSectionState({
    isPending: seniorsQuery.isPending,
    isError: seniorsQuery.isError,
    isEmpty: (seniorsQuery.data?.length ?? 0) === 0,
  });
  const parentName = selectedSenior ? seniorDisplayName(selectedSenior) : null;

  return (
    <CommunityFeedScreen
      title="Community"
      subtitle={parentName ? `Register ${parentName}` : 'Family'}
      seniorUserId={selectedSenior?.userId ?? null}
      registerSeniorId={selectedSeniorId}
      requireSeniorToRegister
      eventHref={(id) => familyCommunityEventHref(id)}
      header={
        <View style={styles.header}>
          <FamilyQueryView
            state={seniorsState}
            error={seniorsQuery.error}
            onRetry={() => void seniorsQuery.refetch()}
            loadingMessage="Loading connected seniors..."
            emptyIcon="people-outline"
            emptyTitle="No connected seniors"
            emptyMessage="Seniors you are authorized to support will appear here."
          >
            <SeniorSelector
              seniors={seniorsQuery.data ?? []}
              selectedSeniorId={selectedSeniorId}
              onSelect={(seniorId) => void selectSenior.mutateAsync(seniorId)}
              disabled={selectSenior.isPending}
            />
          </FamilyQueryView>
          {selectedSeniorId ? (
            <Text style={styles.hint}>Events are shared. Registration is for {parentName}.</Text>
          ) : null}
        </View>
      }
    />
  );
}

export function FamilyCommunityEventScreen({ eventId }: { eventId: string | undefined }) {
  const { seniorsQuery, selectedSeniorId, selectedSenior } = useFamilyScope();
  if (!selectedSeniorId && seniorsQuery.isSuccess && (seniorsQuery.data?.length ?? 0) === 0) {
    return (
      <FamilySubScreen title="Event">
        <EmptyState
          icon="people-outline"
          title="No connected seniors"
          message="Seniors you are authorized to support will appear here."
        />
      </FamilySubScreen>
    );
  }
  return (
    <EventDetailScreen
      eventId={eventId}
      title="Event"
      seniorUserId={selectedSenior?.userId ?? null}
      registerSeniorId={selectedSeniorId}
      requireSeniorToRegister
    />
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
});
