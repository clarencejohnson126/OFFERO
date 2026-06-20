// AUTO-GENERIERT via Supabase MCP (generate_typescript_types). Nicht von Hand editieren.
// Geteiltes Projekt: enthält auch Alt-App-Tabellen; Offero nutzt die offero_*-Einträge.
// Regenerieren: mcp__supabase__generate_typescript_types.

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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      apple_transactions: {
        Row: {
          created_at: string | null
          credits_granted: number
          id: string
          original_transaction_id: string
          product_id: string
          transaction_date: string
          user_email: string
        }
        Insert: {
          created_at?: string | null
          credits_granted: number
          id?: string
          original_transaction_id: string
          product_id: string
          transaction_date: string
          user_email: string
        }
        Update: {
          created_at?: string | null
          credits_granted?: number
          id?: string
          original_transaction_id?: string
          product_id?: string
          transaction_date?: string
          user_email?: string
        }
        Relationships: []
      }
      bank_connections: {
        Row: {
          bank_name: string | null
          business_id: string
          consent_expires_at: string | null
          created_at: string
          gocardless_account_id: string | null
          gocardless_requisition_id: string | null
          iban: string | null
          id: string
          last_synced_at: string | null
          status: Database["public"]["Enums"]["bank_status"]
          updated_at: string
        }
        Insert: {
          bank_name?: string | null
          business_id: string
          consent_expires_at?: string | null
          created_at?: string
          gocardless_account_id?: string | null
          gocardless_requisition_id?: string | null
          iban?: string | null
          id?: string
          last_synced_at?: string | null
          status?: Database["public"]["Enums"]["bank_status"]
          updated_at?: string
        }
        Update: {
          bank_name?: string | null
          business_id?: string
          consent_expires_at?: string | null
          created_at?: string
          gocardless_account_id?: string | null
          gocardless_requisition_id?: string | null
          iban?: string | null
          id?: string
          last_synced_at?: string | null
          status?: Database["public"]["Enums"]["bank_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_connections_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          business_name: string
          business_type: Database["public"]["Enums"]["business_type"]
          created_at: string
          dauerfristverlaengerung: boolean
          gewerbesteuer_hebesatz: number | null
          id: string
          kleinunternehmer_status: boolean
          kontenrahmen: Database["public"]["Enums"]["kontenrahmen_type"]
          onboarding_completed: boolean
          preferred_language: Database["public"]["Enums"]["language_type"]
          steuernummer: string | null
          tax_office: string | null
          updated_at: string
          user_id: string
          ust_id: string | null
          ustva_frequency: Database["public"]["Enums"]["ustva_frequency"]
        }
        Insert: {
          business_name?: string
          business_type: Database["public"]["Enums"]["business_type"]
          created_at?: string
          dauerfristverlaengerung?: boolean
          gewerbesteuer_hebesatz?: number | null
          id?: string
          kleinunternehmer_status?: boolean
          kontenrahmen?: Database["public"]["Enums"]["kontenrahmen_type"]
          onboarding_completed?: boolean
          preferred_language?: Database["public"]["Enums"]["language_type"]
          steuernummer?: string | null
          tax_office?: string | null
          updated_at?: string
          user_id: string
          ust_id?: string | null
          ustva_frequency?: Database["public"]["Enums"]["ustva_frequency"]
        }
        Update: {
          business_name?: string
          business_type?: Database["public"]["Enums"]["business_type"]
          created_at?: string
          dauerfristverlaengerung?: boolean
          gewerbesteuer_hebesatz?: number | null
          id?: string
          kleinunternehmer_status?: boolean
          kontenrahmen?: Database["public"]["Enums"]["kontenrahmen_type"]
          onboarding_completed?: boolean
          preferred_language?: Database["public"]["Enums"]["language_type"]
          steuernummer?: string | null
          tax_office?: string | null
          updated_at?: string
          user_id?: string
          ust_id?: string | null
          ustva_frequency?: Database["public"]["Enums"]["ustva_frequency"]
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          default_vat_rate: Database["public"]["Enums"]["vat_rate_type"] | null
          id: string
          is_active: boolean
          kontenrahmen: Database["public"]["Enums"]["kontenrahmen_type"]
          konto_number: string
          name_de: string
          name_en: string
          parent_category: string | null
          type: Database["public"]["Enums"]["category_type"]
        }
        Insert: {
          created_at?: string
          default_vat_rate?: Database["public"]["Enums"]["vat_rate_type"] | null
          id?: string
          is_active?: boolean
          kontenrahmen: Database["public"]["Enums"]["kontenrahmen_type"]
          konto_number: string
          name_de: string
          name_en: string
          parent_category?: string | null
          type: Database["public"]["Enums"]["category_type"]
        }
        Update: {
          created_at?: string
          default_vat_rate?: Database["public"]["Enums"]["vat_rate_type"] | null
          id?: string
          is_active?: boolean
          kontenrahmen?: Database["public"]["Enums"]["kontenrahmen_type"]
          konto_number?: string
          name_de?: string
          name_en?: string
          parent_category?: string | null
          type?: Database["public"]["Enums"]["category_type"]
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_category_fkey"
            columns: ["parent_category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categorization_rules: {
        Row: {
          business_id: string
          category_id: string
          confidence: number
          created_at: string
          id: string
          is_business: boolean
          match_pattern: string
          times_applied: number
          updated_at: string
          vat_rate: Database["public"]["Enums"]["vat_rate_type"] | null
        }
        Insert: {
          business_id: string
          category_id: string
          confidence?: number
          created_at?: string
          id?: string
          is_business?: boolean
          match_pattern: string
          times_applied?: number
          updated_at?: string
          vat_rate?: Database["public"]["Enums"]["vat_rate_type"] | null
        }
        Update: {
          business_id?: string
          category_id?: string
          confidence?: number
          created_at?: string
          id?: string
          is_business?: boolean
          match_pattern?: string
          times_applied?: number
          updated_at?: string
          vat_rate?: Database["public"]["Enums"]["vat_rate_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "categorization_rules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categorization_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      deadlines: {
        Row: {
          business_id: string
          created_at: string
          due_date: string
          id: string
          reminder_1d_sent: boolean
          reminder_30d_sent: boolean
          reminder_3d_sent: boolean
          reminder_7d_sent: boolean
          status: Database["public"]["Enums"]["deadline_status"]
          tax_period_id: string | null
          type: Database["public"]["Enums"]["deadline_type"]
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          due_date: string
          id?: string
          reminder_1d_sent?: boolean
          reminder_30d_sent?: boolean
          reminder_3d_sent?: boolean
          reminder_7d_sent?: boolean
          status?: Database["public"]["Enums"]["deadline_status"]
          tax_period_id?: string | null
          type: Database["public"]["Enums"]["deadline_type"]
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          due_date?: string
          id?: string
          reminder_1d_sent?: boolean
          reminder_30d_sent?: boolean
          reminder_3d_sent?: boolean
          reminder_7d_sent?: boolean
          status?: Database["public"]["Enums"]["deadline_status"]
          tax_period_id?: string | null
          type?: Database["public"]["Enums"]["deadline_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deadlines_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadlines_tax_period_id_fkey"
            columns: ["tax_period_id"]
            isOneToOne: false
            referencedRelation: "tax_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      mvp_business_profile: {
        Row: {
          business_form: string | null
          id: string
          kleinunternehmer_19: boolean | null
          kontenrahmen: string | null
          notes: string | null
          session_id: string | null
          updated_at: string | null
          user_id: string | null
          ustva_period: string | null
        }
        Insert: {
          business_form?: string | null
          id?: string
          kleinunternehmer_19?: boolean | null
          kontenrahmen?: string | null
          notes?: string | null
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          ustva_period?: string | null
        }
        Update: {
          business_form?: string | null
          id?: string
          kleinunternehmer_19?: boolean | null
          kontenrahmen?: string | null
          notes?: string | null
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          ustva_period?: string | null
        }
        Relationships: []
      }
      mvp_conversations: {
        Row: {
          id: string
          session_id: string | null
          started_at: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          session_id?: string | null
          started_at?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          session_id?: string | null
          started_at?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      mvp_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
          session_id: string | null
          tool_events: Json | null
          user_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
          session_id?: string | null
          tool_events?: Json | null
          user_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
          session_id?: string | null
          tool_events?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mvp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "mvp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      mvp_subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          id: string
          plan: string | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan?: string | null
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan?: string | null
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mvp_tax_runs: {
        Row: {
          audit_trail: Json | null
          conversation_id: string | null
          created_at: string | null
          datev_csv: string | null
          datev_csv_path: string | null
          elster_xml: string | null
          elster_xml_path: string | null
          id: string
          period: string | null
          result_summary: string | null
          results: Json | null
          session_id: string | null
          tax_case: string | null
          user_id: string | null
        }
        Insert: {
          audit_trail?: Json | null
          conversation_id?: string | null
          created_at?: string | null
          datev_csv?: string | null
          datev_csv_path?: string | null
          elster_xml?: string | null
          elster_xml_path?: string | null
          id?: string
          period?: string | null
          result_summary?: string | null
          results?: Json | null
          session_id?: string | null
          tax_case?: string | null
          user_id?: string | null
        }
        Update: {
          audit_trail?: Json | null
          conversation_id?: string | null
          created_at?: string | null
          datev_csv?: string | null
          datev_csv_path?: string | null
          elster_xml?: string | null
          elster_xml_path?: string | null
          id?: string
          period?: string | null
          result_summary?: string | null
          results?: Json | null
          session_id?: string | null
          tax_case?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mvp_tax_runs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "mvp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      mvp_uploads: {
        Row: {
          created_at: string | null
          failure_reason: string | null
          filename: string
          id: string
          mime_type: string
          normalized_content: Json | null
          normalized_kind: string | null
          raw_storage_path: string
          session_id: string | null
          size_bytes: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          failure_reason?: string | null
          filename: string
          id?: string
          mime_type: string
          normalized_content?: Json | null
          normalized_kind?: string | null
          raw_storage_path: string
          session_id?: string | null
          size_bytes: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          failure_reason?: string | null
          filename?: string
          id?: string
          mime_type?: string
          normalized_content?: Json | null
          normalized_kind?: string | null
          raw_storage_path?: string
          session_id?: string | null
          size_bytes?: number
          user_id?: string | null
        }
        Relationships: []
      }
      mvp_usage: {
        Row: {
          created_at: string | null
          id: string
          messages_count: number | null
          period: string
          runs_count: number | null
          session_id: string | null
          uploads_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          messages_count?: number | null
          period: string
          runs_count?: number | null
          session_id?: string | null
          uploads_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          messages_count?: number | null
          period?: string
          runs_count?: number | null
          session_id?: string | null
          uploads_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      offero_application: {
        Row: {
          company: Json
          created_at: string
          current_version_id: string | null
          custom_domain: string | null
          id: string
          job_text: string | null
          job_url: string | null
          status: string
          tenant_slug: string
          user_id: string
        }
        Insert: {
          company?: Json
          created_at?: string
          current_version_id?: string | null
          custom_domain?: string | null
          id?: string
          job_text?: string | null
          job_url?: string | null
          status?: string
          tenant_slug: string
          user_id: string
        }
        Update: {
          company?: Json
          created_at?: string
          current_version_id?: string | null
          custom_domain?: string | null
          id?: string
          job_text?: string | null
          job_url?: string | null
          status?: string
          tenant_slug?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offero_application_current_version_fk"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "offero_generation_version"
            referencedColumns: ["id"]
          },
        ]
      }
      offero_credit_ledger: {
        Row: {
          created_at: string
          delta: number
          id: string
          reason: string
          ref_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          reason: string
          ref_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          reason?: string
          ref_id?: string
          user_id?: string
        }
        Relationships: []
      }
      offero_credit_wallet: {
        Row: {
          balance: number
          free_rerolls_remaining: number
          plan: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          free_rerolls_remaining?: number
          plan?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          free_rerolls_remaining?: number
          plan?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      offero_edit_log: {
        Row: {
          created_at: string
          id: string
          patch: Json
          user_id: string
          version_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          patch: Json
          user_id: string
          version_id: string
        }
        Update: {
          created_at?: string
          id?: string
          patch?: Json
          user_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offero_edit_log_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "offero_generation_version"
            referencedColumns: ["id"]
          },
        ]
      }
      offero_generation_version: {
        Row: {
          application_id: string
          content: Json
          cost_cents: number
          created_at: string
          id: string
          kind: string
          model_used: string | null
        }
        Insert: {
          application_id: string
          content: Json
          cost_cents?: number
          created_at?: string
          id?: string
          kind: string
          model_used?: string | null
        }
        Update: {
          application_id?: string
          content?: Json
          cost_cents?: number
          created_at?: string
          id?: string
          kind?: string
          model_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offero_generation_version_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "offero_application"
            referencedColumns: ["id"]
          },
        ]
      }
      offero_media_asset: {
        Row: {
          cost_cents: number
          created_at: string
          id: string
          meta: Json
          renderer: string
          status: string
          storage_ref: Json | null
          type: string
          user_id: string
          version_id: string
        }
        Insert: {
          cost_cents?: number
          created_at?: string
          id?: string
          meta?: Json
          renderer: string
          status?: string
          storage_ref?: Json | null
          type: string
          user_id: string
          version_id: string
        }
        Update: {
          cost_cents?: number
          created_at?: string
          id?: string
          meta?: Json
          renderer?: string
          status?: string
          storage_ref?: Json | null
          type?: string
          user_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offero_media_asset_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "offero_generation_version"
            referencedColumns: ["id"]
          },
        ]
      }
      offero_page_view: {
        Row: {
          application_id: string
          coarse_signal: Json
          id: number
          ts: string
        }
        Insert: {
          application_id: string
          coarse_signal?: Json
          id?: never
          ts?: string
        }
        Update: {
          application_id?: string
          coarse_signal?: Json
          id?: never
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "offero_page_view_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "offero_application"
            referencedColumns: ["id"]
          },
        ]
      }
      offero_profile: {
        Row: {
          contact: Json
          created_at: string
          cv_raw: Json | null
          cv_structured: Json | null
          display_name: string | null
          languages: Json
          photo: Json | null
          tool_stack: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          contact?: Json
          created_at?: string
          cv_raw?: Json | null
          cv_structured?: Json | null
          display_name?: string | null
          languages?: Json
          photo?: Json | null
          tool_stack?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          contact?: Json
          created_at?: string
          cv_raw?: Json | null
          cv_structured?: Json | null
          display_name?: string | null
          languages?: Json
          photo?: Json | null
          tool_stack?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      offero_purchase: {
        Row: {
          amount_cents: number
          created_at: string
          external_id: string
          id: string
          product: string
          provider: string
          status: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          external_id: string
          id?: string
          product: string
          provider: string
          status: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          external_id?: string
          id?: string
          product?: string
          provider?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      offero_subscription: {
        Row: {
          created_at: string
          external_id: string
          id: string
          period_end: string | null
          product: string
          provider: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          external_id: string
          id?: string
          period_end?: string | null
          product: string
          provider: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          external_id?: string
          id?: string
          period_end?: string | null
          product?: string
          provider?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_sessions: {
        Row: {
          ai_model_used: string | null
          ai_tokens_used: number | null
          completed_at: string | null
          credits_used: number
          error_message: string | null
          files_count: number
          folders_created: number
          id: string
          session_duration_seconds: number | null
          source_folder_name: string | null
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          ai_model_used?: string | null
          ai_tokens_used?: number | null
          completed_at?: string | null
          credits_used?: number
          error_message?: string | null
          files_count?: number
          folders_created?: number
          id?: string
          session_duration_seconds?: number | null
          source_folder_name?: string | null
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          ai_model_used?: string | null
          ai_tokens_used?: number | null
          completed_at?: string | null
          credits_used?: number
          error_message?: string | null
          files_count?: number
          folders_created?: number
          id?: string
          session_duration_seconds?: number | null
          source_folder_name?: string | null
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          credits_remaining: number | null
          credits_total: number
          credits_used: number
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          credits_remaining?: number | null
          credits_total?: number
          credits_used?: number
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          credits_remaining?: number | null
          credits_total?: number
          credits_used?: number
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      promo_code_redemptions: {
        Row: {
          credits_granted: number
          id: string
          promo_code_id: string
          redeemed_at: string | null
          user_email: string
        }
        Insert: {
          credits_granted: number
          id?: string
          promo_code_id: string
          redeemed_at?: string | null
          user_email: string
        }
        Update: {
          credits_granted?: number
          id?: string
          promo_code_id?: string
          redeemed_at?: string | null
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_redemptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string | null
          credits: number
          current_uses: number | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          credits: number
          current_uses?: number | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          credits?: number
          current_uses?: number | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount_cents: number
          completed_at: string | null
          created_at: string
          credits_purchased: number
          currency: string
          id: string
          product_type: string
          status: string
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          completed_at?: string | null
          created_at?: string
          credits_purchased: number
          currency?: string
          id?: string
          product_type: string
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          completed_at?: string | null
          created_at?: string
          credits_purchased?: number
          currency?: string
          id?: string
          product_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      receipts: {
        Row: {
          business_id: string
          created_at: string
          extracted_amount: number | null
          extracted_date: string | null
          extracted_description: string | null
          extracted_vat_rate:
            | Database["public"]["Enums"]["vat_rate_type"]
            | null
          extracted_vendor: string | null
          extraction_status: Database["public"]["Enums"]["extraction_status"]
          id: string
          matched_transaction_id: string | null
          original_filename: string | null
          storage_path: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          extracted_amount?: number | null
          extracted_date?: string | null
          extracted_description?: string | null
          extracted_vat_rate?:
            | Database["public"]["Enums"]["vat_rate_type"]
            | null
          extracted_vendor?: string | null
          extraction_status?: Database["public"]["Enums"]["extraction_status"]
          id?: string
          matched_transaction_id?: string | null
          original_filename?: string | null
          storage_path: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          extracted_amount?: number | null
          extracted_date?: string | null
          extracted_description?: string | null
          extracted_vat_rate?:
            | Database["public"]["Enums"]["vat_rate_type"]
            | null
          extracted_vendor?: string | null
          extraction_status?: Database["public"]["Enums"]["extraction_status"]
          id?: string
          matched_transaction_id?: string | null
          original_filename?: string | null
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_matched_transaction_id_fkey"
            columns: ["matched_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          business_id: string
          created_at: string
          current_period_end: string | null
          id: string
          plan: Database["public"]["Enums"]["plan_type"]
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan_type"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan_type"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string
          stripe_subscription_id?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_periods: {
        Row: {
          business_id: string
          created_at: string
          datev_exported_at: string | null
          due_date: string | null
          elster_xml_generated_at: string | null
          gewinn: number
          id: string
          month: number | null
          period_type: Database["public"]["Enums"]["tax_period_type"]
          quarter: number | null
          status: Database["public"]["Enums"]["tax_period_status"]
          total_ausgaben: number
          total_einnahmen: number
          total_ust_collected: number
          total_vorsteuer: number
          updated_at: string
          ust_zahllast: number
          year: number
        }
        Insert: {
          business_id: string
          created_at?: string
          datev_exported_at?: string | null
          due_date?: string | null
          elster_xml_generated_at?: string | null
          gewinn?: number
          id?: string
          month?: number | null
          period_type: Database["public"]["Enums"]["tax_period_type"]
          quarter?: number | null
          status?: Database["public"]["Enums"]["tax_period_status"]
          total_ausgaben?: number
          total_einnahmen?: number
          total_ust_collected?: number
          total_vorsteuer?: number
          updated_at?: string
          ust_zahllast?: number
          year: number
        }
        Update: {
          business_id?: string
          created_at?: string
          datev_exported_at?: string | null
          due_date?: string | null
          elster_xml_generated_at?: string | null
          gewinn?: number
          id?: string
          month?: number | null
          period_type?: Database["public"]["Enums"]["tax_period_type"]
          quarter?: number | null
          status?: Database["public"]["Enums"]["tax_period_status"]
          total_ausgaben?: number
          total_einnahmen?: number
          total_ust_collected?: number
          total_vorsteuer?: number
          updated_at?: string
          ust_zahllast?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "tax_periods_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          bank_connection_id: string | null
          business_id: string
          categorization_confidence: number | null
          categorization_status: Database["public"]["Enums"]["categorization_status"]
          category_id: string | null
          counterpart_iban: string | null
          counterpart_name: string | null
          created_at: string
          currency: string
          date: string
          direction: Database["public"]["Enums"]["transaction_direction"]
          gocardless_transaction_id: string | null
          id: string
          is_business: boolean
          net_amount: number | null
          notes: string | null
          receipt_id: string | null
          reference_text: string | null
          updated_at: string
          vat_amount: number | null
          vat_rate: Database["public"]["Enums"]["vat_rate_type"] | null
        }
        Insert: {
          amount: number
          bank_connection_id?: string | null
          business_id: string
          categorization_confidence?: number | null
          categorization_status?: Database["public"]["Enums"]["categorization_status"]
          category_id?: string | null
          counterpart_iban?: string | null
          counterpart_name?: string | null
          created_at?: string
          currency?: string
          date: string
          direction: Database["public"]["Enums"]["transaction_direction"]
          gocardless_transaction_id?: string | null
          id?: string
          is_business?: boolean
          net_amount?: number | null
          notes?: string | null
          receipt_id?: string | null
          reference_text?: string | null
          updated_at?: string
          vat_amount?: number | null
          vat_rate?: Database["public"]["Enums"]["vat_rate_type"] | null
        }
        Update: {
          amount?: number
          bank_connection_id?: string | null
          business_id?: string
          categorization_confidence?: number | null
          categorization_status?: Database["public"]["Enums"]["categorization_status"]
          category_id?: string | null
          counterpart_iban?: string | null
          counterpart_name?: string | null
          created_at?: string
          currency?: string
          date?: string
          direction?: Database["public"]["Enums"]["transaction_direction"]
          gocardless_transaction_id?: string | null
          id?: string
          is_business?: boolean
          net_amount?: number | null
          notes?: string | null
          receipt_id?: string | null
          reference_text?: string | null
          updated_at?: string
          vat_amount?: number | null
          vat_rate?: Database["public"]["Enums"]["vat_rate_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_bank_connection_id_fkey"
            columns: ["bank_connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          auto_preview: boolean | null
          confirm_before_move: boolean | null
          default_language: string | null
          default_naming_style: string | null
          email_low_credits_warning: boolean | null
          email_receipts: boolean | null
          low_credits_threshold: number | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_preview?: boolean | null
          confirm_before_move?: boolean | null
          default_language?: string | null
          default_naming_style?: string | null
          email_low_credits_warning?: boolean | null
          email_receipts?: boolean | null
          low_credits_threshold?: number | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_preview?: boolean | null
          confirm_before_move?: boolean | null
          default_language?: string | null
          default_naming_style?: string | null
          email_low_credits_warning?: boolean | null
          email_receipts?: boolean | null
          low_credits_threshold?: number | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      user_analytics: {
        Row: {
          credits_remaining: number | null
          credits_total: number | null
          credits_used: number | null
          files_this_month: number | null
          last_organization_at: string | null
          sessions_this_month: number | null
          total_files_organized: number | null
          total_folders_created: number | null
          total_purchases: number | null
          total_sessions: number | null
          total_spent_cents: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_credits: {
        Args: { p_credits: number; p_purchase_id: string; p_user_id: string }
        Returns: boolean
      }
      auth_owns_business: { Args: { biz_id: string }; Returns: boolean }
      increment_usage: {
        Args: {
          p_field: string
          p_period: string
          p_session_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      offero_grant_credits: {
        Args: {
          p_delta: number
          p_free_rerolls?: number
          p_plan?: string
          p_reason: string
          p_ref_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      offero_init_user: { Args: { p_user_id: string }; Returns: undefined }
      offero_spend_credits: {
        Args: {
          p_is_reroll: boolean
          p_reason: string
          p_ref_id: string
          p_user_id: string
        }
        Returns: {
          balance: number
          charged: number
          free_rerolls_remaining: number
        }[]
      }
      use_credits: {
        Args: { p_credits: number; p_session_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      bank_status: "active" | "expired" | "error"
      business_type: "freiberufler" | "kleinunternehmer" | "gewerbetreibend"
      categorization_status: "auto" | "manual" | "uncategorized"
      category_type: "einnahme" | "ausgabe" | "neutral"
      deadline_status: "upcoming" | "due_soon" | "overdue" | "completed"
      deadline_type:
        | "ustva"
        | "est_vorauszahlung"
        | "eur"
        | "ust_jahreserklaerung"
        | "gewerbesteuer"
      extraction_status: "pending" | "completed" | "failed"
      kontenrahmen_type: "skr03" | "skr04"
      language_type: "de" | "en"
      plan_type: "starter" | "professional" | "steuerberater_ready"
      subscription_status: "trialing" | "active" | "past_due" | "canceled"
      tax_period_status: "draft" | "reviewed" | "exported" | "filed"
      tax_period_type: "monthly" | "quarterly" | "annual"
      transaction_direction: "inflow" | "outflow"
      ustva_frequency: "monthly" | "quarterly" | "annual"
      vat_rate_type: "0" | "7" | "19"
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
      bank_status: ["active", "expired", "error"],
      business_type: ["freiberufler", "kleinunternehmer", "gewerbetreibend"],
      categorization_status: ["auto", "manual", "uncategorized"],
      category_type: ["einnahme", "ausgabe", "neutral"],
      deadline_status: ["upcoming", "due_soon", "overdue", "completed"],
      deadline_type: [
        "ustva",
        "est_vorauszahlung",
        "eur",
        "ust_jahreserklaerung",
        "gewerbesteuer",
      ],
      extraction_status: ["pending", "completed", "failed"],
      kontenrahmen_type: ["skr03", "skr04"],
      language_type: ["de", "en"],
      plan_type: ["starter", "professional", "steuerberater_ready"],
      subscription_status: ["trialing", "active", "past_due", "canceled"],
      tax_period_status: ["draft", "reviewed", "exported", "filed"],
      tax_period_type: ["monthly", "quarterly", "annual"],
      transaction_direction: ["inflow", "outflow"],
      ustva_frequency: ["monthly", "quarterly", "annual"],
      vat_rate_type: ["0", "7", "19"],
    },
  },
} as const
