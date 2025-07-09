import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Create storage adapter that works across platforms
const createStorageAdapter = () => {
  if (Platform.OS === 'web') {
    // For web, use a custom storage that handles SSR
    return {
      getItem: (key: string) => {
        if (typeof window === 'undefined') return null;
        try {
          return window.localStorage?.getItem(key) ?? null;
        } catch {
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        if (typeof window === 'undefined') return;
        try {
          window.localStorage?.setItem(key, value);
        } catch {
          // Ignore storage errors
        }
      },
      removeItem: (key: string) => {
        if (typeof window === 'undefined') return;
        try {
          window.localStorage?.removeItem(key);
        } catch {
          // Ignore storage errors
        }
      },
    };
  }
  return AsyncStorage;
};

// Create Supabase client with platform-appropriate storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          role: 'user' | 'admin' | 'super_admin';
          preferences: any;
          created_at: string;
          updated_at: string;
          last_login: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          role?: 'user' | 'admin' | 'super_admin';
          preferences?: any;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: 'user' | 'admin' | 'super_admin';
          preferences?: any;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
        };
      };
      tickets: {
        Row: {
          id: string;
          user_id: string;
          numbers: string;
          source: 'manual' | 'sms' | 'api';
          purchase_date: string;
          month: string;
          metadata: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          numbers: string;
          source?: 'manual' | 'sms' | 'api';
          purchase_date?: string;
          month?: string;
          metadata?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          numbers?: string;
          source?: 'manual' | 'sms' | 'api';
          purchase_date?: string;
          month?: string;
          metadata?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      winning_numbers: {
        Row: {
          id: string;
          numbers: string;
          month: string;
          draw_date: string;
          created_by: string | null;
          prize_amount: number;
          total_winners: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          numbers: string;
          month: string;
          draw_date: string;
          created_by?: string | null;
          prize_amount?: number;
          total_winners?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          numbers?: string;
          month?: string;
          draw_date?: string;
          created_by?: string | null;
          prize_amount?: number;
          total_winners?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      ticket_results: {
        Row: {
          id: string;
          ticket_id: string;
          winning_number_id: string;
          user_id: string;
          match_count: number;
          is_winner: boolean;
          prize_amount: number;
          calculated_at: string;
          notified_at: string | null;
          claimed_at: string | null;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          winning_number_id: string;
          user_id: string;
          match_count?: number;
          is_winner?: boolean;
          prize_amount?: number;
          calculated_at?: string;
          notified_at?: string | null;
          claimed_at?: string | null;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          winning_number_id?: string;
          user_id?: string;
          match_count?: number;
          is_winner?: boolean;
          prize_amount?: number;
          calculated_at?: string;
          notified_at?: string | null;
          claimed_at?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'winner' | 'new_draw' | 'system' | 'admin';
          title: string;
          message: string;
          data: any;
          read_at: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'winner' | 'new_draw' | 'system' | 'admin';
          title: string;
          message: string;
          data?: any;
          read_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'winner' | 'new_draw' | 'system' | 'admin';
          title?: string;
          message?: string;
          data?: any;
          read_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      user_stats: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          full_name: string | null;
          total_tickets: number;
          total_wins: number;
          total_winnings: number;
          near_misses: number;
          last_ticket_date: string | null;
          member_since: string;
        };
      };
      monthly_analytics: {
        Row: {
          month: string;
          winning_numbers: string;
          draw_date: string;
          prize_amount: number;
          total_tickets: number;
          total_winners: number;
          near_misses: number;
          win_rate_percentage: number;
          unique_players: number;
          total_prizes_awarded: number;
        };
      };
      admin_dashboard_stats: {
        Row: {
          total_users: number;
          total_tickets: number;
          total_draws: number;
          total_winners: number;
          total_prizes: number;
          tickets_last_30_days: number;
          new_users_last_30_days: number;
          unread_notifications: number;
        };
      };
    };
    Functions: {
      get_user_dashboard_data: {
        Args: { user_uuid: string };
        Returns: any;
      };
      get_system_health: {
        Args: {};
        Returns: any;
      };
      get_leaderboard: {
        Args: { limit_count?: number };
        Returns: Array<{
          rank: number;
          user_id: string;
          full_name: string;
          email: string;
          total_wins: number;
          total_winnings: number;
          total_tickets: number;
          win_rate: number;
        }>;
      };
    };
  };
}

// Auth helpers
export const signUp = async (email: string, password: string, fullName?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  } catch (error) {
    return { user: null, error };
  }
};

// Helper function to ensure user profile exists
export const ensureUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Check if profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    // Create profile if it doesn't exist
    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || ''
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating profile:', error);
      return null;
    }
    return newProfile;
  }

  return profile;
};

// Profile operations (moved from database.ts to avoid circular imports)
export const getUserProfile = async (userId?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  
  if (!targetUserId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', targetUserId)
    .single();

  if (error) throw error;
  return data;
};

export const updateUserProfile = async (updates: any) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Real-time subscriptions
export const subscribeToTickets = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('tickets')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tickets',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToWinningNumbers = (callback: (payload: any) => void) => {
  return supabase
    .channel('winning_numbers')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'winning_numbers',
      },
      callback
    )
    .subscribe();
};

export const subscribeToTicketResults = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('ticket_results')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'ticket_results',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToNotifications = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
};

// Admin subscriptions
export const subscribeToAdminLogs = (callback: (payload: any) => void) => {
  return supabase
    .channel('admin_logs')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'admin_logs',
      },
      callback
    )
    .subscribe();
};