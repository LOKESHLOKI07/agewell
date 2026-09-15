import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';

/**
 * Remote push was removed from Expo Go on Android in SDK 53. Loading
 * `expo-notifications` there throws and takes down the root layout.
 */
export function canUseRemotePush(): boolean {
  if (Platform.OS === 'web') {
    return false;
  }
  if (Platform.OS === 'android' && isRunningInExpoGo()) {
    return false;
  }
  return true;
}
