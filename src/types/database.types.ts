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
            foreignKeyName: "awards_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "mv_career_stats"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "awards_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "awards_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "awards_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["season_id"]
          },
          {
            foreignKeyName: "awards_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "awards_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["team_id"]
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
            foreignKeyName: "import_logs_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["season_id"]
          },
          {
            foreignKeyName: "import_logs_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_logs_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "mv_career_stats"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "import_logs_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["member_id"]
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
            foreignKeyName: "matchups_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "matchups_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matchups_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "matchups_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matchups_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["season_id"]
          },
          {
            foreignKeyName: "matchups_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matchups_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["team_id"]
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
            foreignKeyName: "media_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "mv_career_stats"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "media_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "media_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["season_id"]
          },
          {
            foreignKeyName: "media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "mv_career_stats"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["member_id"]
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
          {
            foreignKeyName: "media_tags_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "mv_career_stats"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "media_tags_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["member_id"]
          },
        ]
      }
      member_merges: {
        Row: {
          id: string
          merged_at: string | null
          merged_by: string | null
          merged_member_id: string
          merged_member_stats: Json | null
          notes: string | null
          primary_member_id: string
        }
        Insert: {
          id?: string
          merged_at?: string | null
          merged_by?: string | null
          merged_member_id: string
          merged_member_stats?: Json | null
          notes?: string | null
          primary_member_id: string
        }
        Update: {
          id?: string
          merged_at?: string | null
          merged_by?: string | null
          merged_member_id?: string
          merged_member_stats?: Json | null
          notes?: string | null
          primary_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_merges_merged_by_fkey"
            columns: ["merged_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_merges_merged_by_fkey"
            columns: ["merged_by"]
            isOneToOne: false
            referencedRelation: "mv_career_stats"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "member_merges_merged_by_fkey"
            columns: ["merged_by"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "member_merges_merged_member_id_fkey"
            columns: ["merged_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_merges_merged_member_id_fkey"
            columns: ["merged_member_id"]
            isOneToOne: false
            referencedRelation: "mv_career_stats"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "member_merges_merged_member_id_fkey"
            columns: ["merged_member_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "member_merges_primary_member_id_fkey"
            columns: ["primary_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_merges_primary_member_id_fkey"
            columns: ["primary_member_id"]
            isOneToOne: false
            referencedRelation: "mv_career_stats"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "member_merges_primary_member_id_fkey"
            columns: ["primary_member_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["member_id"]
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
          merged_into_id: string | null
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
          merged_into_id?: string | null
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
          merged_into_id?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string | null
          yahoo_manager_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_merged_into_id_fkey"
            columns: ["merged_into_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_merged_into_id_fkey"
            columns: ["merged_into_id"]
            isOneToOne: false
            referencedRelation: "mv_career_stats"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "members_merged_into_id_fkey"
            columns: ["merged_into_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["member_id"]
          },
        ]
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
          opens_at: string
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
            foreignKeyName: "polls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "mv_career_stats"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "polls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "polls_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polls_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["season_id"]
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
            foreignKeyName: "rule_amendments_amended_by_fkey"
            columns: ["amended_by"]
            isOneToOne: false
            referencedRelation: "mv_career_stats"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "rule_amendments_amended_by_fkey"
            columns: ["amended_by"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["member_id"]
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
          ai_review: string | null
          ai_review_generated_at: string | null
          ai_review_model: string | null
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
          ai_review?: string | null
          ai_review_generated_at?: string | null
          ai_review_model?: string | null
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
          ai_review?: string | null
          ai_review_generated_at?: string | null
          ai_review_model?: string | null
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
            foreignKeyName: "fk_champion_team"
            columns: ["champion_team_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "fk_last_place_team"
            columns: ["last_place_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_last_place_team"
            columns: ["last_place_team_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["team_id"]
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
            foreignKeyName: "teams_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "mv_career_stats"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "teams_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "teams_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["season_id"]
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
            foreignKeyName: "trades_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["season_id"]
          },
          {
            foreignKeyName: "trades_team_1_id_fkey"
            columns: ["team_1_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_team_1_id_fkey"
            columns: ["team_1_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "trades_team_2_id_fkey"
            columns: ["team_2_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_team_2_id_fkey"
            columns: ["team_2_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["team_id"]
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
            foreignKeyName: "votes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "mv_career_stats"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "votes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["member_id"]
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
      writeup_mentions: {
        Row: {
          created_at: string | null
          id: string
          member_id: string
          mention_context: string | null
          writeup_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          member_id: string
          mention_context?: string | null
          writeup_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          member_id?: string
          mention_context?: string | null
          writeup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "writeup_mentions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "writeup_mentions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "mv_career_stats"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "writeup_mentions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "writeup_mentions_writeup_id_fkey"
            columns: ["writeup_id"]
            isOneToOne: false
            referencedRelation: "writeups"
            referencedColumns: ["id"]
          },
        ]
      }
      writeups: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          excerpt: string | null
          id: string
          imported_from: string | null
          is_featured: boolean | null
          original_order: number | null
          published_at: string | null
          season_id: string | null
          status: string | null
          title: string
          updated_at: string | null
          week: number | null
          writeup_type: Database["public"]["Enums"]["writeup_type"]
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          excerpt?: string | null
          id?: string
          imported_from?: string | null
          is_featured?: boolean | null
          original_order?: number | null
          published_at?: string | null
          season_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          week?: number | null
          writeup_type?: Database["public"]["Enums"]["writeup_type"]
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          excerpt?: string | null
          id?: string
          imported_from?: string | null
          is_featured?: boolean | null
          original_order?: number | null
          published_at?: string | null
          season_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          week?: number | null
          writeup_type?: Database["public"]["Enums"]["writeup_type"]
        }
        Relationships: [
          {
            foreignKeyName: "writeups_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "writeups_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "mv_career_stats"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "writeups_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "writeups_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "writeups_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["season_id"]
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
            columns: ["member_1_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "mv_career_stats"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "teams_member_id_fkey"
            columns: ["member_2_id"]
            isOneToOne: false
            referencedRelation: "mv_career_stats"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "teams_member_id_fkey"
            columns: ["member_1_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "teams_member_id_fkey"
            columns: ["member_2_id"]
            isOneToOne: false
            referencedRelation: "v_season_standings"
            referencedColumns: ["member_id"]
          },
        ]
      }
      mv_career_stats: {
        Row: {
          best_season_year: number | null
          championships: number | null
          display_name: string | null
          first_season_year: number | null
          last_place_finishes: number | null
          last_season_year: number | null
          member_id: string | null
          playoff_appearances: number | null
          seasons_played: number | null
          total_losses: number | null
          total_points_against: number | null
          total_points_for: number | null
          total_ties: number | null
          total_wins: number | null
          win_percentage: number | null
          worst_season_year: number | null
        }
        Relationships: []
      }
      mv_h2h_matrix: {
        Row: {
          last_matchup_date: string | null
          member_1_id: string | null
          member_1_points: number | null
          member_1_streak: number | null
          member_1_wins: number | null
          member_2_id: string | null
          member_2_points: number | null
          member_2_wins: number | null
          ties: number | null
          total_matchups: number | null
        }
        Relationships: []
      }
      v_league_records: {
        Row: {
          category: string | null
          description: string | null
          holder_display_name: string | null
          holder_member_id: string | null
          matchup_id: string | null
          record_type: string | null
          season_year: number | null
          value: number | null
          week: number | null
        }
        Relationships: []
      }
      v_season_standings: {
        Row: {
          display_name: string | null
          final_rank: number | null
          is_champion: boolean | null
          is_last_place: boolean | null
          losses: number | null
          made_playoffs: boolean | null
          member_id: string | null
          points_against: number | null
          points_for: number | null
          season_id: string | null
          season_year: number | null
          team_id: string | null
          team_name: string | null
          ties: number | null
          wins: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_current_member_id: { Args: Record<PropertyKey, never>; Returns: string }
      is_commissioner: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_league_member: { Args: Record<PropertyKey, never>; Returns: boolean }
      merge_members: {
        Args: {
          p_merged_by?: string
          p_merged_id: string
          p_notes?: string
          p_primary_id: string
        }
        Returns: Json
      }
      search_writeups: {
        Args: { search_query: string }
        Returns: {
          excerpt: string
          id: string
          published_at: string
          rank: number
          season_year: number
          title: string
          writeup_type: Database["public"]["Enums"]["writeup_type"]
        }[]
      }
    }
    Enums: {
      writeup_type:
        | "weekly_recap"
        | "playoff_preview"
        | "season_recap"
        | "draft_notes"
        | "standings_update"
        | "power_rankings"
        | "announcement"
        | "other"
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
      writeup_type: [
        "weekly_recap",
        "playoff_preview",
        "season_recap",
        "draft_notes",
        "standings_update",
        "power_rankings",
        "announcement",
        "other",
      ],
    },
  },
} as const

// Convenience type aliases for common tables
export type Member = Tables<'members'>
export type Season = Tables<'seasons'>
export type Team = Tables<'teams'>
export type Matchup = Tables<'matchups'>
