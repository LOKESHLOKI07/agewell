import { Redirect, type Href } from 'expo-router';
import { SplashScreen } from '@/features/auth/SplashScreen';
import { useAuth } from '@/features/auth/useAuth';
import { authenticatedHomeHref } from '@/features/auth/roleRouting';

export default function Index() {
  const { status, user } = useAuth();

  if (status === 'AUTHENTICATED' && user) {
    return <Redirect href={authenticatedHomeHref(user.role) as Href} />;
  }

  if (status === 'UNAUTHENTICATED') {
    return <Redirect href="/(auth)/login" />;
  }

  return <SplashScreen />;
}
