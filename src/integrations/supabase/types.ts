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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_pin_attempts: {
        Row: {
          created_at: string
          id: number
          ip_hash: string
        }
        Insert: {
          created_at?: string
          id?: never
          ip_hash: string
        }
        Update: {
          created_at?: string
          id?: never
          ip_hash?: string
        }
        Relationships: []
      }
      guest_comments: {
        Row: {
          author_name: string
          created_at: string
          id: string
          is_read: boolean
          message: string
        }
        Insert: {
          author_name?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
        }
        Update: {
          author_name?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          id: string
          name: string
          position: number
        }
        Insert: {
          id?: string
          name: string
          position?: number
        }
        Update: {
          id?: string
          name?: string
          position?: number
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          available: boolean
          category_id: string
          description: string
          id: string
          image: string
          name: string
          old_price: number | null
          position: number
          price: number
        }
        Insert: {
          available?: boolean
          category_id: string
          description?: string
          id?: string
          image?: string
          name: string
          old_price?: number | null
          position?: number
          price: number
        }
        Update: {
          available?: boolean
          category_id?: string
          description?: string
          id?: string
          image?: string
          name?: string
          old_price?: number | null
          position?: number
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_reviews: {
        Row: {
          approved: boolean
          author_name: string
          comment: string
          created_at: string
          id: string
          item_id: string
          rating: number
        }
        Insert: {
          approved?: boolean
          author_name?: string
          comment?: string
          created_at?: string
          id?: string
          item_id: string
          rating: number
        }
        Update: {
          approved?: boolean
          author_name?: string
          comment?: string
          created_at?: string
          id?: string
          item_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_reviews_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      wheel_claims: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          prize: string
          redeemed_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          prize: string
          redeemed_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          prize?: string
          redeemed_at?: string | null
        }
        Relationships: []
      }
      wheel_ip_spins: {
        Row: {
          count: number
          hour: string
          ip_hash: string
        }
        Insert: {
          count?: number
          hour: string
          ip_hash: string
        }
        Update: {
          count?: number
          hour?: string
          ip_hash?: string
        }
        Relationships: []
      }
      wheel_settings: {
        Row: {
          id: number
          max_spins: number
          prizes: Json
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          id?: number
          max_spins?: number
          prizes?: Json
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Update: {
          id?: number
          max_spins?: number
          prizes?: Json
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      wheel_spins: {
        Row: {
          count: number
          day: string
          device_id: string
        }
        Insert: {
          count?: number
          day: string
          device_id: string
        }
        Update: {
          count?: number
          day?: string
          device_id?: string
        }
        Relationships: []
      }
      wheel_wins: {
        Row: {
          count: number
          day: string
          prize: string
        }
        Insert: {
          count?: number
          day: string
          prize: string
        }
        Update: {
          count?: number
          day?: string
          prize?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      spin_wheel: { Args: never; Returns: number }
      spin_wheel_guest: {
        Args: { p_code: string; p_device: string; p_ip: string }
        Returns: Json
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
