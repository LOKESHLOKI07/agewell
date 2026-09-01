import { router, type Href } from 'expo-router';
import { LocationPermissionScreen } from '@/features/auth/LocationPermissionScreen';
import { setServiceAreaAvailable } from '@/features/auth/serviceAreaPreference';

export default function AccountLocationScreen() {
  return (
    <LocationPermissionScreen
      onResolved={async (available) => {
        await setServiceAreaAvailable(available);
        router.replace('/(tabs)' as Href);
      }}
    />
  );
}
