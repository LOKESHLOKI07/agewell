import { router, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/constants/theme';
import { seniorDisplayName } from '@/features/home/api/mappers';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { FamilyQueryView } from './components/FamilyQueryView';
import { FamilySubScreen } from './components/FamilySubScreen';
import { FamilyVisitCard } from './components/FamilyVisitCard';
import { SeniorSelector } from './components/SeniorSelector';
import {
  useFamilyScope,
  useFamilyTodayVisits,
  useFamilyUpcomingVisits,
  useSelectFamilySenior,
} from './hooks';
import { familyVisitDetailHref } from './selectors';

export function FamilyVisitsScreen() {
  const { seniorsQuery, selectedSeniorId, selectedSenior } = useFamilyScope();
  const selectSenior = useSelectFamilySenior();
  const today = useFamilyTodayVisits(selectedSeniorId);
  const upcoming = useFamilyUpcomingVisits(selectedSeniorId);
  const parentName = selectedSenior ? seniorDisplayName(selectedSenior) : 'this senior';

  const seniorsState = getSectionState({
    isPending: seniorsQuery.isPending,
    isError: seniorsQuery.isError,
    isEmpty: (seniorsQuery.data?.length ?? 0) === 0,
  });
  const todayState = getSectionState({
    isPending: today.isPending,
    isError: today.isError,
    isEmpty: (today.data?.items.length ?? 0) === 0,
  });
  const upcomingState = getSectionState({
    isPending: upcoming.isPending,
    isError: upcoming.isError,
    isEmpty: (upcoming.data?.items.length ?? 0) === 0,
  });

  return (
    <FamilySubScreen title="Visits" showBack={false}>
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
        <>
          <Text style={styles.section}>Today · {parentName}</Text>
          <FamilyQueryView
            state={todayState}
            error={today.error}
            onRetry={() => void today.refetch()}
            loadingMessage="Loading today's visits..."
            emptyIcon="calendar-outline"
            emptyTitle="No visits today"
            emptyMessage="No visits scheduled today."
          >
            <View style={styles.list}>
              {today.data?.items.map((visit) => (
                <FamilyVisitCard
                  key={visit.id}
                  visit={visit}
                  onPress={() => router.push(familyVisitDetailHref(visit.id) as unknown as Href)}
                />
              ))}
            </View>
          </FamilyQueryView>

          <Text style={styles.section}>Upcoming</Text>
          <FamilyQueryView
            state={upcomingState}
            error={upcoming.error}
            onRetry={() => void upcoming.refetch()}
            loadingMessage="Loading upcoming visits..."
            emptyIcon="time-outline"
            emptyTitle="No upcoming visits"
            emptyMessage="Upcoming visits will appear here."
          >
            <View style={styles.list}>
              {upcoming.data?.items.map((visit) => (
                <FamilyVisitCard
                  key={visit.id}
                  visit={visit}
                  onPress={() => router.push(familyVisitDetailHref(visit.id) as unknown as Href)}
                />
              ))}
            </View>
          </FamilyQueryView>
        </>
      ) : null}
    </FamilySubScreen>
  );
}

const styles = StyleSheet.create({
  section: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
});
