import { useEffect } from 'react';
import {
  canAvailServices,
  setServiceAreaAvailable,
} from '@/features/auth/serviceAreaPreference';
import { useSeniorProfile } from '@/features/home/hooks/queries';

/**
 * Single source of truth for Home / booking gates:
 * prefer server senior.in_service_area (same resolve as Admin),
 * keep local preference in sync for non-hook call sites.
 */
export function useServicesLive(): boolean {
  const senior = useSeniorProfile();

  useEffect(() => {
    if (!senior.data) {
      return;
    }
    void setServiceAreaAvailable(senior.data.inServiceArea);
  }, [senior.data?.inServiceArea, senior.data]);

  if (senior.data) {
    return senior.data.inServiceArea;
  }
  return canAvailServices();
}
