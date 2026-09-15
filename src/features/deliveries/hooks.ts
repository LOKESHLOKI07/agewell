import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import type { ListPage } from '@/features/home/types/home';
import { fetchMemberDeliveries, fetchMemberDelivery } from './api';
import { deliveryQueryKeys } from './queryKeys';
import type { MemberDelivery } from './types';

function useAuthedQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  enabled = true,
): UseQueryResult<T> {
  const isAuthenticated = useAuthStore((state) => state.status === 'AUTHENTICATED');
  return useQuery({
    queryKey,
    queryFn,
    enabled: isAuthenticated && enabled,
  });
}

export function useMemberDeliveries() {
  return useAuthedQuery<ListPage<MemberDelivery>>(deliveryQueryKeys.member, fetchMemberDeliveries);
}

export function useMemberDelivery(deliveryId: string | undefined) {
  return useAuthedQuery<MemberDelivery>(
    deliveryQueryKeys.memberDetail(deliveryId ?? ''),
    () => fetchMemberDelivery(deliveryId as string),
    Boolean(deliveryId),
  );
}
