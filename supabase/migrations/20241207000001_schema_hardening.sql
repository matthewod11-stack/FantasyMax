-- ==========================================
-- Schema Hardening Migration
-- Agent B: Data Layer
-- Date: December 7, 2025
-- ==========================================
-- Purpose: Add performance indexes and verify constraints
-- as specified in ROADMAP.md Technical Priorities
-- ==========================================

-- ==========================================
-- PERFORMANCE INDEXES
-- ==========================================

-- Composite index for common season + member lookups
-- Supports: "Get all teams for a member across seasons"
-- Note: (season_id, member_id) already has UNIQUE constraint
-- Adding reverse order for member-first queries
CREATE INDEX IF NOT EXISTS idx_teams_member_season
  ON teams(member_id, season_id);

-- Composite index for matchups by team and week
-- Supports: "Get all matchups for a team in a week"
-- Useful for calculating streaks and weekly stats
CREATE INDEX IF NOT EXISTS idx_matchups_teams_week
  ON matchups(home_team_id, week);

CREATE INDEX IF NOT EXISTS idx_matchups_away_teams_week
  ON matchups(away_team_id, week);

-- Index for season queries by league and year
-- Supports: "Get a specific season by year"
-- Note: (league_id, year) already has UNIQUE constraint, so this is covered
-- Adding index on year alone for year-range queries
CREATE INDEX IF NOT EXISTS idx_seasons_year_desc
  ON seasons(year DESC);

-- Index for playoff matchups (commonly filtered)
-- Supports: "Get all playoff matchups"
CREATE INDEX IF NOT EXISTS idx_matchups_playoff
  ON matchups(is_playoff) WHERE is_playoff = TRUE;

-- Index for championship matchups
-- Supports: "Get all championship games"
CREATE INDEX IF NOT EXISTS idx_matchups_championship
  ON matchups(is_championship) WHERE is_championship = TRUE;

-- Index for completed matchups (status = 'final')
-- Supports: All views that need completed game data
CREATE INDEX IF NOT EXISTS idx_matchups_final
  ON matchups(status) WHERE status = 'final';

-- ==========================================
-- COMPOSITE INDEXES FOR VIEWS
-- ==========================================

-- Index supporting career stats calculations
-- Joins teams -> members with season info
CREATE INDEX IF NOT EXISTS idx_teams_member_stats
  ON teams(member_id, is_champion, is_last_place, made_playoffs);

-- Index for team point totals (used in standings/records)
CREATE INDEX IF NOT EXISTS idx_teams_points
  ON teams(season_id, total_points_for DESC NULLS LAST);

-- Index for matchup scores (used in records)
CREATE INDEX IF NOT EXISTS idx_matchups_scores
  ON matchups(season_id, home_score DESC NULLS LAST, away_score DESC NULLS LAST);

-- ==========================================
-- VERIFY/ADD CONSTRAINTS
-- ==========================================

-- Ensure teams.final_rank is positive when set
ALTER TABLE teams
  ADD CONSTRAINT chk_teams_final_rank_positive
  CHECK (final_rank IS NULL OR final_rank > 0);

-- Ensure matchups.week is positive
ALTER TABLE matchups
  ADD CONSTRAINT chk_matchups_week_positive
  CHECK (week > 0);

-- Ensure scores are non-negative when set
ALTER TABLE matchups
  ADD CONSTRAINT chk_matchups_scores_nonneg
  CHECK (
    (home_score IS NULL OR home_score >= 0) AND
    (away_score IS NULL OR away_score >= 0)
  );

-- Ensure team points are non-negative when set
ALTER TABLE teams
  ADD CONSTRAINT chk_teams_points_nonneg
  CHECK (
    (total_points_for IS NULL OR total_points_for >= 0) AND
    (total_points_against IS NULL OR total_points_against >= 0)
  );

-- Ensure home and away teams are different
ALTER TABLE matchups
  ADD CONSTRAINT chk_matchups_different_teams
  CHECK (home_team_id != away_team_id);

-- ==========================================
-- COMMENTS FOR DOCUMENTATION
-- ==========================================

COMMENT ON INDEX idx_teams_member_season IS
  'Supports member career queries - find all teams by member';

COMMENT ON INDEX idx_matchups_teams_week IS
  'Supports weekly matchup lookups and streak calculations';

COMMENT ON INDEX idx_matchups_playoff IS
  'Partial index for efficient playoff matchup queries';

COMMENT ON INDEX idx_matchups_championship IS
  'Partial index for efficient championship game queries';

COMMENT ON INDEX idx_matchups_final IS
  'Partial index for views that only process completed games';

COMMENT ON INDEX idx_teams_member_stats IS
  'Supports career stats aggregation queries';

COMMENT ON INDEX idx_teams_points IS
  'Supports standings and records views ordered by points';

COMMENT ON INDEX idx_matchups_scores IS
  'Supports records views finding highest/lowest scores';
