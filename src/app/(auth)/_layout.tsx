import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
        // On web, animated stacks keep prior screens focusable under aria-hidden.
        animation: Platform.OS === 'web' ? 'none' : undefined,
      }}
    />
  );
}
