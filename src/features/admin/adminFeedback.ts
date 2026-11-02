import { Alert } from 'react-native';

/** Shows a clear create/register success dialog, then continues (usually navigate). */
export function showAdminRegisterSuccess(message: string, onContinue: () => void): void {
  Alert.alert('Registered successfully', message, [
    {
      text: 'OK',
      onPress: onContinue,
    },
  ]);
}
