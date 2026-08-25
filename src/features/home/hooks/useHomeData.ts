import { useCallback, useMemo } from 'react';
import { buildHomeViewModel, refetchHomeQueries } from '../selectors/homeViewModel';
import {
  useCurrentMembership,
  useMedications,
  useMembershipUsage,
  useSeniorProfile,
  useServiceRequests,
  useServices,
  useTodayVisits,
  useUpcomingVisits,
  useMyVisits,
  useUnreadNotifications,
  useUpcomingAppointments,
} from './queries';

export function useHomeData() {
  const senior = useSeniorProfile();
  const visits = useTodayVisits();
  const upcomingVisits = useUpcomingVisits();
  const myVisits = useMyVisits();
  const appointments = useUpcomingAppointments();
  const medications = useMedications();
  const serviceRequests = useServiceRequests();
  const services = useServices();
  const membership = useCurrentMembership();
  const usage = useMembershipUsage();
  const notifications = useUnreadNotifications();

  const viewModel = useMemo(
    () =>
      buildHomeViewModel({
        senior: senior.data,
        visits: visits.data,
        appointments: appointments.data,
        medications: medications.data,
        serviceRequests: serviceRequests.data,
        services: services.data,
        membership: membership.data,
        usage: usage.data,
        notifications: notifications.data,
      }),
    [
      senior.data,
      visits.data,
      appointments.data,
      medications.data,
      serviceRequests.data,
      services.data,
      membership.data,
      usage.data,
      notifications.data,
    ],
  );

  const refetchAll = useCallback(
    () =>
      refetchHomeQueries([
        senior.refetch,
        visits.refetch,
        upcomingVisits.refetch,
        myVisits.refetch,
        appointments.refetch,
        medications.refetch,
        serviceRequests.refetch,
        services.refetch,
        membership.refetch,
        usage.refetch,
        notifications.refetch,
      ]),
    [
      senior.refetch,
      visits.refetch,
      upcomingVisits.refetch,
      myVisits.refetch,
      appointments.refetch,
      medications.refetch,
      serviceRequests.refetch,
      services.refetch,
      membership.refetch,
      usage.refetch,
      notifications.refetch,
    ],
  );

  return {
    senior,
    visits,
    upcomingVisits,
    myVisits,
    appointments,
    medications,
    serviceRequests,
    services,
    membership,
    usage,
    notifications,
    viewModel,
    refetchAll,
  };
}
