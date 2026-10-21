import { useEffect } from 'react';
import { resolveServiceAreaFromSenior } from '@/features/auth/serviceArea';
import {
  canAvailServices,
  setServiceAreaResolution,
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
    void setServiceAreaResolution(
      resolveServiceAreaFromSenior({
        inServiceArea: senior.data.inServiceArea,
        locationQuery: senior.data.locationQuery,
        locationLat: senior.data.locationLat,
        locationLng: senior.data.locationLng,
        address: senior.data.address,
      }),
    );
  }, [senior.data]);

  if (senior.data) {
    return senior.data.inServiceArea;
  }
  return canAvailServices();
}
