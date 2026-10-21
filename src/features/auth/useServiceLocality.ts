import { useMemo } from 'react';
import { useSeniorProfile } from '@/features/home/hooks/queries';
import {
  NONE_SERVICE_AREA_MATCH,
  resolveServiceAreaFromSenior,
  type ServiceAreaMatch,
  type ServiceTier,
} from './serviceArea';
import { getServiceAreaResolution } from './serviceAreaPreference';

export function useServiceLocality(): ServiceAreaMatch {
  const senior = useSeniorProfile();
  const local = getServiceAreaResolution();

  return useMemo(() => {
    if (senior.data) {
      const fromSenior = resolveServiceAreaFromSenior({
        inServiceArea: senior.data.inServiceArea,
        locationQuery: senior.data.locationQuery,
        locationLat: senior.data.locationLat,
        locationLng: senior.data.locationLng,
        address: senior.data.address,
      });
      if (fromSenior.inServiceArea) {
        return fromSenior;
      }
      if (senior.data.inServiceArea === false) {
        return NONE_SERVICE_AREA_MATCH;
      }
    }
    return local ?? NONE_SERVICE_AREA_MATCH;
  }, [senior.data, local]);
}

export function useServiceTier(): ServiceTier | null {
  return useServiceLocality().tier;
}
