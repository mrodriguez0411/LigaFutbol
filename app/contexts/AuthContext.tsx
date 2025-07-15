import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User } from '@/types/auth';
import { supabase } from '../config/supabase';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  error: string | null;
}

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAdmin: false,
    error: null,
  });

  const login = async (email: string, password: string) => {
    try {
      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (session?.user) {
        const user: User = {
          ...session.user,
          is_admin: session.user.app_metadata?.provider === 'admin',
          app_metadata: session.user.app_metadata || { provider: 'user' },
          factors: session.user.factors || [],
          role: 'authenticated',
        };

        setState({
          user,
          isAdmin: user.is_admin,
          error: null,
        });
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
      }));
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (user) {
        const newUser: User = {
          ...user,
          is_admin: false,
          app_metadata: { provider: 'user' },
          factors: [],
          role: 'authenticated',
        };

        setState({
          user: newUser,
          isAdmin: false,
          error: null,
        });
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
      }));
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setState({
        user: null,
        isAdmin: false,
        error: null,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
      }));
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const user: User = {
          ...session.user,
          is_admin: session.user.app_metadata?.provider === 'admin',
          app_metadata: session.user.app_metadata || { provider: 'user' },
          factors: session.user.factors || [],
          role: 'authenticated',
        };

        setState({
          user,
          isAdmin: user.is_admin,
          error: null,
        });
      } else {
        setState({
          user: null,
          isAdmin: false,
          error: null,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAuthenticated = state.user !== null;

  return (
    <AuthContext.Provider value={{
      state,
      login,
      register,
      logout,
      isAuthenticated,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
