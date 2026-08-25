import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import { homeQueryKeys } from '../api/homeQueryKeys';
import {
  fetchCurrentMembership,
  fetchMedications,
  fetchMembershipUsage,
  fetchSeniorMe,
  fetchServiceRequests,
  fetchServices,
  fetchTodayVisits,
  fetchUpcomingVisits,
  fetchMyVisits,
  fetchUnreadNotifications,
  fetchUpcomingAppointments,
} from '../api/homeApi';
import type {
  Appointment,
  CatalogService,
  CurrentMembership,
  ListPage,
  Medication,
  MembershipUsage,
  Notification,
  SeniorProfile,
  ServiceRequest,
  Visit,
} from '../types/home';

function useAuthedQuery<T>(queryKey: readonly unknown[], queryFn: () => Promise<T>): UseQueryResult<T> {
  const isAuthenticated = useAuthStore((state) => state.status === 'AUTHENTICATED');
  return useQuery({
    queryKey,
    queryFn,
    enabled: isAuthenticated,
  });
}

export function useSeniorProfile() {
  return useAuthedQuery<SeniorProfile>(homeQueryKeys.seniorMe, fetchSeniorMe);
}

export function useTodayVisits() {
  return useAuthedQuery<ListPage<Visit>>(homeQueryKeys.visitsToday, fetchTodayVisits);
}

export function useUpcomingVisits() {
  return useAuthedQuery<ListPage<Visit>>(homeQueryKeys.visitsUpcoming, fetchUpcomingVisits);
}

export function useMyVisits() {
  return useAuthedQuery<ListPage<Visit>>(homeQueryKeys.visitsMine, fetchMyVisits);
}

export function useUpcomingAppointments() {
  return useAuthedQuery<ListPage<Appointment>>(homeQueryKeys.appointmentsUpcoming, fetchUpcomingAppointments);
}

export function useMedications() {
  return useAuthedQuery<ListPage<Medication>>(homeQueryKeys.medications, fetchMedications);
}

export function useServiceRequests() {
  return useAuthedQuery<ListPage<ServiceRequest>>(homeQueryKeys.serviceRequests, fetchServiceRequests);
}

export function useServices() {
  return useAuthedQuery<CatalogService[]>(homeQueryKeys.services, fetchServices);
}

export function useCurrentMembership() {
  return useAuthedQuery<CurrentMembership>(homeQueryKeys.membershipCurrent, fetchCurrentMembership);
}

export function useMembershipUsage() {
  return useAuthedQuery<MembershipUsage[]>(homeQueryKeys.membershipUsage, fetchMembershipUsage);
}

export function useUnreadNotifications() {
  return useAuthedQuery<ListPage<Notification>>(homeQueryKeys.notificationsUnread, fetchUnreadNotifications);
}
