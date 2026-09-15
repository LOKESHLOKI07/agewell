import { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';
import { router, type Href } from 'expo-router';
import { colors } from '@/constants/theme';
import { queryClient } from '@/api/queryClient';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { useUnreadNotifications } from '@/features/notifications/hooks';
import { notificationQueryKeys } from '@/features/notifications/queryKeys';
import { CareQueryView } from './components/CareQueryView';
import { StaffDutyHomeLayout } from './components/StaffDutyHomeLayout';
import { StaffScheduleSection } from './components/StaffScheduleSection';
import { useAttendanceToday, useCareManagerProfile, useDeliveries } from './hooks';
import { careQueryKeys } from './queryKeys';
import { deliveryDetailHref } from './selectors';
import {
  asDeliveryList,
  buildDeliveryStaffSummary,
  deliveryToStaffScheduleItem,
  dutySinceLabelFromAttendance,
  isAttendanceOnDuty,
} from './staffHomeModel';
import { staffHomeConfig } from './staffHomeConfig';

export function DeliveryHomeScreen() {
  const config = staffHomeConfig('DELIVERY_EXECUTIVE');
  const [refreshing, setRefreshing] = useState(false);
  const profile = useCareManagerProfile();
  const deliveriesQuery = useDeliveries();
  const attendance = useAttendanceToday();
  const notifications = useUnreadNotifications();
  const deliveries = asDeliveryList(deliveriesQuery.data?.items);
  const stats = buildDeliveryStaffSummary(config, deliveries);
  const items = deliveries.map(deliveryToStaffScheduleItem);
  const listState = getSectionState({
    isPending: deliveriesQuery.isPending,
    isError: deliveriesQuery.isError,
    isEmpty: deliveries.length === 0,
  });
  const onDuty = isAttendanceOnDuty(attendance.data);
  const dutySinceLabel = dutySinceLabelFromAttendance(attendance.data);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: careQueryKeys.profile }),
        queryClient.invalidateQueries({ queryKey: careQueryKeys.deliveries }),
        queryClient.invalidateQueries({ queryKey: careQueryKeys.attendanceToday }),
        queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <StaffDutyHomeLayout
      config={config}
      name={profile.data?.name}
      unreadCount={notifications.data?.total ?? 0}
      onDuty={onDuty}
      dutySinceLabel={dutySinceLabel}
      onDutyPress={() => router.push('/care/attendance' as Href)}
      stats={stats}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.primary} />
      }
    >
      <CareQueryView
        state={listState}
        error={deliveriesQuery.error}
        onRetry={() => void deliveriesQuery.refetch()}
        loadingMessage="Loading deliveries..."
        emptyIcon={config.emptyIcon}
        emptyTitle={config.emptyTitle}
        emptyMessage={config.emptyMessage}
      >
        <StaffScheduleSection
          title={config.listTitle}
          viewAllLabel={config.viewAllLabel}
          onViewAll={config.viewAllHref ? () => router.push(config.viewAllHref as Href) : undefined}
          items={items}
          onPressItem={(item) => router.push(deliveryDetailHref(item.id) as unknown as Href)}
        />
      </CareQueryView>
    </StaffDutyHomeLayout>
  );
}
