import { router, type Href } from 'expo-router';
import { queryClient } from '@/api/queryClient';
import { LocationPermissionScreen } from '@/features/auth/LocationPermissionScreen';
import { onboardingLocationApiFields } from '@/features/auth/onboardingLocation';
import { resolveServiceAreaFromSenior } from '@/features/auth/serviceArea';
import { setServiceAreaResolution } from '@/features/auth/serviceAreaPreference';
import { homeQueryKeys } from '@/features/home/api/homeQueryKeys';
import { updateSeniorMeServiceArea } from '@/features/home/api/homeApi';

export default function AccountLocationScreen() {
  return (
    <LocationPermissionScreen
      onResolved={async (available) => {
        const location = onboardingLocationApiFields();
        const match = resolveServiceAreaFromSenior({
          inServiceArea: available,
          locationQuery: location.locationQuery,
          locationLat: location.locationLat,
          locationLng: location.locationLng,
        });
        await setServiceAreaResolution(match);
        try {
          await updateSeniorMeServiceArea({
            inServiceArea: match.inServiceArea,
            locationLat: location.locationLat,
            locationLng: location.locationLng,
            locationQuery: location.locationQuery,
            locationSource: location.locationSource,
          });
          await queryClient.invalidateQueries({ queryKey: homeQueryKeys.seniorMe });
        } catch {
          // Local flag still updated; server sync can retry on next location check.
        }
        if (match.inServiceArea) {
          router.replace('/(tabs)' as Href);
          return;
        }
        router.replace('/account/service-unavailable' as Href);
      }}
    />
  );
}
