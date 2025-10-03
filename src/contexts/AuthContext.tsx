import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
};

interface AuthContextType {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: any) => Promise<{ error: any }>;
  subscription: {
    subscribed: boolean;
    tier: string | null;
    endDate: string | null;
  };
  checkSubscription: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState({
    subscribed: false,
    tier: null as string | null,
    endDate: null as string | null
  });

  const checkSubscription = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase.functions.invoke('check-subscription');
      if (data) {
        setSubscription({
          subscribed: data.subscribed || false,
          tier: data.subscription_tier || null,
          endDate: data.subscription_end || null
        });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  useEffect(() => {
    // Listen for auth changes FIRST
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Defer Supabase calls to avoid deadlocks
        setTimeout(() => {
          fetchUserProfile(session.user!.id);
          checkSubscription();
          upsertProfileFromLocalStorage();
        }, 0);
      } else {
        setProfile(null);
        setSubscription({ subscribed: false, tier: null, endDate: null });
      }
      setLoading(false);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          fetchUserProfile(session.user!.id);
          checkSubscription();
          upsertProfileFromLocalStorage();
        }, 0);
      }
      setLoading(false);
    });

    return () => authSubscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('docs_users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        throw error as any;
      } else {
        setProfile((data as any) || null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    await fetchUserProfile(user.id);
  };

  const upsertProfileFromLocalStorage = async () => {
    try {
      const pendingRaw = localStorage.getItem('pendingSignup');
      if (!pendingRaw || !user) return;
      const pending = JSON.parse(pendingRaw);
      const body: any = {
        full_name: pending.fullName,
        role: pending.role,
        email: user.email,
      };
      const { data, error } = await supabase.functions.invoke('upsert-profile', {
        body,
      });
      if (error) {
        console.error('Error upserting profile after signup:', error);
      } else {
        localStorage.removeItem('pendingSignup');
        await fetchUserProfile(user.id);
      }
    } catch (err) {
      console.error('Error handling pending signup:', err);
    }
  };
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) return { error };

      if (data.user) {
        // Store details to finish profile creation after email verification
        localStorage.setItem('pendingSignup', JSON.stringify({ fullName, role }));

        // If session exists immediately (email confirmations disabled), insert profile now
        if (data.session?.user) {
          const { error: profileError } = await supabase
            .from('docs_users')
            .insert({
              id: data.user.id,
              full_name: fullName,
              role: role as any,
              email: data.user.email,
            });

          if (profileError) {
            console.error('Error creating user profile:', profileError);
          } else {
            localStorage.removeItem('pendingSignup');
          }
        }
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };
  const signOut = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn("No session to sign out.");
      setUser(null);
      setProfile(null);
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateProfile = async (updates: any) => {
    try {
      if (!user) throw new Error('No user logged in');

      // Ensure a row exists; if not, create one with required fields
      const { data: existing, error: fetchErr } = await supabase
        .from('docs_users')
        .select('id, full_name, email, role')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchErr) throw fetchErr as any;

      if (!existing) {
        // Insert minimal required record, then merge updates
        const base = {
          id: user.id,
          full_name: updates.full_name || (user.user_metadata as any)?.full_name || user.email?.split('@')[0] || 'New User',
          role: 'member',
          email: user.email,
        };
        const { data: inserted, error: insertErr } = await supabase
          .from('docs_users')
          .insert({ ...base, ...updates })
          .select()
          .single();
        if (insertErr) throw insertErr as any;
        setProfile(inserted as any);
        return { error: null };
      }

      const { data, error } = await supabase
        .from('docs_users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error as any;
      setProfile(data as any);
      
      return { error: null };
    } catch (error) {
      console.error('updateProfile error', error);
      return { error };
    }
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    subscription,
    checkSubscription,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
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
