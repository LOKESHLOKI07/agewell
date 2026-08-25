import { StyleSheet, Text, View } from 'react-native';
import { EmptyState, ErrorState } from '@/components';
import { colors, spacing, typography } from '@/constants/theme';
import { FamilySubScreen } from '@/features/family/components/FamilySubScreen';
import { FamilyQueryView } from '@/features/family/components/FamilyQueryView';
import { SeniorSelector } from '@/features/family/components/SeniorSelector';
import { useFamilyScope, useSelectFamilySenior } from '@/features/family/hooks';
import { seniorDisplayName } from '@/features/home/api/mappers';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { GpsStatusCard } from './components/GpsStatusCard';
import { useSeniorViewerLocation } from './hooks';

export function FamilyTrackingScreen() {
  const { seniorsQuery, selectedSeniorId, selectedSenior } = useFamilyScope();
  const selectSenior = useSelectFamilySenior();
  const viewer = useSeniorViewerLocation(selectedSeniorId);
  const seniorsState = getSectionState({
    isPending: seniorsQuery.isPending,
    isError: seniorsQuery.isError,
    isEmpty: (seniorsQuery.data?.length ?? 0) === 0,
  });
  const parentName = selectedSenior ? seniorDisplayName(selectedSenior) : 'this senior';

  return (
    <FamilySubScreen title="Live location">
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
        <View style={styles.block}>
          <Text style={styles.hint}>Showing location shared by {parentName}. This is not your location.</Text>
          {viewer.state.kind === 'error' || viewer.state.kind === 'forbidden' ? (
            <ErrorState
              title={viewer.state.title}
              message={viewer.state.message}
              onRetry={() => {
                void viewer.sessions.refetch();
                void viewer.latest.refetch();
              }}
            />
          ) : (
            <GpsStatusCard title={viewer.state.title} message={viewer.state.message} point={viewer.state.point} />
          )}
        </View>
      ) : seniorsQuery.isSuccess && (seniorsQuery.data?.length ?? 0) > 0 ? (
        <EmptyState
          icon="location"
          title="Select a senior"
          message="Choose an authorized senior to view live location."
        />
      ) : null}
    </FamilySubScreen>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
