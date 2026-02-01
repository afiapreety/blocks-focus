import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState } from './index.type';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      selectedOrgId: null,
      tokens: null,
      login: (accessToken, refreshToken) => {
        return set((state) => ({
          ...state,
          isAuthenticated: true,
          accessToken,
          refreshToken,
        }));
      },
      setAccessToken: (accessToken) =>
        set((state) => ({
          ...state,
          accessToken,
        })),
      logout: () =>
        set({
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          tokens: null,
          user: null,
          selectedOrgId: null,
        }),
      setTokens: (tokens) =>
        set((state) => ({
          ...state,
          tokens,
        })),
      setUser: (user) =>
        set((state) => ({
          ...state,
          user,
        })),
      setSelectedOrgId: (orgId) =>
        set((state) => ({
          ...state,
          selectedOrgId: orgId,
        })),
    }),
    {
      name: 'auth-storage',
    }
  )
);
