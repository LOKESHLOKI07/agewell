import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, spacing } from '@/constants/theme';
import { ApiError } from '@/api/errors';
import { useHomeData } from './hooks/useHomeData';
import { getSectionState } from './selectors/homeViewModel';
import { AgeWellHeader } from './components/AgeWellHeader';
import { EmergencyBanner } from './components/EmergencyBanner';
import { TodayOverview } from './components/TodayOverview';
import { QuickServices } from './components/QuickServices';
import { LiveTrackingCard } from '@/features/tracking/components/LiveTrackingCard';
import { TrackCareAssociateCard } from '@/features/tracking/components/TrackCareAssociateCard';
import { pickTrackableVisit } from '@/features/tracking/live';
import { seniorAssociateTrackHref } from '@/features/tracking/selectors';
import { invalidateTrackingQueries } from '@/features/tracking/queryKeys';
import { MembershipSummary } from './components/MembershipSummary';
import { ExploreAgeWell } from './components/ExploreAgeWell';
import { WhyAgeWell } from './components/WhyAgeWell';

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const home = useHomeData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([home.refetchAll(), invalidateTrackingQueries()]);
    } finally {
      setRefreshing(false);
    }
  };

  const todayHasItems = home.viewModel.todayItems.length > 0;
  const todayQueries = [home.visits, home.appointments, home.medications, home.serviceRequests];
  const todayPending = todayQueries.some((query) => query.isPending);
  const todayError = todayQueries.find((query) => query.isError)?.error;
  const todayState = getSectionState({
    isPending: todayPending && !todayHasItems,
    isError: Boolean(todayError) && !todayHasItems,
    isEmpty: !todayHasItems,
  });

  const nameState = getSectionState({
    isPending: home.senior.isPending,
    isError: home.senior.isError,
    isEmpty: !home.viewModel.greetingName,
  });

  const servicesState = getSectionState({
    isPending: home.services.isPending,
    isError: home.services.isError,
    isEmpty: (home.services.data?.length ?? 0) === 0,
  });

  const membershipMissing = isNotFound(home.membership.error);
  const membershipState = getSectionState({
    isPending: home.membership.isPending,
    isError: home.membership.isError && !membershipMissing,
    isEmpty: membershipMissing || !home.viewModel.membership,
  });

  const usageState = getSectionState({
    isPending: home.usage.isPending,
    isError: home.usage.isError,
    isEmpty: (home.usage.data?.length ?? 0) === 0,
  });
  const trackVisit = pickTrackableVisit(
    home.visits.data?.items,
    home.upcomingVisits.data?.items,
    home.myVisits.data?.items,
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader
        unreadCount={home.viewModel.unreadNotificationCount}
        profileName={home.viewModel.greetingName}
        showGreeting
        showTagline
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.primary} />
        }
      >
        <EmergencyBanner />
        <TodayOverview
          userName={home.viewModel.greetingName}
          nameState={nameState}
          nameError={home.senior.error}
          onRetryName={() => {
            void home.senior.refetch();
          }}
          items={home.viewModel.todayItems}
          todayState={todayState}
          todayError={todayError}
          onRetryToday={() => {
            void Promise.allSettled(todayQueries.map((query) => query.refetch()));
          }}
        />
        <QuickServices
          services={home.viewModel.quickServices}
          state={servicesState}
          error={home.services.error}
          onRetry={() => {
            void home.services.refetch();
          }}
        />
        <View style={styles.trackSection}>
          <TrackCareAssociateCard
            visit={trackVisit}
            href={trackVisit ? seniorAssociateTrackHref(trackVisit.id) : '/visits'}
            emptyHref="/visits"
            actionLabel="Track"
          />
        </View>
        <LiveTrackingCard homeAddress={home.senior.data?.address} />
        <MembershipSummary
          planName={home.viewModel.membership?.planName ?? null}
          status={home.viewModel.membership?.status ?? null}
          startDate={home.viewModel.membership?.startDate ?? null}
          endDate={home.viewModel.membership?.endDate ?? null}
          usage={home.viewModel.membership?.usage ?? []}
          membershipState={membershipState}
          membershipError={home.membership.error}
          onRetryMembership={() => {
            void home.membership.refetch();
          }}
          usageState={usageState}
          usageError={home.usage.error}
          onRetryUsage={() => {
            void home.usage.refetch();
          }}
        />
        <ExploreAgeWell />
        <WhyAgeWell />
        <View style={{ height: layout.tabBarHeight + spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  trackSection: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 12,
  },
});
