export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      analysis_requests: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          platform: string
          status: string
          target_age: string
          target_gender: string
          target_tags: string[] | null
          updated_at: string | null
          user_id: string
          video_source: string
          video_url: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          platform: string
          status?: string
          target_age: string
          target_gender: string
          target_tags?: string[] | null
          updated_at?: string | null
          user_id: string
          video_source: string
          video_url: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          platform?: string
          status?: string
          target_age?: string
          target_gender?: string
          target_tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          video_source?: string
          video_url?: string
        }
        Relationships: []
      }
      analysis_results: {
        Row: {
          created_at: string | null
          explanation: string | null
          id: string
          kpi_name: string
          predicted_value: string
          request_id: string
          score: number | null
        }
        Insert: {
          created_at?: string | null
          explanation?: string | null
          id?: string
          kpi_name: string
          predicted_value: string
          request_id: string
          score?: number | null
        }
        Update: {
          created_at?: string | null
          explanation?: string | null
          id?: string
          kpi_name?: string
          predicted_value?: string
          request_id?: string
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_results_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "analysis_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  TableName extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][TableName]["Row"]

export type TablesInsert<
  TableName extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][TableName]["Insert"]

export type TablesUpdate<
  TableName extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][TableName]["Update"]
