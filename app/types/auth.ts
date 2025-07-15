import { User as SupabaseUser, Factor } from '@supabase/supabase-js';

export interface UserAppMetadata {
  provider?: string;
}

export interface UserMetadata {
  name?: string;
  avatar_url?: string;
}

export interface User extends SupabaseUser {
  is_admin: boolean;
  app_metadata: UserAppMetadata;
  user_metadata: UserMetadata;
  aud: string;
  role: string;
  factors: Factor[];
}

export interface AuthState {
  user: User | null;
  isAdmin: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
}
