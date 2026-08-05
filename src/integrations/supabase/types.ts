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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      diets: {
        Row: {
          content: string
          created_at: string
          day_of_week: number
          id: string
          meal: Database["public"]["Enums"]["meal_type"]
          patient_id: string
          updated_at: string
          week_number: number
        }
        Insert: {
          content?: string
          created_at?: string
          day_of_week: number
          id?: string
          meal: Database["public"]["Enums"]["meal_type"]
          patient_id: string
          updated_at?: string
          week_number?: number
        }
        Update: {
          content?: string
          created_at?: string
          day_of_week?: number
          id?: string
          meal?: Database["public"]["Enums"]["meal_type"]
          patient_id?: string
          updated_at?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "diets_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string
          handled: boolean
          id: string
          message: string | null
          name: string | null
          phone: string | null
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          handled?: boolean
          id?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          handled?: boolean
          id?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          source?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          file_path: string | null
          id: string
          kind: "file" | "url"
          mime_type: string | null
          size_bytes: number | null
          title: string
          url: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          file_path?: string | null
          id?: string
          kind: "file" | "url"
          mime_type?: string | null
          size_bytes?: number | null
          title: string
          url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          file_path?: string | null
          id?: string
          kind?: "file" | "url"
          mime_type?: string | null
          size_bytes?: number | null
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      patient_documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          created_at: string
          description: string | null
          file_path: string
          id: string
          mime_type: string | null
          patient_id: string
          size_bytes: number | null
          title: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          description?: string | null
          file_path: string
          id?: string
          mime_type?: string | null
          patient_id: string
          size_bytes?: number | null
          title: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          description?: string | null
          file_path?: string
          id?: string
          mime_type?: string | null
          patient_id?: string
          size_bytes?: number | null
          title?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          birth_date: string | null
          created_at: string
          dni: string | null
          email: string
          first_name: string
          height: number | null
          id: string
          is_active: boolean
          last_name: string
          last_sign_in_at: string | null
          must_change_password: boolean
          observations: string | null
          phone: string | null
          sex: string | null
          target_carb: number | null
          target_fat: number | null
          target_kcal: number | null
          target_prot: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          dni?: string | null
          email?: string
          first_name?: string
          height?: number | null
          id: string
          is_active?: boolean
          last_name?: string
          last_sign_in_at?: string | null
          must_change_password?: boolean
          observations?: string | null
          phone?: string | null
          sex?: string | null
          target_carb?: number | null
          target_fat?: number | null
          target_kcal?: number | null
          target_prot?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          dni?: string | null
          email?: string
          first_name?: string
          height?: number | null
          id?: string
          is_active?: boolean
          last_name?: string
          last_sign_in_at?: string | null
          must_change_password?: boolean
          observations?: string | null
          phone?: string | null
          sex?: string | null
          target_carb?: number | null
          target_fat?: number | null
          target_kcal?: number | null
          target_prot?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          image_path: string | null
          ingredients: Json
          meal: Database["public"]["Enums"]["meal_type"]
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_path?: string | null
          ingredients?: Json
          meal: Database["public"]["Enums"]["meal_type"]
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_path?: string | null
          ingredients?: Json
          meal?: Database["public"]["Enums"]["meal_type"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "patient"
      document_category: "diet" | "recipe" | "guide" | "analysis" | "other"
      meal_type:
        | "desayuno"
        | "media_manana"
        | "almuerzo"
        | "merienda"
        | "cena"
        | "antes_dormir"
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
      app_role: ["admin", "patient"],
      document_category: ["diet", "recipe", "guide", "analysis", "other"],
      meal_type: [
        "desayuno",
        "media_manana",
        "almuerzo",
        "merienda",
        "cena",
        "antes_dormir",
      ],
    },
  },
} as const
