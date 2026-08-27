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
  isRedirecting?: boolean;
}

/**
 * Sign up with Supabase Authentication saving the user role ('client' or 'agency') in user_metadata.
 * Required fields: Full Name, Email, Phone Number, Password.
 */
export async function signUpWithSupabase(
  email: string,
  password: string,
  metadata: {
    name: string;
    role: 'client' | 'agency';
    phone: string;
    plan?: string;
    bdtPlanLabel?: string;
    paymentInfo?: any;
    company?: string;
    title?: string;
  }
): Promise<SupabaseAuthResponse> {
  if (!supabase) {
    // Graceful persistent fallback for preview environment
    const simulatedUser = {
      id: `usr-supa-${Date.now()}`,
      email,
      user_metadata: {
        name: metadata.name,
        role: metadata.role,
        phone: metadata.phone,
        plan: metadata.plan || (metadata.role === 'agency' ? 'Enterprise' : 'Pro'),
        bdtPlanLabel: metadata.bdtPlanLabel || '',
        payment_info: metadata.paymentInfo || null,
        avatar: metadata.role === 'agency'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
      },
    };
    return {
      success: true,
      user: simulatedUser,
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
          phone: metadata.phone,
          plan: metadata.plan || (metadata.role === 'agency' ? 'Enterprise' : 'Pro'),
          bdt_plan_label: metadata.bdtPlanLabel || '',
          payment_info: metadata.paymentInfo || null,
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
    const role = preferredRoleFallback || (email.includes('admin') || email.includes('owner') || email.includes('agency') ? 'agency' : 'client');
    return {
      success: true,
      user: {
        id: `usr-supa-${Date.now()}`,
        email,
        user_metadata: {
          name: email.split('@')[0].replace('.', ' '),
          role,
          phone: '+8801700000000',
          plan: role === 'agency' ? 'Enterprise' : 'Pro'
        },
      },
      role,
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
 * Sign in / Sign up with Google OAuth via Supabase
 */
export async function signInWithGoogle(
  role: 'client' | 'agency',
  suggestedProfile?: { name?: string; email?: string; phone?: string; paymentInfo?: any }
): Promise<SupabaseAuthResponse> {
  // Store role in storage so callback or onAuthStateChange applies the correct role
  try {
    localStorage.setItem('visualsky_pending_oauth_role', role);
    if (suggestedProfile?.paymentInfo) {
      localStorage.setItem('visualsky_pending_payment_info', JSON.stringify(suggestedProfile.paymentInfo));
    }
  } catch {}

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, isRedirecting: true, role };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Google OAuth failed' };
    }
  }

  // Graceful simulated Google SSO when Supabase keys are default / preview mode
  const isAgency = role === 'agency';
  const googleUser = {
    id: `google-${Date.now()}`,
    email: suggestedProfile?.email || (isAgency ? 'admin@visualsky.io' : 'rafiqulvisualsky@gmail.com'),
    user_metadata: {
      name: suggestedProfile?.name || (isAgency ? 'Rafiqul (Agency Master)' : 'Rafiqul Islam'),
      role,
      phone: suggestedProfile?.phone || '+880 1712-345678',
      plan: isAgency ? 'Enterprise' : 'Pro',
      payment_info: suggestedProfile?.paymentInfo || null,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      auth_provider: 'google'
    }
  };

  return {
    success: true,
    user: googleUser,
    role,
  };
}

/**
 * Reset user password with Supabase
 */
export async function resetPasswordWithSupabase(email: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: true };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Password reset request failed' };
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
