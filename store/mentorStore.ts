import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

interface Mentor {
  id: string;
  auth_id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  subjects?: string[];
  years_experience?: number;
  specialties?: string[];
  created_at: string;
  updated_at: string;
  [key: string]: any; // For any additional fields
}

interface MentorState {
  auth: any | null; // Supabase auth user
  mentor: Mentor | null;
  isLoading: boolean;
  error: Error | null;
  initialized: boolean;
  fetchMentorData: () => Promise<void>;
  clearMentorData: () => void;
  isMentor: boolean;
}

const supabase = createClient();

export const useMentorStore = create<MentorState>((set, get) => ({
  auth: null,
  mentor: null,
  isLoading: false,
  error: null,
  initialized: false,
  isMentor: false,

  fetchMentorData: async () => {
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
        set({
          auth: null,
          mentor: null,
          isLoading: false,
          initialized: true,
          isMentor: false
        });
        return;
      }

      // Get mentor profile
      const { data: mentorData, error: profileError } = await supabase
        .from('mentors')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

      if (profileError) {
        // Not finding a mentor record is not necessarily an error
        // It might mean this user is not a mentor
        set({
          auth: authUser,
          mentor: null,
          isLoading: false,
          error: null,
          initialized: true,
          isMentor: false
        });
        return;
      }

      set({
        auth: authUser,
        mentor: mentorData,
        isLoading: false,
        error: null,
        initialized: true,
        isMentor: true
      });
    } catch (error) {
      set({
        error: error as Error,
        isLoading: false,
        initialized: true,
        isMentor: false
      });
    }
  },

  clearMentorData: () => {
    set({
      auth: null,
      mentor: null,
      error: null,
      initialized: false,
      isMentor: false
    });
  }
}));