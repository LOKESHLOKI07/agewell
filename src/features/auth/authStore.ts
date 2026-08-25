import { create } from 'zustand';
import { currentUserQueryKey, queryClient } from '@/api/queryClient';
import { setUnauthorizedHandler } from '@/api/sessionBridge';
import { fetchCurrentUser, loginWithPassword, logoutAndClearLocal } from './authService';
import type { AuthStatus, AuthUser } from './authTypes';
import { clearTokens, loadTokens } from './tokenStorage';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  careStatus: string | null;
  hydrate: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  completeRegistration: (user: AuthUser, careStatus?: string | null) => void;
  signOut: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  setCareStatus: (status: string | null) => void;
}

function resetClientSession(): void {
  queryClient.removeQueries({ queryKey: currentUserQueryKey });
  queryClient.clear();
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'INITIALIZING',
  user: null,
  careStatus: null,

  hydrate: async () => {
    const tokens = await loadTokens();
    if (!tokens) {
      set({ status: 'UNAUTHENTICATED', user: null, careStatus: null });
      return;
    }

    try {
      const user = await fetchCurrentUser();
      queryClient.setQueryData(currentUserQueryKey, user);
      set({ status: 'AUTHENTICATED', user });
    } catch {
      await clearTokens();
      resetClientSession();
      set({ status: 'UNAUTHENTICATED', user: null, careStatus: null });
    }
  },

  signIn: async (email, password) => {
    const user = await loginWithPassword(email, password);
    queryClient.setQueryData(currentUserQueryKey, user);
    set({ status: 'AUTHENTICATED', user, careStatus: null });
  },

  completeRegistration: (user, careStatus = null) => {
    queryClient.setQueryData(currentUserQueryKey, user);
    set({ status: 'AUTHENTICATED', user, careStatus });
  },

  signOut: async () => {
    await logoutAndClearLocal();
    resetClientSession();
    set({ status: 'UNAUTHENTICATED', user: null, careStatus: null });
  },

  setUser: (user) => {
    if (get().status !== 'AUTHENTICATED') {
      return;
    }
    set({ user });
  },

  setCareStatus: (careStatus) => set({ careStatus }),
}));

setUnauthorizedHandler(() => {
  resetClientSession();
  useAuthStore.setState({ status: 'UNAUTHENTICATED', user: null, careStatus: null });
});
