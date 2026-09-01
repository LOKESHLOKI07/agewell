import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '@/api/errors';
import { spacing } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/authStore';
import { canAvailServices } from '@/features/auth/serviceAreaPreference';
import { FamilyHomeTopBar } from '@/features/home/components/FamilyHomeTopBar';
import {
  FamilyMembershipPlansCarousel,
  FamilyTalkToExpertBanner,
} from '@/features/home/components/FamilyMembershipSections';
import { FamilyMembershipCtaCard } from '@/features/home/components/FamilyMembershipCtaCard';
import { FamilyCompleteCareBanner } from '@/features/home/components/FamilyCompleteCareBanner';
import { FamilyMemberHeroCard } from '@/features/home/components/FamilyMemberHeroCard';
import { FamilyMembersStatus } from '@/features/home/components/FamilyMembersStatus';
import { FamilyServiceableAreaBanner } from '@/features/home/components/FamilyServiceableAreaBanner';
import { FamilyUnserviceableAreaBanner } from '@/features/home/components/FamilyUnserviceableAreaBanner';
import { FamilyUpcomingSplit } from '@/features/home/components/FamilyUpcomingSplit';
import { FamilyAddOnServices, FamilyOurServicesGrid } from '@/features/home/components/FamilyServicesSections';
import { FamilyWhyChooseAgeWell } from '@/features/home/components/FamilyWhyChooseAgeWell';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { resolveHomeScreenVariant } from '@/features/home/homeVariant';
import { invalidateTrackingQueries } from '@/features/tracking/queryKeys';
import { useTabScreenBottomPad } from '@/utils/safeBottom';
import { useHomeData } from './hooks/useHomeData';

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

function displayGreetingName(greetingName: string | null, email: string | null | undefined): string {
  if (greetingName?.trim()) {
    return greetingName.trim();
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
  const variant = resolveHomeScreenVariant(servicesLive, hasActiveMembership);
  const greetingName = displayGreetingName(home.viewModel.greetingName, email);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <FamilyHomeTopBar
        unreadCount={home.viewModel.unreadNotificationCount}
        profileName={home.viewModel.greetingName ?? email ?? greetingName}
        profilePhotoUri={home.senior.data?.photo}
        profileHref={'/(tabs)/profile' as Href}
        showChat={variant === 'serviceable_with_membership'}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={familyHome.green} />
        }
      >
        {variant === 'non_serviceable' ? (
          <>
            <FamilyUnserviceableAreaBanner />
            <FamilyCompleteCareBanner />
            <FamilyOurServicesGrid />
            <FamilyAddOnServices />
            <FamilyWhyChooseAgeWell />
            <FamilyMembershipPlansCarousel />
            <FamilyTalkToExpertBanner />
          </>
        ) : null}

        {variant === 'serviceable_no_membership' ? (
          <>
            <FamilyServiceableAreaBanner />
            <FamilyMembershipCtaCard />
            <FamilyOurServicesGrid />
            <FamilyAddOnServices />
            <FamilyWhyChooseAgeWell />
            <FamilyMembershipPlansCarousel />
          </>
        ) : null}

        {variant === 'serviceable_with_membership' && membership ? (
          <>
            <FamilyServiceableAreaBanner flush />
            <FamilyMemberHeroCard
              greetingName={greetingName}
              senior={home.senior.data ?? null}
              membership={membership}
            />
            <FamilyMembersStatus youName={greetingName} youPhotoUri={home.senior.data?.photo} />
            <FamilyUpcomingSplit requests={home.serviceRequests.data?.items ?? []} />
            <FamilyOurServicesGrid title="Basic Membership Services" showViewAll />
            <FamilyAddOnServices showViewAll />
          </>
        ) : null}

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
});
