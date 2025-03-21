import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { StateCreator } from 'zustand';

interface User {
  id: string;
  auth_id: string;
  username: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  [key: string]: any; // For any additional fields
}

interface UserState {
  auth: any | null; // Supabase auth user
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  initialized: boolean;
  fetchUserData: () => Promise<void>;
  clearUserData: () => void;
}

const supabase = createClient();

export const useUserStore = create<UserState>((set, get) => ({
  auth: null,
  user: null,
  isLoading: false,
  error: null,
  initialized: false,

  fetchUserData: async () => {
    const { initialized, auth } = get();

    // If already initialized with data, don't fetch again
    if (initialized && auth) return;

    set({ isLoading: true, error: null });

    try {
      // Get authenticated user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!authUser) {
        set({ auth: null, user: null, isLoading: false, initialized: true });
        return;
      }

      // Get user profile
      const { data: userData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      set({
        auth: authUser,
        user: userData,
        isLoading: false,
        error: null,
        initialized: true
      });
    } catch (error) {
      set({
        error: error as Error,
        isLoading: false,
        initialized: true
      });
    }
  },

  clearUserData: () => {
    set({
      auth: null,
      user: null,
      error: null,
      initialized: false
    });
  }
}));