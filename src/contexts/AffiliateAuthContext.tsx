import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AffiliateUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  phone?: string;
  status: 'pending' | 'approved' | 'suspended';
  total_earnings: number;
  monthly_earnings: number;
  total_referrals: number;
  total_overrides: number;
}

interface AffiliateAuthContextType {
  user: AffiliateUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, firstName: string, lastName: string, companyName?: string, phone?: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  refreshUser: () => Promise<void>;
}

const AffiliateAuthContext = createContext<AffiliateAuthContextType | undefined>(undefined);

export const AffiliateAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AffiliateUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const sessionToken = localStorage.getItem('affiliate_session_token');
      if (sessionToken) {
        const { data, error } = await supabase
          .from('affiliate_sessions')
          .select('affiliate_user_id, expires_at')
          .eq('session_token', sessionToken)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (error || !data) {
          localStorage.removeItem('affiliate_session_token');
        } else {
          // Get user data
          const { data: userData, error: userError } = await supabase
            .from('affiliate_users')
            .select('*')
            .eq('id', data.affiliate_user_id)
            .single();

          if (!userError && userData) {
            setUser(userData as AffiliateUser);
          }
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // For now, we'll implement a simple check - in production you'd hash passwords
      const { data: userData, error: userError } = await supabase
        .from('affiliate_users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        return { error: { message: 'Invalid email or password' } };
      }

      // In production, verify hashed password here
      // For now, accept any password (this should be properly implemented)
      
      // Create session
      const sessionToken = generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      const { error: sessionError } = await supabase
        .from('affiliate_sessions')
        .insert({
          affiliate_user_id: userData.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString()
        });

      if (sessionError) {
        return { error: sessionError };
      }

      localStorage.setItem('affiliate_session_token', sessionToken);
      setUser(userData as AffiliateUser);
      
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string, companyName?: string, phone?: string) => {
    try {
      setLoading(true);
      
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('affiliate_users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return { error: { message: 'User with this email already exists' } };
      }

      // In production, hash the password properly
      const passwordHash = password; // This should be properly hashed
      
      const { data, error } = await supabase
        .from('affiliate_users')
        .insert({
          email,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          company_name: companyName,
          phone,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const sessionToken = localStorage.getItem('affiliate_session_token');
      if (sessionToken) {
        // Remove session from database
        await supabase
          .from('affiliate_sessions')
          .delete()
          .eq('session_token', sessionToken);
      }
      
      localStorage.removeItem('affiliate_session_token');
      setUser(null);
      
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const refreshUser = async () => {
    if (user) {
      const { data, error } = await supabase
        .from('affiliate_users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setUser(data as AffiliateUser);
      }
    }
  };

  const generateSessionToken = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => 
      byte.toString(16).padStart(2, '0')
    ).join('');
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser
  };

  return (
    <AffiliateAuthContext.Provider value={value}>
      {children}
    </AffiliateAuthContext.Provider>
  );
};

export const useAffiliateAuth = () => {
  const context = useContext(AffiliateAuthContext);
  if (context === undefined) {
    throw new Error('useAffiliateAuth must be used within an AffiliateAuthProvider');
  }
  return context;
};