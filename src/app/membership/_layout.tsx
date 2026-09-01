import { Stack } from 'expo-router';
import { familyHome } from '@/features/home/components/familyHomeTheme';

export default function MembershipLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: familyHome.white },
      }}
    />
  );
}
