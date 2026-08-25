import { Platform } from 'react-native';
import { ENV } from '@/config/env';

/** Android Google Maps crashes the process if MapView mounts without a key. */
export function canUseNativeGoogleMaps(): boolean {
  if (Platform.OS !== 'android') {
    return true;
  }
  return Boolean(ENV.androidGoogleMapsApiKey);
}
