import { useState } from 'react';

import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { router, type Href } from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/errors';

import { spacing } from '@/constants/theme';

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

import { FamilyMembershipCtaCard } from '@/features/home/components/FamilyMembershipCtaCard';

import { FamilyCompleteCareBanner } from '@/features/home/components/FamilyCompleteCareBanner';

import { FamilyServiceableAreaBanner } from '@/features/home/components/FamilyServiceableAreaBanner';

import { FamilyUnserviceableAreaBanner } from '@/features/home/components/FamilyUnserviceableAreaBanner';

import { FamilyAddOnServices, FamilyOurServicesGrid } from '@/features/home/components/FamilyServicesSections';
import { FamilyWhyChooseAgeWell } from '@/features/home/components/FamilyWhyChooseAgeWell';

import { familyHome } from '@/features/home/components/familyHomeTheme';

import { resolveHomeScreenVariant } from '@/features/home/homeVariant';

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

  const variant = resolveHomeScreenVariant(servicesLive, hasActiveMembership);

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



        {variant === 'serviceable_with_membership' ? (

          <>

            <FamilyHomeGreeting

              firstName={firstName}

              subtitle="Trusted support for you and your loved ones."

            />

            <FamilyImportantUpdates

              parentStatusTitle="All Good"

              parentStatusSubtitle="Your care team is looking after today's plan."

              updatedLabel="Updated today"

              nextVisit={nextVisit}

              statusEyebrow="Your Status"

              notificationsHref={'/notifications' as Href}

              onOpenHealth={() => router.push('/membership/medical-history' as Href)}

              onOpenVisits={() => router.push('/membership/care-manager' as Href)}

            />

            <FamilyOurServicesGrid />

            <FamilyAddOnServices />

            <FamilyActiveMembershipCard membership={membership!} usage={usage} />

            <FamilySupportBanner />

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


