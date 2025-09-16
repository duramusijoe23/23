import { useState, useEffect } from 'react';
import { supabase, signInWithEmail, signOut, getUserProfile } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  username: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            error: error.message
          }));
          return;
        }

        if (session?.user) {
          // Try to get profile, but don't block authentication if it fails
          const profile = await getUserProfile(session.user.id);
          setAuthState({
            user: session.user,
            profile,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } else {
          setAuthState(prev => ({
            ...prev,
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false
          }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState(prev => ({
          ...prev,
          user: null,
          profile: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        }));
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await getUserProfile(session.user.id);
          setAuthState({
            user: session.user,
            profile,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    setAuthState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      const { user } = await signInWithEmail(credentials.username, credentials.password);
      
      if (user) {
        // Profile will be loaded by the auth state change listener
        setAuthState({
          user,
          profile: null,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setAuthState(prev => ({
        ...prev,
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Login failed. Please check your credentials.'
      }));
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setAuthState({
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      setAuthState(prev => ({
        ...prev,
        error: error.message || 'Logout failed'
      }));
    }
  };

  const clearError = () => {
    setAuthState(prev => ({
      ...prev,
      error: null
    }));
  };

  return {
    user: authState.user,
    profile: authState.profile,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,
    login,
    logout,
    clearError
  };
};