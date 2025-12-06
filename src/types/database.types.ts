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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      award_types: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_positive: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_positive?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_positive?: boolean | null
          name?: string
        }
        Relationships: []
      }
      awards: {
        Row: {
          award_type_id: string
          created_at: string | null
          id: string
          member_id: string
          notes: string | null
          season_id: string
          team_id: string | null
          value: string | null
        }
        Insert: {
          award_type_id: string
          created_at?: string | null
          id?: string
          member_id: string
          notes?: string | null
          season_id: string
          team_id?: string | null
          value?: string | null
        }
        Update: {
          award_type_id?: string
          created_at?: string | null
          id?: string
          member_id?: string
          notes?: string | null
          season_id?: string
          team_id?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "awards_award_type_id_fkey"
            columns: ["award_type_id"]
            isOneToOne: false
            referencedRelation: "award_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "awards_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "awards_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "awards_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          completed_at: string | null
          errors: Json | null
          id: string
          records_created: number | null
          records_processed: number | null
          records_updated: number | null
          season_id: string | null
          source: string
          started_at: string | null
          started_by: string
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          errors?: Json | null
          id?: string
          records_created?: number | null
          records_processed?: number | null
          records_updated?: number | null
          season_id?: string | null
          source: string
          started_at?: string | null
          started_by: string
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          errors?: Json | null
          id?: string
          records_created?: number | null
          records_processed?: number | null
          records_updated?: number | null
          season_id?: string | null
          source?: string
          started_at?: string | null
          started_by?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_logs_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_logs_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      league: {
        Row: {
          created_at: string | null
          description: string | null
          founded_year: number
          id: string
          logo_url: string | null
          name: string
          settings: Json | null
          updated_at: string | null
          yahoo_game_key: string | null
          yahoo_league_key: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          founded_year: number
          id?: string
          logo_url?: string | null
          name: string
          settings?: Json | null
          updated_at?: string | null
          yahoo_game_key?: string | null
          yahoo_league_key?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          founded_year?: number
          id?: string
          logo_url?: string | null
          name?: string
          settings?: Json | null
          updated_at?: string | null
          yahoo_game_key?: string | null
          yahoo_league_key?: string | null
        }
        Relationships: []
      }
      matchups: {
        Row: {
          away_score: number | null
          away_team_id: string
          created_at: string | null
          home_score: number | null
          home_team_id: string
          id: string
          is_championship: boolean | null
          is_consolation: boolean | null
          is_playoff: boolean | null
          is_tie: boolean | null
          season_id: string
          status: string | null
          updated_at: string | null
          week: number
          winner_team_id: string | null
          yahoo_matchup_key: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_id: string
          created_at?: string | null
          home_score?: number | null
          home_team_id: string
          id?: string
          is_championship?: boolean | null
          is_consolation?: boolean | null
          is_playoff?: boolean | null
          is_tie?: boolean | null
          season_id: string
          status?: string | null
          updated_at?: string | null
          week: number
          winner_team_id?: string | null
          yahoo_matchup_key?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: string
          created_at?: string | null
          home_score?: number | null
          home_team_id?: string
          id?: string
          is_championship?: boolean | null
          is_consolation?: boolean | null
          is_playoff?: boolean | null
          is_tie?: boolean | null
          season_id?: string
          status?: string | null
          updated_at?: string | null
          week?: number
          winner_team_id?: string | null
          yahoo_matchup_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matchups_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matchups_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matchups_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matchups_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          created_at: string | null
          description: string | null
          event_name: string | null
          file_size: number | null
          file_type: string
          filename: string
          id: string
          member_id: string | null
          season_id: string | null
          storage_path: string
          taken_at: string | null
          title: string | null
          updated_at: string | null
          uploaded_by: string
          url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_name?: string | null
          file_size?: number | null
          file_type: string
          filename: string
          id?: string
          member_id?: string | null
          season_id?: string | null
          storage_path: string
          taken_at?: string | null
          title?: string | null
          updated_at?: string | null
          uploaded_by: string
          url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_name?: string | null
          file_size?: number | null
          file_type?: string
          filename?: string
          id?: string
          member_id?: string | null
          season_id?: string | null
          storage_path?: string
          taken_at?: string | null
          title?: string | null
          updated_at?: string | null
          uploaded_by?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      media_tags: {
        Row: {
          created_at: string | null
          id: string
          media_id: string
          member_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          media_id: string
          member_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          media_id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_tags_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_tags_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string
          email: string | null
          id: string
          invite_sent_at: string | null
          invite_token: string | null
          is_active: boolean | null
          joined_year: number
          role: string
          updated_at: string | null
          user_id: string | null
          yahoo_manager_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name: string
          email?: string | null
          id?: string
          invite_sent_at?: string | null
          invite_token?: string | null
          is_active?: boolean | null
          joined_year: number
          role?: string
          updated_at?: string | null
          user_id?: string | null
          yahoo_manager_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string
          email?: string | null
          id?: string
          invite_sent_at?: string | null
          invite_token?: string | null
          is_active?: boolean | null
          joined_year?: number
          role?: string
          updated_at?: string | null
          user_id?: string | null
          yahoo_manager_id?: string | null
        }
        Relationships: []
      }
      polls: {
        Row: {
          closes_at: string
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_anonymous: boolean | null
          opens_at: string
          options: Json
          poll_type: string
          season_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          closes_at: string
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_anonymous?: boolean | null
          opens_at?: string
          options: Json
          poll_type: string
          season_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          closes_at?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_anonymous?: boolean | null
          opens_at?: string
          options?: Json
          poll_type?: string
          season_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "polls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polls_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      rule_amendments: {
        Row: {
          amended_at: string | null
          amended_by: string
          approved_by_poll_id: string | null
          id: string
          new_content: string
          previous_content: string
          reason: string | null
          rule_id: string
        }
        Insert: {
          amended_at?: string | null
          amended_by: string
          approved_by_poll_id?: string | null
          id?: string
          new_content: string
          previous_content: string
          reason?: string | null
          rule_id: string
        }
        Update: {
          amended_at?: string | null
          amended_by?: string
          approved_by_poll_id?: string | null
          id?: string
          new_content?: string
          previous_content?: string
          reason?: string | null
          rule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rule_amendments_amended_by_fkey"
            columns: ["amended_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rule_amendments_approved_by_poll_id_fkey"
            columns: ["approved_by_poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rule_amendments_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "rules"
            referencedColumns: ["id"]
          },
        ]
      }
      rules: {
        Row: {
          category: string
          content: string
          created_at: string | null
          effective_date: string | null
          id: string
          league_id: string
          sort_order: number | null
          title: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          effective_date?: string | null
          id?: string
          league_id: string
          sort_order?: number | null
          title: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          effective_date?: string | null
          id?: string
          league_id?: string
          sort_order?: number | null
          title?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rules_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "league"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          champion_team_id: string | null
          created_at: string | null
          data_source: string | null
          id: string
          import_status: string | null
          last_place_team_id: string | null
          last_sync_at: string | null
          league_id: string
          name: string | null
          num_teams: number
          num_weeks: number
          playoff_weeks: number | null
          recap_content: string | null
          recap_published_at: string | null
          recap_title: string | null
          updated_at: string | null
          yahoo_league_key: string | null
          year: number
        }
        Insert: {
          champion_team_id?: string | null
          created_at?: string | null
          data_source?: string | null
          id?: string
          import_status?: string | null
          last_place_team_id?: string | null
          last_sync_at?: string | null
          league_id: string
          name?: string | null
          num_teams: number
          num_weeks?: number
          playoff_weeks?: number | null
          recap_content?: string | null
          recap_published_at?: string | null
          recap_title?: string | null
          updated_at?: string | null
          yahoo_league_key?: string | null
          year: number
        }
        Update: {
          champion_team_id?: string | null
          created_at?: string | null
          data_source?: string | null
          id?: string
          import_status?: string | null
          last_place_team_id?: string | null
          last_sync_at?: string | null
          league_id?: string
          name?: string | null
          num_teams?: number
          num_weeks?: number
          playoff_weeks?: number | null
          recap_content?: string | null
          recap_published_at?: string | null
          recap_title?: string | null
          updated_at?: string | null
          yahoo_league_key?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_champion_team"
            columns: ["champion_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_last_place_team"
            columns: ["last_place_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seasons_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "league"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          final_rank: number | null
          final_record_losses: number | null
          final_record_ties: number | null
          final_record_wins: number | null
          id: string
          is_champion: boolean | null
          is_highest_scorer: boolean | null
          is_last_place: boolean | null
          is_regular_season_champ: boolean | null
          logo_url: string | null
          made_playoffs: boolean | null
          member_id: string
          playoff_seed: number | null
          season_id: string
          team_name: string
          total_points_against: number | null
          total_points_for: number | null
          updated_at: string | null
          yahoo_team_id: number | null
          yahoo_team_key: string | null
        }
        Insert: {
          created_at?: string | null
          final_rank?: number | null
          final_record_losses?: number | null
          final_record_ties?: number | null
          final_record_wins?: number | null
          id?: string
          is_champion?: boolean | null
          is_highest_scorer?: boolean | null
          is_last_place?: boolean | null
          is_regular_season_champ?: boolean | null
          logo_url?: string | null
          made_playoffs?: boolean | null
          member_id: string
          playoff_seed?: number | null
          season_id: string
          team_name: string
          total_points_against?: number | null
          total_points_for?: number | null
          updated_at?: string | null
          yahoo_team_id?: number | null
          yahoo_team_key?: string | null
        }
        Update: {
          created_at?: string | null
          final_rank?: number | null
          final_record_losses?: number | null
          final_record_ties?: number | null
          final_record_wins?: number | null
          id?: string
          is_champion?: boolean | null
          is_highest_scorer?: boolean | null
          is_last_place?: boolean | null
          is_regular_season_champ?: boolean | null
          logo_url?: string | null
          made_playoffs?: boolean | null
          member_id?: string
          playoff_seed?: number | null
          season_id?: string
          team_name?: string
          total_points_against?: number | null
          total_points_for?: number | null
          updated_at?: string | null
          yahoo_team_id?: number | null
          yahoo_team_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          created_at: string | null
          id: string
          is_notable: boolean | null
          notes: string | null
          season_id: string
          team_1_id: string
          team_1_sends: Json
          team_2_id: string
          team_2_sends: Json
          trade_date: string
          updated_at: string | null
          week: number | null
          yahoo_trade_key: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_notable?: boolean | null
          notes?: string | null
          season_id: string
          team_1_id: string
          team_1_sends: Json
          team_2_id: string
          team_2_sends: Json
          trade_date: string
          updated_at?: string | null
          week?: number | null
          yahoo_trade_key?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_notable?: boolean | null
          notes?: string | null
          season_id?: string
          team_1_id?: string
          team_1_sends?: Json
          team_2_id?: string
          team_2_sends?: Json
          trade_date?: string
          updated_at?: string | null
          week?: number | null
          yahoo_trade_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trades_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_team_1_id_fkey"
            columns: ["team_1_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_team_2_id_fkey"
            columns: ["team_2_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          created_at: string | null
          id: string
          member_id: string
          poll_id: string
          selection: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          member_id: string
          poll_id: string
          selection: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          member_id?: string
          poll_id?: string
          selection?: Json
        }
        Relationships: [
          {
            foreignKeyName: "votes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      head_to_head_records: {
        Row: {
          member_1_id: string | null
          member_1_losses: number | null
          member_1_points: number | null
          member_1_wins: number | null
          member_2_id: string | null
          member_2_points: number | null
          total_matchups: number | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_member_id_fkey"
            columns: ["member_2_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_member_id_fkey"
            columns: ["member_1_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_current_member_id: { Args: never; Returns: string }
      is_commissioner: { Args: never; Returns: boolean }
      is_league_member: { Args: never; Returns: boolean }
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
  public: {
    Enums: {},
  },
} as const

// =====================================
// Convenience Type Aliases
// =====================================

// Row types (what you get when reading from DB)
export type League = Tables<'league'>
export type Member = Tables<'members'>
export type Season = Tables<'seasons'>
export type Team = Tables<'teams'>
export type Matchup = Tables<'matchups'>
export type Trade = Tables<'trades'>
export type AwardType = Tables<'award_types'>
export type Award = Tables<'awards'>
export type Poll = Tables<'polls'>
export type Vote = Tables<'votes'>
export type Media = Tables<'media'>
export type MediaTag = Tables<'media_tags'>
export type Rule = Tables<'rules'>
export type RuleAmendment = Tables<'rule_amendments'>
export type ImportLog = Tables<'import_logs'>

// Insert types (what you provide when creating)
export type LeagueInsert = TablesInsert<'league'>
export type MemberInsert = TablesInsert<'members'>
export type SeasonInsert = TablesInsert<'seasons'>
export type TeamInsert = TablesInsert<'teams'>
export type MatchupInsert = TablesInsert<'matchups'>
export type TradeInsert = TablesInsert<'trades'>
export type AwardInsert = TablesInsert<'awards'>
export type PollInsert = TablesInsert<'polls'>
export type VoteInsert = TablesInsert<'votes'>
export type MediaInsert = TablesInsert<'media'>
export type RuleInsert = TablesInsert<'rules'>

// Update types (what you provide when updating)
export type LeagueUpdate = TablesUpdate<'league'>
export type MemberUpdate = TablesUpdate<'members'>
export type SeasonUpdate = TablesUpdate<'seasons'>
export type TeamUpdate = TablesUpdate<'teams'>
export type MatchupUpdate = TablesUpdate<'matchups'>

// Role type
export type MemberRole = 'commissioner' | 'president' | 'treasurer' | 'member'
