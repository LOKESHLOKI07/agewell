import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components';
import { SectionTitle } from '@/components/ui';
import { ScheduleCard } from '@/components/premium';
import { colors, spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { HomeInlineError, HomeSkeletonRow } from '@/features/home/components/HomeInlineStatus';
import {
  useMedications,
  useServiceRequests,
  useTodayVisits,
  useUpcomingAppointments,
} from '@/features/home/hooks/queries';
import {
  buildTodayCareItems,
  formatCareTime,
  getSectionState,
  groupCareItemsByPeriod,
} from '@/features/home/selectors/homeViewModel';
import { useI18n } from '@/i18n';

export function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [refreshing, setRefreshing] = useState(false);
  const visits = useTodayVisits();
  const appointments = useUpcomingAppointments();
  const medications = useMedications();
  const services = useServiceRequests();

  const items = useMemo(
    () =>
      buildTodayCareItems({
        visits: visits.data?.items ?? [],
        appointments: appointments.data?.items ?? [],
        medications: medications.data?.items ?? [],
        serviceRequests: services.data?.items ?? [],
      }),
    [visits.data, appointments.data, medications.data, services.data],
  );

  const sections = useMemo(() => groupCareItemsByPeriod(items), [items]);
  const pending = [visits, appointments, medications, services].some((q) => q.isPending);
  const error = [visits, appointments, medications, services].find((q) => q.isError)?.error;
  const state = getSectionState({
    isPending: pending && items.length === 0,
    isError: Boolean(error) && items.length === 0,
    isEmpty: items.length === 0,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([visits.refetch(), appointments.refetch(), medications.refetch(), services.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title={t('schedule.title')} showBack showProfile={false} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.primary} />
        }
      >
        <Text style={styles.intro}>
          Care visits, doctor appointments, medicines, and service requests from your AgeWell records.
        </Text>

        {state === 'loading' ? (
          <View style={styles.list}>
            <HomeSkeletonRow />
            <HomeSkeletonRow />
            <HomeSkeletonRow />
          </View>
        ) : state === 'error' ? (
          <HomeInlineError
            error={error}
            onRetry={() => {
              void onRefresh();
            }}
          />
        ) : state === 'empty' ? (
          <EmptyState
            icon="calendar-outline"
            title="No schedule items"
            message={t('schedule.empty')}
            actionLabel="Browse services"
            onAction={() => router.push('/(tabs)/services' as Href)}
          />
        ) : (
          sections.map((section) => (
            <View key={section.period} style={styles.section}>
              <SectionTitle title={section.label} />
              <View style={styles.list}>
                {section.items.map((item) => (
                  <ScheduleCard
                    key={item.id}
                    title={item.title}
                    subtitle={item.subtitle}
                    status={item.status}
                    timeLabel={item.sortAt ? formatCareTime(new Date(item.sortAt).toISOString()) : null}
                    icon={item.icon}
                    onPress={item.href ? () => router.push(item.href as Href) : undefined}
                  />
                ))}
              </View>
            </View>
          ))
        )}
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
    paddingBottom: spacing.huge,
    gap: spacing.lg,
  },
  intro: {
    ...typography.body,
    color: colors.textSecondary,
  },
  section: {
    gap: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
});
