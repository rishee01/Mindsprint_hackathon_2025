/**
 * Auth Store - Zustand State Management
 * Manages user authentication state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// User type definition
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'authority';
  department?: string;
  avatar?: string;
  issuesReported: number;
  issuesVerified: number;
  trustScore: number;
  createdAt: string;
}

// Auth store state
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;
  
  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (state: boolean) => void;
}

const storage = typeof window !== 'undefined'
  ? createJSONStorage(() => localStorage)
  : undefined;

// Create auth store with persistence
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      _hasHydrated: false,
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setToken: (token) => set({ token }),
      
      login: (user, token) => set({ 
        user, 
        token, 
        isAuthenticated: true,
        isLoading: false 
      }),
      
      logout: () => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          isLoading: false 
        });
      },
      
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'civicsense-auth',
      storage,
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        isAuthenticated: state.isAuthenticated 
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Selector hooks
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsAdmin = () => useAuthStore((state) => state.user?.role === 'admin');
export const useIsAuthority = () => useAuthStore((state) => 
  state.user?.role === 'admin' || state.user?.role === 'authority'
);
export const useHasHydrated = () => useAuthStore((state) => state._hasHydrated);
