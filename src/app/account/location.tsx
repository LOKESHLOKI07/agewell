import { router, type Href } from 'expo-router';
import { queryClient } from '@/api/queryClient';
import { LocationPermissionScreen } from '@/features/auth/LocationPermissionScreen';
import { onboardingLocationApiFields } from '@/features/auth/onboardingLocation';
import { setServiceAreaAvailable } from '@/features/auth/serviceAreaPreference';
import { homeQueryKeys } from '@/features/home/api/homeQueryKeys';
import { updateSeniorMeServiceArea } from '@/features/home/api/homeApi';

export default function AccountLocationScreen() {
  return (
    <LocationPermissionScreen
      onResolved={async (available) => {
        await setServiceAreaAvailable(available);
        const location = onboardingLocationApiFields();
        try {
          await updateSeniorMeServiceArea({
            inServiceArea: available,
            locationLat: location.locationLat,
            locationLng: location.locationLng,
            locationQuery: location.locationQuery,
            locationSource: location.locationSource,
          });
          await queryClient.invalidateQueries({ queryKey: homeQueryKeys.seniorMe });
        } catch {
          // Local flag still updated; server sync can retry on next location check.
        }
        router.replace('/(tabs)' as Href);
      }}
    />
  );
}
