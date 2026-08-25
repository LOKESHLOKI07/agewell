import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SectionTitle } from '@/components/ui';
import { ScheduleCard } from '@/components/premium';
import { colors, layout, spacing, typography } from '@/constants/theme';
import { queryClient } from '@/api/queryClient';
import { findActiveEmergency } from '@/features/emergency/mappers';
import { emergencyDetailHref } from '@/features/emergency/selectors';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { getSectionState, appointmentToCareItem, formatCareTime } from '@/features/home/selectors/homeViewModel';
import { useUnreadNotifications } from '@/features/notifications/hooks';
import { FamilyActivityTimeline } from './components/FamilyActivityTimeline';
import { FamilyCareStatusCard } from './components/FamilyCareStatusCard';
import { FamilyEmergencyCard } from './components/FamilyEmergencyCard';
import { FamilyLookingAfterCard } from './components/FamilyLookingAfterCard';
import { FamilyQueryView } from './components/FamilyQueryView';
import { FamilyTodaySummary } from './components/FamilyTodaySummary';
import { FamilyUpcomingVisitCard } from './components/FamilyUpcomingVisitCard';
import { FamilyLiveTrackingCard } from '@/features/tracking/components/FamilyLiveTrackingCard';
import { TrackCareAssociateCard } from '@/features/tracking/components/TrackCareAssociateCard';
import { familyAssociateTrackHref } from '@/features/tracking/selectors';
import { invalidateTrackingQueries } from '@/features/tracking/queryKeys';
import {
  useFamilyAppointments,
  useFamilyEmergencyCases,
  useFamilyMe,
  useFamilyMedicationSchedules,
  useFamilyMembership,
  useFamilyScope,
  useFamilyServiceRequests,
  useFamilyTodayVisits,
  useFamilyUpcomingVisits,
  useSelectFamilySenior,
} from './hooks';
import { familyDisplayName } from './mappers';
import { seniorDisplayName } from '@/features/home/api/mappers';
import { familyQueryKeys } from './queryKeys';
import {
  familyCareStatusCopy,
  familyDashboardStats,
  familyLastCheckIn,
  familyRecentActivity,
  familyUpcomingVisit,
  familyVisitDetailHref,
} from './selectors';
import { useI18n } from '@/i18n';

export function FamilyDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [refreshing, setRefreshing] = useState(false);
  const me = useFamilyMe();
  const { seniorsQuery, selectedSeniorId, selectedSenior } = useFamilyScope();
  const selectSenior = useSelectFamilySenior();
  const unread = useUnreadNotifications();
  const todayVisits = useFamilyTodayVisits(selectedSeniorId);
  const upcomingVisits = useFamilyUpcomingVisits(selectedSeniorId);
  const appointments = useFamilyAppointments(selectedSeniorId, true);
  const medications = useFamilyMedicationSchedules(selectedSeniorId);
  const services = useFamilyServiceRequests(selectedSeniorId);
  const membership = useFamilyMembership(selectedSeniorId);
  const emergencies = useFamilyEmergencyCases(selectedSeniorId);

  const greeting = me.data ? familyDisplayName(me.data) : null;
  const parentFirst = selectedSenior?.firstName ?? 'They';
  const activeEmergency = findActiveEmergency(emergencies.data?.items ?? []);
  const nextVisit = familyUpcomingVisit(todayVisits.data?.items ?? [], upcomingVisits.data?.items ?? []);
  const careStatus = familyCareStatusCopy({
    firstName: parentFirst,
    hasEmergency: Boolean(activeEmergency),
    lastCheckIn: familyLastCheckIn([...(todayVisits.data?.items ?? []), ...(upcomingVisits.data?.items ?? [])]),
  });
  const stats = familyDashboardStats({
    visitCount: todayVisits.data?.items.length ?? 0,
    medicationCount: medications.data?.items.length ?? 0,
    appointmentCount: appointments.data?.items.length ?? 0,
    hasEmergency: Boolean(activeEmergency),
    emergencyId: activeEmergency?.id,
  });
  const activity = familyRecentActivity({
    visits: todayVisits.data?.items ?? [],
    appointments: appointments.data?.items ?? [],
    services: services.data?.items ?? [],
  });
  const upcomingAppointments = (appointments.data?.items ?? []).slice(0, 3);
  const medPreview = (medications.data?.items ?? []).slice(0, 3);

  const seniorsState = getSectionState({
    isPending: seniorsQuery.isPending,
    isError: seniorsQuery.isError,
    isEmpty: (seniorsQuery.data?.length ?? 0) === 0,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: familyQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await invalidateTrackingQueries();
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader
        title={t('brand.name')}
        subtitle={t('family.dashboard')}
        unreadCount={unread.data?.total ?? 0}
        profileName={greeting}
        showOnline
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.primary} />
        }
      >
        <FamilyQueryView
          state={seniorsState}
          error={seniorsQuery.error}
          onRetry={() => void seniorsQuery.refetch()}
          loadingMessage="Loading connected seniors..."
          emptyIcon="people-outline"
          emptyTitle="No connected seniors"
          emptyMessage="Seniors you are authorized to support will appear here."
        >
          <FamilyLookingAfterCard
            seniors={seniorsQuery.data ?? []}
            selectedSenior={selectedSenior}
            planName={membership.data?.planName}
            onSelect={(seniorId) => void selectSenior.mutateAsync(seniorId)}
            disabled={selectSenior.isPending}
          />
        </FamilyQueryView>

        {selectedSeniorId ? (
          <>
            <FamilyCareStatusCard
              title={careStatus.title}
              subtitle={careStatus.subtitle}
              checkIn={careStatus.checkIn}
              tone={careStatus.tone}
              onPress={() => router.push('/(family)/health' as Href)}
            />
            <FamilyEmergencyCard
              emergency={activeEmergency}
              onPress={
                activeEmergency
                  ? () => router.push(emergencyDetailHref(activeEmergency.id) as unknown as Href)
                  : undefined
              }
            />

            <View style={styles.section}>
              <SectionTitle title={t('family.associateTracking')} />
              {nextVisit ? (
                <TrackCareAssociateCard
                  visit={nextVisit}
                  href={familyAssociateTrackHref(nextVisit.id)}
                  actionLabel={t('tracking.track')}
                />
              ) : (
                <Text style={styles.hint}>No assigned visit to track right now.</Text>
              )}
            </View>

            <View style={styles.section}>
              <SectionTitle title={t('family.seniorLocation')} />
              <FamilyLiveTrackingCard
                seniorId={selectedSeniorId}
                seniorName={selectedSenior ? seniorDisplayName(selectedSenior) : parentFirst}
              />
            </View>

            <View style={styles.section}>
              <SectionTitle
                title={t('family.todaysCare')}
                actionLabel={t('notifications.title')}
                onAction={() => router.push('/(family)/notifications' as Href)}
              />
              <FamilyTodaySummary stats={stats} />
            </View>

            <View style={styles.section}>
              <SectionTitle
                title={t('family.upcomingVisit')}
                actionLabel={t('common.viewAll')}
                onAction={() => router.push('/(family)/visits' as Href)}
              />
              {nextVisit ? (
                <FamilyUpcomingVisitCard
                  visit={nextVisit}
                  onPress={() => router.push(familyVisitDetailHref(nextVisit.id) as unknown as Href)}
                />
              ) : (
                <FamilyQueryView
                  state={getSectionState({
                    isPending: todayVisits.isPending || upcomingVisits.isPending,
                    isError: todayVisits.isError || upcomingVisits.isError,
                    isEmpty: true,
                  })}
                  error={todayVisits.error ?? upcomingVisits.error}
                  onRetry={() => {
                    void todayVisits.refetch();
                    void upcomingVisits.refetch();
                  }}
                  loadingMessage="Loading visits..."
                  emptyIcon="calendar-outline"
                  emptyTitle="No upcoming visits"
                  emptyMessage="Scheduled visits will appear here."
                >
                  {null}
                </FamilyQueryView>
              )}
            </View>

            <View style={styles.section}>
              <SectionTitle
                title={t('family.appointments')}
                actionLabel={t('common.viewAll')}
                onAction={() => router.push('/family/health/appointments' as Href)}
              />
              {upcomingAppointments.length === 0 ? (
                <Text style={styles.hint}>No upcoming appointments on file.</Text>
              ) : (
                upcomingAppointments.map((appointment) => {
                  const item = appointmentToCareItem(appointment);
                  return (
                    <ScheduleCard
                      key={appointment.id}
                      title={item.title}
                      subtitle={item.subtitle}
                      status={item.status}
                      timeLabel={formatCareTime(appointment.scheduledAt)}
                      icon="medkit"
                      onPress={() =>
                        router.push({
                          pathname: '/family/health/appointments/[id]',
                          params: { id: appointment.id },
                        } as Href)
                      }
                    />
                  );
                })
              )}
            </View>

            <View style={styles.section}>
              <SectionTitle
                title={t('family.medications')}
                actionLabel={t('common.viewAll')}
                onAction={() => router.push('/family/health/medications' as Href)}
              />
              {medPreview.length === 0 ? (
                <Text style={styles.hint}>No medication schedules on file.</Text>
              ) : (
                medPreview.map((med) => (
                  <ScheduleCard
                    key={med.id}
                    title={med.medicationName}
                    subtitle={[med.dosage, med.scheduleTime, med.frequency].filter(Boolean).join(' · ')}
                    status={null}
                    icon="water"
                    onPress={() => router.push('/family/health/medications' as Href)}
                  />
                ))
              )}
            </View>

            <View style={styles.section}>
              <SectionTitle
                title={t('family.recentActivity')}
                actionLabel={t('common.viewAll')}
                onAction={() => router.push('/(family)/notifications' as Href)}
              />
              <FamilyActivityTimeline items={activity} />
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: layout.tabBarHeight + spacing.huge,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  hint: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
