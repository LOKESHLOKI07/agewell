import { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';
import { router, type Href } from 'expo-router';
import { colors } from '@/constants/theme';
import { queryClient } from '@/api/queryClient';
import { getSectionState } from '@/features/home/selectors/homeViewModel';
import { useUnreadNotifications } from '@/features/notifications/hooks';
import { notificationQueryKeys } from '@/features/notifications/queryKeys';
import { CareDispatchQueue } from './CareDispatchQueue';
import { CareQueryView } from './components/CareQueryView';
import { StaffDutyHomeLayout } from './components/StaffDutyHomeLayout';
import { StaffScheduleSection } from './components/StaffScheduleSection';
import {
  useAttendanceToday,
  useCareDispatchQueue,
  useCareManagerProfile,
  useCareManagerTodayVisits,
} from './hooks';
import { careQueryKeys } from './queryKeys';
import {
  asVisitList,
  buildVisitStaffSummary,
  dispatchRequestToStaffScheduleItem,
  dutySinceLabelFromAttendance,
  isAttendanceOnDuty,
  visitToStaffScheduleItem,
} from './staffHomeModel';
import { visitDetailHref } from './selectors';
import { staffHomeConfig } from './staffHomeConfig';

export function CareDashboardScreen() {
  const config = staffHomeConfig('CARE_MANAGER');
  const [refreshing, setRefreshing] = useState(false);
  const profile = useCareManagerProfile();
  const today = useCareManagerTodayVisits();
  const dispatchQueue = useCareDispatchQueue(true);
  const attendance = useAttendanceToday();
  const notifications = useUnreadNotifications();
  const visits = asVisitList(today.data?.items);
  const myId = profile.data?.id;
  const awaiting = (dispatchQueue.data?.items ?? []).filter(
    (item) => item.awaitingDispatch !== false && (!myId || !item.dispatcherId || item.dispatcherId === myId),
  );
  const stats = buildVisitStaffSummary(config, visits, awaiting.length);
  const items = [
    ...awaiting.map(dispatchRequestToStaffScheduleItem),
    ...visits.map((visit) => visitToStaffScheduleItem(visit, config.itemPrefix)),
  ];
  const todayState = getSectionState({
    isPending: today.isPending || dispatchQueue.isPending,
    isError: today.isError,
    isEmpty: visits.length === 0 && awaiting.length === 0,
  });
  const onDuty = isAttendanceOnDuty(attendance.data);
  const dutySinceLabel = dutySinceLabelFromAttendance(attendance.data);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: careQueryKeys.profile }),
        queryClient.invalidateQueries({ queryKey: careQueryKeys.visitsToday }),
        queryClient.invalidateQueries({ queryKey: careQueryKeys.dispatchQueue }),
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
      <CareDispatchQueue />
      <CareQueryView
        state={todayState}
        error={today.error}
        onRetry={() => void today.refetch()}
        loadingMessage="Loading today's schedule..."
        emptyIcon={config.emptyIcon}
        emptyTitle={config.emptyTitle}
        emptyMessage={config.emptyMessage}
      >
        <StaffScheduleSection
          title={config.listTitle}
          viewAllLabel={config.viewAllLabel}
          onViewAll={config.viewAllHref ? () => router.push(config.viewAllHref as Href) : undefined}
          items={items}
          onPressItem={(item) => {
            if (item.kind === 'dispatch') {
              return;
            }
            router.push(visitDetailHref(item.id) as unknown as Href);
          }}
        />
      </CareQueryView>
    </StaffDutyHomeLayout>
  );
}
