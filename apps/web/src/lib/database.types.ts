// AUTO-GENERIERT via Supabase Management-API (included_schemas=offero). Nicht editieren.
// Nur das dedizierte offero-Schema (getrennt von Alt-Apps). Regenerieren: GET /v1/projects/{ref}/types/typescript?included_schemas=offero

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
  offero: {
    Tables: {
      application: {
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
            foreignKeyName: "application_current_version_fk"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "generation_version"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_ledger: {
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
      credit_wallet: {
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
      edit_log: {
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
            foreignKeyName: "edit_log_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "generation_version"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_version: {
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
            foreignKeyName: "generation_version_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "application"
            referencedColumns: ["id"]
          },
        ]
      }
      media_asset: {
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
            foreignKeyName: "media_asset_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "generation_version"
            referencedColumns: ["id"]
          },
        ]
      }
      page_view: {
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
            foreignKeyName: "page_view_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "application"
            referencedColumns: ["id"]
          },
        ]
      }
      profile: {
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
      purchase: {
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
      subscription: {
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      grant_credits: {
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
      init_user: { Args: { p_user_id: string }; Returns: undefined }
      spend_credits: {
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
    }
    Enums: {
      [_ in never]: never
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
  offero: {
    Enums: {},
  },
} as const
