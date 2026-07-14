/**
 * AuthProvider Component
 * Handles authentication state initialization and Firebase auth listener
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuthStore, useHasHydrated } from '@/store/authStore';
import { onAuthChange } from '@/lib/firebase';
import { authAPI } from '@/lib/api';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [initialized, setInitialized] = useState(false);
  const hasHydrated = useHasHydrated();
  const { login, logout, setLoading, token, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Wait for Zustand to hydrate from localStorage
    if (!hasHydrated) return;

    // Check for existing token and validate
    const initAuth = async () => {
      setLoading(true);
      
      // Get fresh token from store after hydration
      const currentToken = useAuthStore.getState().token;
      const currentUser = useAuthStore.getState().user;
      
      console.log('AuthProvider: Hydrated, token:', currentToken ? 'exists' : 'none');
      
      if (currentToken) {
        try {
          const response = await authAPI.getMe();
          if (response.data.success) {
            // Token is valid, update user data in case it changed
            const userData = response.data.data.user || response.data.data;
            login(userData, currentToken);
            console.log('AuthProvider: Token valid, user restored');
          }
        } catch (error) {
          // Token is invalid or expired, clear auth state
          console.log('AuthProvider: Token validation failed, logging out');
          logout();
        }
      } else {
        setLoading(false);
      }
      
      setInitialized(true);
    };

    initAuth();

    // Listen for Firebase auth state changes (optional, for Google login)
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      const storeToken = useAuthStore.getState().token;
      if (firebaseUser && !storeToken) {
        try {
          // Sync with backend
          const response = await authAPI.firebaseAuth({
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            avatar: firebaseUser.photoURL || undefined,
          });
          
          if (response.data.success) {
            login(response.data.data.user, response.data.data.token);
          }
        } catch (error) {
          console.error('Firebase auth sync failed:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [hasHydrated]);

  // Show loading spinner while initializing
  if (!hasHydrated || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CivicSense...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
