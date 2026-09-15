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
import { useAttendanceToday, useCareManagerProfile, useCareManagerTodayVisits } from './hooks';
import { careQueryKeys } from './queryKeys';
import {
  asVisitList,
  buildVisitStaffSummary,
  dutySinceLabelFromAttendance,
  isAttendanceOnDuty,
  visitToStaffScheduleItem,
} from './staffHomeModel';
import { visitDetailHref } from './selectors';
import { staffHomeConfig } from './staffHomeConfig';

export function CompanionHomeScreen() {
  const config = staffHomeConfig('COMPANION');
  const [refreshing, setRefreshing] = useState(false);
  const profile = useCareManagerProfile();
  const today = useCareManagerTodayVisits();
  const attendance = useAttendanceToday();
  const notifications = useUnreadNotifications();
  const visits = asVisitList(today.data?.items);
  const stats = buildVisitStaffSummary(config, visits);
  const items = visits.map((visit) => visitToStaffScheduleItem(visit, config.itemPrefix));
  const todayState = getSectionState({
    isPending: today.isPending,
    isError: today.isError,
    isEmpty: visits.length === 0,
  });
  const onDuty = isAttendanceOnDuty(attendance.data);
  const dutySinceLabel = dutySinceLabelFromAttendance(attendance.data);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: careQueryKeys.profile }),
        queryClient.invalidateQueries({ queryKey: careQueryKeys.visitsToday }),
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
        state={todayState}
        error={today.error}
        onRetry={() => void today.refetch()}
        loadingMessage="Loading today's tasks..."
        emptyIcon={config.emptyIcon}
        emptyTitle={config.emptyTitle}
        emptyMessage={config.emptyMessage}
      >
        <StaffScheduleSection
          title={config.listTitle}
          viewAllLabel={config.viewAllLabel}
          onViewAll={config.viewAllHref ? () => router.push(config.viewAllHref as Href) : undefined}
          items={items}
          onPressItem={(item) => router.push(visitDetailHref(item.id) as unknown as Href)}
        />
      </CareQueryView>
    </StaffDutyHomeLayout>
  );
}
