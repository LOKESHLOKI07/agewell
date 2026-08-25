import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { currentUserQueryKey } from '@/api/queryClient';
import { fetchCurrentUser } from './authService';
import { useAuthStore } from './authStore';

export function useCurrentUser() {
  const status = useAuthStore((state) => state.status);
  const storedUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const isAuthenticated = status === 'AUTHENTICATED';

  const query = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: fetchCurrentUser,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
  }, [query.data, setUser]);

  return {
    ...query,
    user: query.data ?? storedUser,
  };
}
