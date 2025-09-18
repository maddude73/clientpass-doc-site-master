import { createClient } from '@supabase/supabase-js'

// Using the actual Supabase project values for this Lovable project
const supabaseUrl = 'https://fuvqfxaifuprdqtgruxt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1dnFmeGFpZnVwcmRxdGdydXh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MDAwMTQsImV4cCI6MjA3MDI3NjAxNH0.5N7c2QtM775Otdbr_XXuv55SwTug01ZnhetUYuwyDAU'

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please ensure Supabase is properly configured in your Lovable project.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          role: 'Stylist' | 'SuiteOwner' | 'Affiliate' | 'Client' | 'Admin'
          membership: 'Free' | 'Pro'
          full_name: string | null
          phone: string | null
          location: any
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          is_available_now: boolean
          coverage_mode: boolean
          stripe_account_id: string | null
          payout_ready: boolean
          referral_code: string | null
          invited_by: string | null
          last_active: string
          email_marketing_opt_in: boolean
          sms_marketing_opt_in: boolean
          unsubscribed_at: string | null
          sms_opted_out_at: string | null
          terms_accepted: boolean
          terms_accepted_at: string | null
          privacy_accepted: boolean
          privacy_accepted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: 'Stylist' | 'SuiteOwner' | 'Affiliate' | 'Client' | 'Admin'
          membership?: 'Free' | 'Pro'
          full_name?: string | null
          phone?: string | null
          location?: any
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          is_available_now?: boolean
          coverage_mode?: boolean
          stripe_account_id?: string | null
          payout_ready?: boolean
          referral_code?: string | null
          invited_by?: string | null
          last_active?: string
          email_marketing_opt_in?: boolean
          sms_marketing_opt_in?: boolean
          unsubscribed_at?: string | null
          sms_opted_out_at?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          privacy_accepted?: boolean
          privacy_accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'Stylist' | 'SuiteOwner' | 'Affiliate' | 'Client' | 'Admin'
          membership?: 'Free' | 'Pro'
          full_name?: string | null
          phone?: string | null
          location?: any
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          is_available_now?: boolean
          coverage_mode?: boolean
          stripe_account_id?: string | null
          payout_ready?: boolean
          referral_code?: string | null
          invited_by?: string | null
          last_active?: string
          email_marketing_opt_in?: boolean
          sms_marketing_opt_in?: boolean
          unsubscribed_at?: string | null
          sms_opted_out_at?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          privacy_accepted?: boolean
          privacy_accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          name: string
          description: string | null
          base_price: number | null
          duration_minutes: number | null
          category: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          base_price?: number | null
          duration_minutes?: number | null
          category?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          base_price?: number | null
          duration_minutes?: number | null
          category?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      referrals: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string | null
          client_user_id: string | null
          client_name: string | null
          client_phone: string | null
          service_id: string | null
          contact_source: 'Phone' | 'Text' | 'DM' | 'WalkIn' | null
          commission_percent: number
          status: 'Pending' | 'Accepted' | 'Completed' | 'Paid' | 'Declined' | 'Reassigned'
          is_same_day: boolean
          timer_started_at: string | null
          timer_expires_at: string | null
          accepted_at: string | null
          completed_at: string | null
          deposit_amount: number | null
          deposit_paid: boolean
          manual_payment: boolean
          manual_fee_applied: boolean
          total_service_amount: number | null
          platform_fee_applied: number | null
          notes: string | null
          attempted_receivers: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id?: string | null
          client_user_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          service_id?: string | null
          contact_source?: 'Phone' | 'Text' | 'DM' | 'WalkIn' | null
          commission_percent: number
          status?: 'Pending' | 'Accepted' | 'Completed' | 'Paid' | 'Declined' | 'Reassigned'
          is_same_day?: boolean
          timer_started_at?: string | null
          timer_expires_at?: string | null
          accepted_at?: string | null
          completed_at?: string | null
          deposit_amount?: number | null
          deposit_paid?: boolean
          manual_payment?: boolean
          manual_fee_applied?: boolean
          total_service_amount?: number | null
          platform_fee_applied?: number | null
          notes?: string | null
          attempted_receivers?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string | null
          client_user_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          service_id?: string | null
          contact_source?: 'Phone' | 'Text' | 'DM' | 'WalkIn' | null
          commission_percent?: number
          status?: 'Pending' | 'Accepted' | 'Completed' | 'Paid' | 'Declined' | 'Reassigned'
          is_same_day?: boolean
          timer_started_at?: string | null
          timer_expires_at?: string | null
          accepted_at?: string | null
          completed_at?: string | null
          deposit_amount?: number | null
          deposit_paid?: boolean
          manual_payment?: boolean
          manual_fee_applied?: boolean
          total_service_amount?: number | null
          platform_fee_applied?: number | null
          notes?: string | null
          attempted_receivers?: string[]
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}