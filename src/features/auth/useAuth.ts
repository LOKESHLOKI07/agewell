import { useAuthStore } from './authStore';

export function useAuth() {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const signIn = useAuthStore((state) => state.signIn);
  const signOut = useAuthStore((state) => state.signOut);
  const hydrate = useAuthStore((state) => state.hydrate);

  return {
    status,
    user,
    signIn,
    signOut,
    hydrate,
    isInitializing: status === 'INITIALIZING',
    isAuthenticated: status === 'AUTHENTICATED',
  };
}
