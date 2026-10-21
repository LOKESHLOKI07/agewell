import { router, type Href } from 'expo-router';
import { ServiceAreaLockScreen } from '@/features/auth/ServiceAreaLockScreen';

export default function AccountServiceUnavailableScreen() {
  return (
    <ServiceAreaLockScreen onEnterLocation={() => router.replace('/account/location' as Href)} />
  );
}
