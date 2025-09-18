export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ad_placements: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          description: string | null
          end_at: string | null
          featured: boolean
          id: string
          link_url: string | null
          logo_url: string | null
          start_at: string | null
          title: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          end_at?: string | null
          featured?: boolean
          id?: string
          link_url?: string | null
          logo_url?: string | null
          start_at?: string | null
          title: string
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          end_at?: string | null
          featured?: boolean
          id?: string
          link_url?: string | null
          logo_url?: string | null
          start_at?: string | null
          title?: string
        }
        Relationships: []
      }
      affiliate_business_uploads: {
        Row: {
          affiliate_user_id: string
          business_name: string
          business_type: string
          contact_email: string | null
          contact_phone: string | null
          description: string | null
          id: string
          reviewed_at: string | null
          reviewer_notes: string | null
          status: string | null
          submitted_at: string
          website_url: string | null
        }
        Insert: {
          affiliate_user_id: string
          business_name: string
          business_type: string
          contact_email?: string | null
          contact_phone?: string | null
          description?: string | null
          id?: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string | null
          submitted_at?: string
          website_url?: string | null
        }
        Update: {
          affiliate_user_id?: string
          business_name?: string
          business_type?: string
          contact_email?: string | null
          contact_phone?: string | null
          description?: string | null
          id?: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string | null
          submitted_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_business_uploads_affiliate_user_id_fkey"
            columns: ["affiliate_user_id"]
            isOneToOne: false
            referencedRelation: "affiliate_users"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_commissions: {
        Row: {
          amount: number
          created_at: string
          earner_id: string
          id: string
          paid_at: string | null
          parent_affiliate_id: string | null
          referral_id: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          earner_id: string
          id?: string
          paid_at?: string | null
          parent_affiliate_id?: string | null
          referral_id?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          earner_id?: string
          id?: string
          paid_at?: string | null
          parent_affiliate_id?: string | null
          referral_id?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_earner_id_fkey"
            columns: ["earner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_parent_affiliate_id_fkey"
            columns: ["parent_affiliate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_links: {
        Row: {
          code: string
          created_at: string
          first_booking_only: boolean
          id: string
          owner_id: string
          target: string
        }
        Insert: {
          code: string
          created_at?: string
          first_booking_only?: boolean
          id?: string
          owner_id: string
          target?: string
        }
        Update: {
          code?: string
          created_at?: string
          first_booking_only?: boolean
          id?: string
          owner_id?: string
          target?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_profiles: {
        Row: {
          created_at: string
          earnings_available: number | null
          earnings_pending: number | null
          earnings_total: number | null
          lifetime_override_active: boolean
          override_pct: number
          referred_affiliates: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          earnings_available?: number | null
          earnings_pending?: number | null
          earnings_total?: number | null
          lifetime_override_active?: boolean
          override_pct?: number
          referred_affiliates?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          earnings_available?: number | null
          earnings_pending?: number | null
          earnings_total?: number | null
          lifetime_override_active?: boolean
          override_pct?: number
          referred_affiliates?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_sessions: {
        Row: {
          affiliate_user_id: string
          created_at: string
          expires_at: string
          id: string
          session_token: string
        }
        Insert: {
          affiliate_user_id: string
          created_at?: string
          expires_at: string
          id?: string
          session_token: string
        }
        Update: {
          affiliate_user_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_sessions_affiliate_user_id_fkey"
            columns: ["affiliate_user_id"]
            isOneToOne: false
            referencedRelation: "affiliate_users"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_users: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          monthly_earnings: number | null
          password_hash: string
          phone: string | null
          status: string | null
          total_earnings: number | null
          total_overrides: number | null
          total_referrals: number | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          monthly_earnings?: number | null
          password_hash: string
          phone?: string | null
          status?: string | null
          total_earnings?: number | null
          total_overrides?: number | null
          total_referrals?: number | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          monthly_earnings?: number | null
          password_hash?: string
          phone?: string | null
          status?: string | null
          total_earnings?: number | null
          total_overrides?: number | null
          total_referrals?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      auto_match_preferences: {
        Row: {
          availability_preference: string | null
          created_at: string | null
          distance_radius: number | null
          id: string
          selected_services: string[] | null
          updated_at: string | null
          user_id: string
          zip_code: string | null
        }
        Insert: {
          availability_preference?: string | null
          created_at?: string | null
          distance_radius?: number | null
          id?: string
          selected_services?: string[] | null
          updated_at?: string | null
          user_id: string
          zip_code?: string | null
        }
        Update: {
          availability_preference?: string | null
          created_at?: string | null
          distance_radius?: number | null
          id?: string
          selected_services?: string[] | null
          updated_at?: string | null
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      auto_suggest_tracking: {
        Row: {
          completed_count: number
          cooldown_until: string | null
          created_at: string
          id: string
          last_suggested_at: string | null
          partner_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_count?: number
          cooldown_until?: string | null
          created_at?: string
          id?: string
          last_suggested_at?: string | null
          partner_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_count?: number
          cooldown_until?: string | null
          created_at?: string
          id?: string
          last_suggested_at?: string | null
          partner_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      boosts: {
        Row: {
          active: boolean | null
          amount_paid: number | null
          boost_type: string | null
          created_at: string
          end_at: string
          id: string
          payment_id: string | null
          pro_id: string | null
          start_at: string
          status: string | null
          used_free_credit: boolean | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          amount_paid?: number | null
          boost_type?: string | null
          created_at?: string
          end_at: string
          id?: string
          payment_id?: string | null
          pro_id?: string | null
          start_at?: string
          status?: string | null
          used_free_credit?: boolean | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          amount_paid?: number | null
          boost_type?: string | null
          created_at?: string
          end_at?: string
          id?: string
          payment_id?: string | null
          pro_id?: string | null
          start_at?: string
          status?: string | null
          used_free_credit?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boosts_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      business_uploads: {
        Row: {
          approved: boolean
          business_name: string
          category: string | null
          contact: string | null
          created_at: string
          id: string
          notes: string | null
          submitted_by: string
        }
        Insert: {
          approved?: boolean
          business_name: string
          category?: string | null
          contact?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          submitted_by: string
        }
        Update: {
          approved?: boolean
          business_name?: string
          category?: string | null
          contact?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          submitted_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_uploads_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          created_at: string
          referral_link_token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          referral_link_token?: string
          user_id: string
        }
        Update: {
          created_at?: string
          referral_link_token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      client_referral_links: {
        Row: {
          client_token: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          referral_id: string | null
        }
        Insert: {
          client_token?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          referral_id?: string | null
        }
        Update: {
          client_token?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          referral_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_referral_links_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount: number
          basis_amount: number
          booking_id: string | null
          created_at: string
          id: string
          payee_id: string | null
          percentage: number
          role: string
        }
        Insert: {
          amount: number
          basis_amount: number
          booking_id?: string | null
          created_at?: string
          id?: string
          payee_id?: string | null
          percentage: number
          role: string
        }
        Update: {
          amount?: number
          basis_amount?: number
          booking_id?: string | null
          created_at?: string
          id?: string
          payee_id?: string | null
          percentage?: number
          role?: string
        }
        Relationships: []
      }
      config: {
        Row: {
          key: string
          value: number
        }
        Insert: {
          key: string
          value: number
        }
        Update: {
          key?: string
          value?: number
        }
        Relationships: []
      }
      deals: {
        Row: {
          badge: string | null
          blurb: string | null
          category: string
          created_at: string
          id: string
          is_active: boolean
          is_featured: boolean
          logo_url: string | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          badge?: string | null
          blurb?: string | null
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          logo_url?: string | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          badge?: string | null
          blurb?: string | null
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          logo_url?: string | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      export_logs: {
        Row: {
          admin_user: string
          created_at: string
          dataset: string
          filters_json: Json | null
          id: string
          row_count: number | null
        }
        Insert: {
          admin_user: string
          created_at?: string
          dataset: string
          filters_json?: Json | null
          id?: string
          row_count?: number | null
        }
        Update: {
          admin_user?: string
          created_at?: string
          dataset?: string
          filters_json?: Json | null
          id?: string
          row_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "export_logs_admin_user_fkey"
            columns: ["admin_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hot_seats: {
        Row: {
          active: boolean | null
          audience: string
          claimed_by_user_id: string | null
          created_at: string
          deposit_amount: number | null
          deposit_required: boolean | null
          discount_price: number | null
          duration_minutes: number | null
          expires_at: string
          id: string
          location: string
          notes: string | null
          original_price: number | null
          service: string
          time_slot: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          audience?: string
          claimed_by_user_id?: string | null
          created_at?: string
          deposit_amount?: number | null
          deposit_required?: boolean | null
          discount_price?: number | null
          duration_minutes?: number | null
          expires_at: string
          id?: string
          location: string
          notes?: string | null
          original_price?: number | null
          service: string
          time_slot: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          audience?: string
          claimed_by_user_id?: string | null
          created_at?: string
          deposit_amount?: number | null
          deposit_required?: boolean | null
          discount_price?: number | null
          duration_minutes?: number | null
          expires_at?: string
          id?: string
          location?: string
          notes?: string | null
          original_price?: number | null
          service?: string
          time_slot?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      manual_stylists: {
        Row: {
          created_at: string
          created_by: string
          email: string | null
          full_name: string
          id: string
          location: string
          phone: string | null
          services: string[] | null
          zip_code: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          email?: string | null
          full_name: string
          id?: string
          location: string
          phone?: string | null
          services?: string[] | null
          zip_code?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string | null
          full_name?: string
          id?: string
          location?: string
          phone?: string | null
          services?: string[] | null
          zip_code?: string | null
        }
        Relationships: []
      }
      message_logs: {
        Row: {
          created_at: string | null
          id: string
          message_content: string
          message_type: string
          recipient_type: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_content: string
          message_type: string
          recipient_type: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message_content?: string
          message_type?: string
          recipient_type?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          sent_at: string | null
          status: string
          title: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          sent_at?: string | null
          status?: string
          title?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          sent_at?: string | null
          status?: string
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_queue: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      open_chairs: {
        Row: {
          acceptance_lock_until: string | null
          accepted_at: string | null
          active: boolean | null
          audience: string | null
          capacity: number | null
          claimed_by_user_id: string | null
          commission: number | null
          created_at: string | null
          end_at: string | null
          end_time: string | null
          expires_at: string | null
          host_pct: number | null
          id: string
          location: string
          location_address: string | null
          location_zip: string | null
          notes: string | null
          priority: string | null
          receiver_pro_id: string | null
          seats: number | null
          service_id: string | null
          services_allowed: string[] | null
          services_needed: string[] | null
          start_at: string | null
          start_time: string | null
          status: string | null
          time_window: string
          user_id: string | null
          zip_code: string
        }
        Insert: {
          acceptance_lock_until?: string | null
          accepted_at?: string | null
          active?: boolean | null
          audience?: string | null
          capacity?: number | null
          claimed_by_user_id?: string | null
          commission?: number | null
          created_at?: string | null
          end_at?: string | null
          end_time?: string | null
          expires_at?: string | null
          host_pct?: number | null
          id?: string
          location: string
          location_address?: string | null
          location_zip?: string | null
          notes?: string | null
          priority?: string | null
          receiver_pro_id?: string | null
          seats?: number | null
          service_id?: string | null
          services_allowed?: string[] | null
          services_needed?: string[] | null
          start_at?: string | null
          start_time?: string | null
          status?: string | null
          time_window: string
          user_id?: string | null
          zip_code: string
        }
        Update: {
          acceptance_lock_until?: string | null
          accepted_at?: string | null
          active?: boolean | null
          audience?: string | null
          capacity?: number | null
          claimed_by_user_id?: string | null
          commission?: number | null
          created_at?: string | null
          end_at?: string | null
          end_time?: string | null
          expires_at?: string | null
          host_pct?: number | null
          id?: string
          location?: string
          location_address?: string | null
          location_zip?: string | null
          notes?: string | null
          priority?: string | null
          receiver_pro_id?: string | null
          seats?: number | null
          service_id?: string | null
          services_allowed?: string[] | null
          services_needed?: string[] | null
          start_at?: string | null
          start_time?: string | null
          status?: string | null
          time_window?: string
          user_id?: string | null
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "open_chairs_claimed_by_user_id_fkey"
            columns: ["claimed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "open_chairs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "open_chairs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          commission_amount: number | null
          created_at: string
          currency: string
          deposit_amount: number | null
          id: string
          manual_fee_amount: number | null
          manual_logging_fee: number | null
          metadata: Json
          method: string | null
          net_to_affiliate_override: number | null
          net_to_referrer: number | null
          net_to_servicing_pro: number | null
          paid_at: string | null
          payee: string | null
          payer: string | null
          platform_fee: number | null
          referral_id: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_transfer_override_id: string | null
          stripe_transfer_to_pro_id: string | null
          stripe_transfer_to_referrer_id: string | null
          subtotal_service_amount: number | null
          transaction_fee_amount: number | null
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          commission_amount?: number | null
          created_at?: string
          currency?: string
          deposit_amount?: number | null
          id?: string
          manual_fee_amount?: number | null
          manual_logging_fee?: number | null
          metadata?: Json
          method?: string | null
          net_to_affiliate_override?: number | null
          net_to_referrer?: number | null
          net_to_servicing_pro?: number | null
          paid_at?: string | null
          payee?: string | null
          payer?: string | null
          platform_fee?: number | null
          referral_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_transfer_override_id?: string | null
          stripe_transfer_to_pro_id?: string | null
          stripe_transfer_to_referrer_id?: string | null
          subtotal_service_amount?: number | null
          transaction_fee_amount?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          commission_amount?: number | null
          created_at?: string
          currency?: string
          deposit_amount?: number | null
          id?: string
          manual_fee_amount?: number | null
          manual_logging_fee?: number | null
          metadata?: Json
          method?: string | null
          net_to_affiliate_override?: number | null
          net_to_referrer?: number | null
          net_to_servicing_pro?: number | null
          paid_at?: string | null
          payee?: string | null
          payer?: string | null
          platform_fee?: number | null
          referral_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_transfer_override_id?: string | null
          stripe_transfer_to_pro_id?: string | null
          stripe_transfer_to_referrer_id?: string | null
          subtotal_service_amount?: number | null
          transaction_fee_amount?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_payee_fkey"
            columns: ["payee"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payer_fkey"
            columns: ["payer"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_networks: {
        Row: {
          added_at: string
          id: string
          is_favorite: boolean
          manual_stylist_id: string | null
          network_stylist_id: string | null
          notes: string | null
          stylist_type: string
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          is_favorite?: boolean
          manual_stylist_id?: string | null
          network_stylist_id?: string | null
          notes?: string | null
          stylist_type?: string
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          is_favorite?: boolean
          manual_stylist_id?: string | null
          network_stylist_id?: string | null
          notes?: string | null
          stylist_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_networks_manual_stylist_id_fkey"
            columns: ["manual_stylist_id"]
            isOneToOne: false
            referencedRelation: "manual_stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rater_type: string
          referral_id: string | null
          score: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rater_type: string
          referral_id?: string | null
          score: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rater_type?: string
          referral_id?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_confirmations: {
        Row: {
          by_user: string
          confirmed_at: string
          id: string
          referral_id: string
          type: string
          value: boolean
        }
        Insert: {
          by_user: string
          confirmed_at?: string
          id?: string
          referral_id: string
          type: string
          value: boolean
        }
        Update: {
          by_user?: string
          confirmed_at?: string
          id?: string
          referral_id?: string
          type?: string
          value?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "referral_confirmations_by_user_fkey"
            columns: ["by_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_confirmations_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_favorites: {
        Row: {
          added_at: string
          favorited_stylist_id: string
          id: string
          notes: string | null
          referral_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          favorited_stylist_id: string
          id?: string
          notes?: string | null
          referral_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          favorited_stylist_id?: string
          id?: string
          notes?: string | null
          referral_id?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          accept_deadline: string | null
          accepted_at: string | null
          appointment_datetime: string | null
          assigned_to: string | null
          attempted_users: string[] | null
          booking_source: string | null
          client_confirmed: boolean
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          client_user: string | null
          commission_pct: number | null
          completed_at: string | null
          contact_source: Database["public"]["Enums"]["contact_source"] | null
          coverage_mode: boolean | null
          created_at: string
          created_by: string | null
          created_via: string | null
          deposit_amount: number | null
          deposit_pct_snapshot: number | null
          deposit_required: boolean
          deposit_status: string | null
          dual_confirmation_referrer: boolean | null
          dual_confirmation_stylist: boolean | null
          expires_at: string
          hot_seat_id: string | null
          id: string
          invited_pros_queue: string[] | null
          location_address: string | null
          location_zip: string | null
          manual_fee_applied: boolean | null
          manual_payment: boolean | null
          notes: string | null
          open_chair_id: string | null
          paid_at: string | null
          platform_fee_applied: number | null
          priority_level: string | null
          rated: boolean
          rating: number | null
          receiver_email: string
          receiver_id: string | null
          receiving_pro: string | null
          reschedule_deadline: string | null
          response_deadline: string | null
          review: string | null
          same_day: boolean | null
          sender_id: string
          sender_pro: string | null
          sender_type: string | null
          service_amount: number | null
          service_category: string | null
          service_date: string | null
          service_duration_min_snapshot: number | null
          service_name_snapshot: string | null
          service_price_actual: number | null
          service_price_cents_snapshot: number | null
          service_price_estimate: number | null
          service_rendered_confirmed: boolean | null
          service_title: string | null
          service_type: string | null
          source: string | null
          status: string
          timer_duration_minutes: number | null
          tips_private: boolean | null
          total_service_amount: number | null
          updated_at: string
          walk_in: boolean | null
        }
        Insert: {
          accept_deadline?: string | null
          accepted_at?: string | null
          appointment_datetime?: string | null
          assigned_to?: string | null
          attempted_users?: string[] | null
          booking_source?: string | null
          client_confirmed?: boolean
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_user?: string | null
          commission_pct?: number | null
          completed_at?: string | null
          contact_source?: Database["public"]["Enums"]["contact_source"] | null
          coverage_mode?: boolean | null
          created_at?: string
          created_by?: string | null
          created_via?: string | null
          deposit_amount?: number | null
          deposit_pct_snapshot?: number | null
          deposit_required?: boolean
          deposit_status?: string | null
          dual_confirmation_referrer?: boolean | null
          dual_confirmation_stylist?: boolean | null
          expires_at?: string
          hot_seat_id?: string | null
          id?: string
          invited_pros_queue?: string[] | null
          location_address?: string | null
          location_zip?: string | null
          manual_fee_applied?: boolean | null
          manual_payment?: boolean | null
          notes?: string | null
          open_chair_id?: string | null
          paid_at?: string | null
          platform_fee_applied?: number | null
          priority_level?: string | null
          rated?: boolean
          rating?: number | null
          receiver_email: string
          receiver_id?: string | null
          receiving_pro?: string | null
          reschedule_deadline?: string | null
          response_deadline?: string | null
          review?: string | null
          same_day?: boolean | null
          sender_id: string
          sender_pro?: string | null
          sender_type?: string | null
          service_amount?: number | null
          service_category?: string | null
          service_date?: string | null
          service_duration_min_snapshot?: number | null
          service_name_snapshot?: string | null
          service_price_actual?: number | null
          service_price_cents_snapshot?: number | null
          service_price_estimate?: number | null
          service_rendered_confirmed?: boolean | null
          service_title?: string | null
          service_type?: string | null
          source?: string | null
          status?: string
          timer_duration_minutes?: number | null
          tips_private?: boolean | null
          total_service_amount?: number | null
          updated_at?: string
          walk_in?: boolean | null
        }
        Update: {
          accept_deadline?: string | null
          accepted_at?: string | null
          appointment_datetime?: string | null
          assigned_to?: string | null
          attempted_users?: string[] | null
          booking_source?: string | null
          client_confirmed?: boolean
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_user?: string | null
          commission_pct?: number | null
          completed_at?: string | null
          contact_source?: Database["public"]["Enums"]["contact_source"] | null
          coverage_mode?: boolean | null
          created_at?: string
          created_by?: string | null
          created_via?: string | null
          deposit_amount?: number | null
          deposit_pct_snapshot?: number | null
          deposit_required?: boolean
          deposit_status?: string | null
          dual_confirmation_referrer?: boolean | null
          dual_confirmation_stylist?: boolean | null
          expires_at?: string
          hot_seat_id?: string | null
          id?: string
          invited_pros_queue?: string[] | null
          location_address?: string | null
          location_zip?: string | null
          manual_fee_applied?: boolean | null
          manual_payment?: boolean | null
          notes?: string | null
          open_chair_id?: string | null
          paid_at?: string | null
          platform_fee_applied?: number | null
          priority_level?: string | null
          rated?: boolean
          rating?: number | null
          receiver_email?: string
          receiver_id?: string | null
          receiving_pro?: string | null
          reschedule_deadline?: string | null
          response_deadline?: string | null
          review?: string | null
          same_day?: boolean | null
          sender_id?: string
          sender_pro?: string | null
          sender_type?: string | null
          service_amount?: number | null
          service_category?: string | null
          service_date?: string | null
          service_duration_min_snapshot?: number | null
          service_name_snapshot?: string | null
          service_price_actual?: number | null
          service_price_cents_snapshot?: number | null
          service_price_estimate?: number | null
          service_rendered_confirmed?: boolean | null
          service_title?: string | null
          service_type?: string | null
          source?: string | null
          status?: string
          timer_duration_minutes?: number | null
          tips_private?: boolean | null
          total_service_amount?: number | null
          updated_at?: string
          walk_in?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_client_user_fkey"
            columns: ["client_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_hot_seat_id_fkey"
            columns: ["hot_seat_id"]
            isOneToOne: false
            referencedRelation: "hot_seats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_receiving_pro_fkey"
            columns: ["receiving_pro"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_sender_pro_fkey"
            columns: ["sender_pro"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category_id: string | null
          created_at: string
          deposit_pct: number | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
          price_cents: number | null
          pro_id: string | null
          provider_id: string | null
          service_type: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          deposit_pct?: number | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
          price_cents?: number | null
          pro_id?: string | null
          provider_id?: string | null
          service_type?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          deposit_pct?: number | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
          price_cents?: number | null
          pro_id?: string | null
          provider_id?: string | null
          service_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      suite_referral_tracking: {
        Row: {
          created_at: string | null
          id: string
          referral_id: string
          suite_location: string
          suite_owner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referral_id: string
          suite_location: string
          suite_owner_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referral_id?: string
          suite_location?: string
          suite_owner_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suite_referral_tracking_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suite_referral_tracking_suite_owner_id_fkey"
            columns: ["suite_owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_network: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          partner_email: string | null
          partner_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id: string
          partner_email?: string | null
          partner_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          partner_email?: string | null
          partner_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          active_mode: boolean
          address: string | null
          alert_status_active: boolean | null
          city: string | null
          coverage_backup: string[] | null
          coverage_commission_pct: number | null
          coverage_list: string[]
          coverage_mode: boolean | null
          created_at: string
          earnings_available: number | null
          earnings_pending: number | null
          earnings_total: number | null
          email: string | null
          email_marketing_opt_in: boolean | null
          free_boosts_reset_date: string | null
          free_boosts_used_this_month: number | null
          full_name: string
          id: string
          invited_by: string | null
          invited_by_user: string | null
          is_available_now: boolean | null
          last_active: string | null
          latitude: number | null
          legal_disclaimer_accepted: boolean | null
          legal_disclaimer_accepted_at: string | null
          location: string | null
          longitude: number | null
          marketing_opt_in: boolean
          membership: Database["public"]["Enums"]["membership_tier"] | null
          membership_tier: Database["public"]["Enums"]["membership_tier"]
          notification_prefs: Json
          open_chair_alerts_enabled: boolean | null
          open_chair_commission_pct: number | null
          payout_ready: boolean | null
          phone: string | null
          photo_url: string | null
          privacy_accepted: boolean | null
          privacy_accepted_at: string | null
          pro_active_until: string | null
          professional_type: string | null
          referral_code: string
          referral_commission_pct: number | null
          role: string
          role_tag: string | null
          sms_marketing_opt_in: boolean | null
          sms_opted_out_at: string | null
          state: string | null
          stripe_account_id: string | null
          stripe_connect_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          suite_incentive_message: string | null
          suite_owner: boolean | null
          terms_accepted: boolean | null
          terms_accepted_at: string | null
          trusted_partners: string[] | null
          unsubscribed_at: string | null
          updated_at: string
          walk_in_referrals_enabled: boolean | null
          zip_code: string | null
        }
        Insert: {
          active_mode?: boolean
          address?: string | null
          alert_status_active?: boolean | null
          city?: string | null
          coverage_backup?: string[] | null
          coverage_commission_pct?: number | null
          coverage_list?: string[]
          coverage_mode?: boolean | null
          created_at?: string
          earnings_available?: number | null
          earnings_pending?: number | null
          earnings_total?: number | null
          email?: string | null
          email_marketing_opt_in?: boolean | null
          free_boosts_reset_date?: string | null
          free_boosts_used_this_month?: number | null
          full_name: string
          id: string
          invited_by?: string | null
          invited_by_user?: string | null
          is_available_now?: boolean | null
          last_active?: string | null
          latitude?: number | null
          legal_disclaimer_accepted?: boolean | null
          legal_disclaimer_accepted_at?: string | null
          location?: string | null
          longitude?: number | null
          marketing_opt_in?: boolean
          membership?: Database["public"]["Enums"]["membership_tier"] | null
          membership_tier?: Database["public"]["Enums"]["membership_tier"]
          notification_prefs?: Json
          open_chair_alerts_enabled?: boolean | null
          open_chair_commission_pct?: number | null
          payout_ready?: boolean | null
          phone?: string | null
          photo_url?: string | null
          privacy_accepted?: boolean | null
          privacy_accepted_at?: string | null
          pro_active_until?: string | null
          professional_type?: string | null
          referral_code: string
          referral_commission_pct?: number | null
          role: string
          role_tag?: string | null
          sms_marketing_opt_in?: boolean | null
          sms_opted_out_at?: string | null
          state?: string | null
          stripe_account_id?: string | null
          stripe_connect_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          suite_incentive_message?: string | null
          suite_owner?: boolean | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          trusted_partners?: string[] | null
          unsubscribed_at?: string | null
          updated_at?: string
          walk_in_referrals_enabled?: boolean | null
          zip_code?: string | null
        }
        Update: {
          active_mode?: boolean
          address?: string | null
          alert_status_active?: boolean | null
          city?: string | null
          coverage_backup?: string[] | null
          coverage_commission_pct?: number | null
          coverage_list?: string[]
          coverage_mode?: boolean | null
          created_at?: string
          earnings_available?: number | null
          earnings_pending?: number | null
          earnings_total?: number | null
          email?: string | null
          email_marketing_opt_in?: boolean | null
          free_boosts_reset_date?: string | null
          free_boosts_used_this_month?: number | null
          full_name?: string
          id?: string
          invited_by?: string | null
          invited_by_user?: string | null
          is_available_now?: boolean | null
          last_active?: string | null
          latitude?: number | null
          legal_disclaimer_accepted?: boolean | null
          legal_disclaimer_accepted_at?: string | null
          location?: string | null
          longitude?: number | null
          marketing_opt_in?: boolean
          membership?: Database["public"]["Enums"]["membership_tier"] | null
          membership_tier?: Database["public"]["Enums"]["membership_tier"]
          notification_prefs?: Json
          open_chair_alerts_enabled?: boolean | null
          open_chair_commission_pct?: number | null
          payout_ready?: boolean | null
          phone?: string | null
          photo_url?: string | null
          privacy_accepted?: boolean | null
          privacy_accepted_at?: string | null
          pro_active_until?: string | null
          professional_type?: string | null
          referral_code?: string
          referral_commission_pct?: number | null
          role?: string
          role_tag?: string | null
          sms_marketing_opt_in?: boolean | null
          sms_opted_out_at?: string | null
          state?: string | null
          stripe_account_id?: string | null
          stripe_connect_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          suite_incentive_message?: string | null
          suite_owner?: boolean | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          trusted_partners?: string[] | null
          unsubscribed_at?: string | null
          updated_at?: string
          walk_in_referrals_enabled?: boolean | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_invited_by_user_fkey"
            columns: ["invited_by_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_boost_expiry: {
        Args: { user_id: string }
        Returns: string
      }
      get_current_affiliate_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_active_boost: {
        Args: { user_id: string }
        Returns: boolean
      }
      migrate_preset_services_to_pro_services: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      reset_monthly_free_boosts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      contact_source: "phone" | "text" | "dm" | "walk_in"
      membership_tier: "free" | "pro"
      payment_method_type: "in_app" | "manual"
      referral_status:
        | "pending"
        | "accepted"
        | "expired"
        | "declined"
        | "cancelled"
        | "completed"
        | "disputed"
      user_role: "stylist" | "affiliate" | "client" | "owner" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      contact_source: ["phone", "text", "dm", "walk_in"],
      membership_tier: ["free", "pro"],
      payment_method_type: ["in_app", "manual"],
      referral_status: [
        "pending",
        "accepted",
        "expired",
        "declined",
        "cancelled",
        "completed",
        "disputed",
      ],
      user_role: ["stylist", "affiliate", "client", "owner", "admin"],
    },
  },
} as const
