import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PillTabs } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { CareQueryView } from './components/CareQueryView';
import { CareScreen } from './components/CareScreen';
import { StaffScheduleSection } from './components/StaffScheduleSection';
import { useCareManagerProfile, useCareManagerTodayVisits, useDeliveries } from './hooks';
import {
  COMPLETED_DELIVERY_STATUSES,
  COMPLETED_VISIT_STATUSES,
  PENDING_DELIVERY_STATUSES,
  PENDING_VISIT_STATUSES,
  deliveryDetailHref,
  visitDetailHref,
} from './selectors';
import { parseStaffKind } from './staffKind';
import {
  asDeliveryList,
  asVisitList,
  deliveryToStaffScheduleItem,
  visitToStaffScheduleItem,
} from './staffHomeModel';
import { staffHomeConfig } from './staffHomeConfig';

type TaskFilter = 'all' | 'pending' | 'completed';

export function StaffTasksScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TaskFilter>('all');
  const profile = useCareManagerProfile();
  const staffKind = parseStaffKind(profile.data?.staffKind);
  const isDelivery = staffKind === 'DELIVERY_EXECUTIVE';
  const config = staffHomeConfig(staffKind);
  const visitsQuery = useCareManagerTodayVisits();
  const deliveriesQuery = useDeliveries();

  const visits = asVisitList(visitsQuery.data?.items);
  const deliveries = asDeliveryList(deliveriesQuery.data?.items);

  const allItems = useMemo(() => {
    if (isDelivery) {
      return deliveries.map(deliveryToStaffScheduleItem);
    }
    return visits.map((visit) => visitToStaffScheduleItem(visit, config.itemPrefix));
  }, [config.itemPrefix, deliveries, isDelivery, visits]);

  const pendingItems = useMemo(() => {
    if (isDelivery) {
      return deliveries
        .filter((item) => PENDING_DELIVERY_STATUSES.has(item.status))
        .map(deliveryToStaffScheduleItem);
    }
    return visits
      .filter((visit) => PENDING_VISIT_STATUSES.has(visit.status))
      .map((visit) => visitToStaffScheduleItem(visit, config.itemPrefix));
  }, [config.itemPrefix, deliveries, isDelivery, visits]);

  const completedItems = useMemo(() => {
    if (isDelivery) {
      return deliveries
        .filter((item) => COMPLETED_DELIVERY_STATUSES.has(item.status))
        .map(deliveryToStaffScheduleItem);
    }
    return visits
      .filter((visit) => COMPLETED_VISIT_STATUSES.has(visit.status))
      .map((visit) => visitToStaffScheduleItem(visit, config.itemPrefix));
  }, [config.itemPrefix, deliveries, isDelivery, visits]);

  const filtered =
    tab === 'pending' ? pendingItems : tab === 'completed' ? completedItems : allItems;

  const query = isDelivery ? deliveriesQuery : visitsQuery;
  const state = getSectionState({
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: filtered.length === 0,
  });

  const options = [
    { value: 'all' as const, label: `All (${allItems.length})` },
    { value: 'pending' as const, label: `Pending (${pendingItems.length})` },
    { value: 'completed' as const, label: `Completed (${completedItems.length})` },
  ];

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <CareScreen
        title="My Tasks"
        subtitle={isDelivery ? 'Deliveries assigned to you today.' : 'Visits assigned to you today.'}
      >
        <View style={styles.tabs}>
          <PillTabs value={tab} options={options} onChange={setTab} accessibilityLabel="Task filters" />
        </View>
        <CareQueryView
          state={state}
          error={query.error}
          onRetry={() => void query.refetch()}
          loadingMessage={isDelivery ? 'Loading deliveries...' : 'Loading tasks...'}
          emptyIcon={config.emptyIcon}
          emptyTitle={
            tab === 'completed' ? 'No completed tasks' : tab === 'pending' ? 'No pending tasks' : config.emptyTitle
          }
          emptyMessage={config.emptyMessage}
        >
          <StaffScheduleSection
            title={tab === 'all' ? 'All tasks' : tab === 'pending' ? 'Pending' : 'Completed'}
            items={filtered}
            onPressItem={(item) => {
              if (isDelivery) {
                router.push(deliveryDetailHref(item.id) as unknown as Href);
              } else {
                router.push(visitDetailHref(item.id) as unknown as Href);
              }
            }}
          />
        </CareQueryView>
      </CareScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabs: {
    marginBottom: spacing.xl,
  },
});
