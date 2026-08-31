import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '@/api/errors';
import { spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/authStore';
import { canAvailServices } from '@/features/auth/serviceAreaPreference';
import { FamilyHomeGreeting } from '@/features/home/components/FamilyHomeGreeting';
import { FamilyHomeTopBar } from '@/features/home/components/FamilyHomeTopBar';
import { FamilyImportantUpdates } from '@/features/home/components/FamilyImportantUpdates';
import {
  FamilyActiveMembershipCard,
  FamilyMembershipPlansCarousel,
  FamilySupportBanner,
  FamilyTalkToExpertBanner,
} from '@/features/home/components/FamilyMembershipSections';
import { FamilyOurServicesGrid, FamilyQuickServices } from '@/features/home/components/FamilyServicesSections';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { pickTrackableVisit } from '@/features/tracking/live';
import { invalidateTrackingQueries } from '@/features/tracking/queryKeys';
import { useTabScreenBottomPad } from '@/utils/safeBottom';
import { useHomeData } from './hooks/useHomeData';

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

function displayFirstName(greetingName: string | null, email: string | null | undefined): string {
  if (greetingName?.trim()) {
    return greetingName.trim().split(/\s+/)[0] ?? 'there';
  }
  const local = email?.split('@')[0]?.trim();
  if (local) {
    return local;
  }
  return 'there';
}

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const home = useHomeData();
  const email = useAuthStore((state) => state.user?.email);
  const [refreshing, setRefreshing] = useState(false);
  const bottomPad = useTabScreenBottomPad(spacing.xl);
  const servicesLive = canAvailServices();

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([home.refetchAll(), invalidateTrackingQueries()]);
    } finally {
      setRefreshing(false);
    }
  };

  const membershipMissing = isNotFound(home.membership.error);
  const membership = home.membership.data ?? null;
  const hasActiveMembership = Boolean(
    membership && !membershipMissing && membership.status.toUpperCase() !== 'EXPIRED',
  );
  const firstName = displayFirstName(home.viewModel.greetingName, email);
  const nextVisit = pickTrackableVisit(
    home.visits.data?.items,
    home.upcomingVisits.data?.items,
    home.myVisits.data?.items,
  );
  const usage = home.usage.data ?? [];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <FamilyHomeTopBar
        unreadCount={home.viewModel.unreadNotificationCount}
        profileName={home.viewModel.greetingName ?? email ?? firstName}
        profilePhotoUri={home.senior.data?.photo}
        profileHref={'/(tabs)/profile' as Href}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={familyHome.green} />
        }
      >
        <FamilyHomeGreeting
          firstName={firstName}
          subtitle="Trusted support for you and your loved ones."
        />

        {!servicesLive ? (
          <View style={styles.comingSoonBanner} accessibilityRole="summary">
            <Text style={styles.comingSoonTitle}>Coming soon in your area</Text>
            <Text style={styles.comingSoonBody}>
              Explore AgeWell services below. Booking and emergency dispatch open when we launch near you.
            </Text>
          </View>
        ) : null}

        {hasActiveMembership && servicesLive ? (
          <FamilyImportantUpdates
            parentStatusTitle="All Good"
            parentStatusSubtitle="Your care team is looking after today's plan."
            updatedLabel="Updated today"
            nextVisit={nextVisit}
            statusEyebrow="Your Status"
            notificationsHref={'/notifications' as Href}
            onOpenHealth={() => router.push('/(tabs)/health' as Href)}
            onOpenVisits={() => router.push('/visits' as Href)}
          />
        ) : null}

        <FamilyQuickServices />
        <FamilyOurServicesGrid />

        {hasActiveMembership && membership && servicesLive ? (
          <>
            <FamilyActiveMembershipCard membership={membership} usage={usage} />
            <FamilySupportBanner />
          </>
        ) : (
          <>
            <FamilyMembershipPlansCarousel />
            <FamilyTalkToExpertBanner />
          </>
        )}

        <View style={{ height: bottomPad }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: familyHome.white,
  },
  content: {
    flexGrow: 1,
    gap: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  comingSoonBanner: {
    marginHorizontal: spacing.xl,
    borderRadius: 16,
    backgroundColor: '#FFF4EB',
    borderWidth: 1,
    borderColor: '#F5D0B5',
    padding: spacing.lg,
    gap: spacing.xs,
  },
  comingSoonTitle: {
    ...typography.bodyStrong,
    color: '#C45C12',
  },
  comingSoonBody: {
    ...typography.body,
    color: '#6B6B6B',
  },
});
