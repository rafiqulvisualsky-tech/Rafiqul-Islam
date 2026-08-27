import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read environment variables as requested
const supabaseUrl: string = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey: string = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('YOUR_SUPABASE') &&
  !supabaseAnonKey.includes('YOUR_SUPABASE') &&
  supabaseUrl.startsWith('https://')
);

// Create Supabase client instance
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export interface SupabaseAuthResponse {
  success: boolean;
  user?: any;
  session?: any;
  error?: string;
  role?: 'client' | 'agency';
}

/**
 * Sign up with Supabase Authentication saving the user role ('client' or 'agency') in user_metadata
 */
export async function signUpWithSupabase(
  email: string,
  password: string,
  metadata: {
    name: string;
    role: 'client' | 'agency';
    company?: string;
    website?: string;
    phone?: string;
    plan?: string;
    title?: string;
    targetNiche?: string;
  }
): Promise<SupabaseAuthResponse> {
  if (!supabase) {
    // Graceful fallback for local preview if Supabase env is not configured yet
    return {
      success: true,
      user: {
        id: `supabase-sim-${Date.now()}`,
        email,
        user_metadata: metadata,
      },
      role: metadata.role,
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: metadata.name,
          role: metadata.role, // 'client' or 'agency'
          company: metadata.company || '',
          website: metadata.website || '',
          phone: metadata.phone || '',
          plan: metadata.plan || (metadata.role === 'agency' ? 'Enterprise' : 'Pro'),
          title: metadata.title || '',
          target_niche: metadata.targetNiche || '',
          avatar: metadata.role === 'agency'
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const assignedRole = (data.user?.user_metadata?.role as 'client' | 'agency') || metadata.role;
    return {
      success: true,
      user: data.user,
      session: data.session,
      role: assignedRole,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to sign up with Supabase' };
  }
}

/**
 * Sign in with Supabase Authentication and extract the assigned user role
 */
export async function signInWithSupabase(
  email: string,
  password: string,
  preferredRoleFallback?: 'client' | 'agency'
): Promise<SupabaseAuthResponse> {
  if (!supabase) {
    // Graceful fallback for local preview
    return {
      success: true,
      user: {
        id: `supabase-sim-${Date.now()}`,
        email,
        user_metadata: {
          role: preferredRoleFallback || (email.includes('admin') || email.includes('owner') || email.includes('agency') ? 'agency' : 'client'),
        },
      },
      role: preferredRoleFallback || (email.includes('admin') || email.includes('owner') || email.includes('agency') ? 'agency' : 'client'),
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const userRole = (data.user?.user_metadata?.role as 'client' | 'agency') || preferredRoleFallback || 'client';

    return {
      success: true,
      user: data.user,
      session: data.session,
      role: userRole,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to sign in with Supabase' };
  }
}

/**
 * Sign out of Supabase
 */
export async function signOutSupabase(): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: true };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Sign out failed' };
  }
}
