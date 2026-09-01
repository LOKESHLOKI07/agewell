import { useState } from 'react';
import { Alert } from 'react-native';
import { getApiErrorMessage } from '@/api/errors';
import { queryClient } from '@/api/queryClient';
import { homeQueryKeys } from '@/features/home/api/homeQueryKeys';
import { submitMembershipRequest } from './membershipApi';

/** Shared submit helper for membership service screens → real service_requests. */
export function useMembershipSubmit(slug: string) {
  const [submitting, setSubmitting] = useState(false);

  const submit = async (notes: string, successTitle = 'Request submitted') => {
    if (submitting) {
      return false;
    }
    setSubmitting(true);
    try {
      const created = await submitMembershipRequest({ slug, notes: notes.trim() || undefined });
      await queryClient.invalidateQueries({ queryKey: homeQueryKeys.serviceRequests });
      Alert.alert(
        successTitle,
        `AgeWell received your request (${created.status}). Ops can update it under Admin → Requests.`,
      );
      return true;
    } catch (error) {
      Alert.alert('Unable to submit', getApiErrorMessage(error));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { submitting, submit };
}
