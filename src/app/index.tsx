import { Redirect, type Href } from 'expo-router';
import { SplashScreen } from '@/features/auth/SplashScreen';
import { useAuth } from '@/features/auth/useAuth';
import { authenticatedHomeHref } from '@/features/auth/roleRouting';
import { useAuthStore } from '@/features/auth/authStore';

export default function Index() {
  const { status, user } = useAuth();
  const careStatus = useAuthStore((state) => state.careStatus);

  if (status === 'AUTHENTICATED' && user) {
    return <Redirect href={authenticatedHomeHref(user.role, { careStatus }) as Href} />;
  }

  if (status === 'UNAUTHENTICATED') {
    return <Redirect href={'/(auth)/welcome' as Href} />;
  }

  return <SplashScreen />;
}
