import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import {
  createCareCall,
  createCareMessage,
  createCareVisitRequest,
  fetchAssignedCareManager,
  fetchCareActivities,
  fetchCareVisitSlots,
  updateCareActivity,
} from './careManagerApi';
import type { CareActivityUpdate } from './careManagerTypes';
import { membershipQueryKeys } from './queryKeys';

function useAuthedQuery<T>(queryKey: readonly unknown[], queryFn: () => Promise<T>, enabled = true) {
  const isAuthenticated = useAuthStore((state) => state.status === 'AUTHENTICATED');
  return useQuery({
    queryKey,
    queryFn,
    enabled: isAuthenticated && enabled,
  });
}

export function useAssignedCareManager() {
  return useAuthedQuery(membershipQueryKeys.assignedCareManager, () => fetchAssignedCareManager());
}

export function useAssignedCompanion() {
  return useAuthedQuery(membershipQueryKeys.assignedCompanion, () =>
    fetchAssignedCareManager(undefined, 'COMPANION'),
  );
}

export function useCareActivities(enabled = true) {
  return useAuthedQuery(membershipQueryKeys.careActivities, () => fetchCareActivities(), enabled);
}

export function useCareVisitSlots(onDate: string | null) {
  return useAuthedQuery(
    membershipQueryKeys.careVisitSlots(onDate ?? ''),
    () => fetchCareVisitSlots(onDate as string),
    Boolean(onDate),
  );
}

function useInvalidateCare() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: membershipQueryKeys.careActivities }),
      queryClient.invalidateQueries({ queryKey: membershipQueryKeys.assignedCareManager }),
    ]);
}

export function useCreateCareCall() {
  const invalidate = useInvalidateCare();
  return useMutation({
    mutationFn: () => createCareCall(),
    onSuccess: () => void invalidate(),
  });
}

export function useCreateCareMessage() {
  const invalidate = useInvalidateCare();
  return useMutation({
    mutationFn: () => createCareMessage(),
    onSuccess: () => void invalidate(),
  });
}

export function useCreateCareVisitRequest() {
  const invalidate = useInvalidateCare();
  return useMutation({
    mutationFn: (input: { scheduledAt: string; reason?: string | null }) => createCareVisitRequest(input),
    onSuccess: () => void invalidate(),
  });
}

export function useUpdateCareActivity() {
  const invalidate = useInvalidateCare();
  return useMutation({
    mutationFn: (input: { id: string } & CareActivityUpdate) => {
      const { id, ...rest } = input;
      return updateCareActivity(id, rest);
    },
    onSuccess: () => void invalidate(),
  });
}
