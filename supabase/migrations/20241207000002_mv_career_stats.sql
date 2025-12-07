-- ==========================================
-- Career Stats Materialized View
-- Agent B: Data Layer
-- Date: December 7, 2025
-- ==========================================
-- Purpose: Pre-aggregate career stats per member for fast dashboard/profile queries
-- Contract: Must match CareerStatsRow in src/types/contracts/queries.ts
-- ==========================================

-- ==========================================
-- MATERIALIZED VIEW: mv_career_stats
-- ==========================================

CREATE MATERIALIZED VIEW mv_career_stats AS
WITH team_stats AS (
  -- Aggregate team-level stats per member
  SELECT
    t.member_id,
    COUNT(*)::INTEGER AS seasons_played,
    SUM(COALESCE(t.final_record_wins, 0))::INTEGER AS total_wins,
    SUM(COALESCE(t.final_record_losses, 0))::INTEGER AS total_losses,
    SUM(COALESCE(t.final_record_ties, 0))::INTEGER AS total_ties,
    SUM(COALESCE(t.total_points_for, 0))::DECIMAL(12,2) AS total_points_for,
    SUM(COALESCE(t.total_points_against, 0))::DECIMAL(12,2) AS total_points_against,
    COUNT(*) FILTER (WHERE t.is_champion = TRUE)::INTEGER AS championships,
    COUNT(*) FILTER (WHERE t.made_playoffs = TRUE)::INTEGER AS playoff_appearances,
    COUNT(*) FILTER (WHERE t.is_last_place = TRUE)::INTEGER AS last_place_finishes,
    MIN(s.year) AS first_season_year,
    MAX(s.year) AS last_season_year
  FROM teams t
  JOIN seasons s ON t.season_id = s.id
  GROUP BY t.member_id
),
best_season AS (
  -- Find best season by win percentage (min 10 games)
  SELECT DISTINCT ON (t.member_id)
    t.member_id,
    s.year AS best_season_year
  FROM teams t
  JOIN seasons s ON t.season_id = s.id
  WHERE (COALESCE(t.final_record_wins, 0) + COALESCE(t.final_record_losses, 0) + COALESCE(t.final_record_ties, 0)) >= 10
  ORDER BY t.member_id,
    -- Win percentage: wins / total_games
    COALESCE(t.final_record_wins, 0)::DECIMAL /
    NULLIF(COALESCE(t.final_record_wins, 0) + COALESCE(t.final_record_losses, 0) + COALESCE(t.final_record_ties, 0), 0) DESC NULLS LAST,
    s.year DESC
),
worst_season AS (
  -- Find worst season by win percentage (min 10 games)
  SELECT DISTINCT ON (t.member_id)
    t.member_id,
    s.year AS worst_season_year
  FROM teams t
  JOIN seasons s ON t.season_id = s.id
  WHERE (COALESCE(t.final_record_wins, 0) + COALESCE(t.final_record_losses, 0) + COALESCE(t.final_record_ties, 0)) >= 10
  ORDER BY t.member_id,
    -- Win percentage: wins / total_games (ascending for worst)
    COALESCE(t.final_record_wins, 0)::DECIMAL /
    NULLIF(COALESCE(t.final_record_wins, 0) + COALESCE(t.final_record_losses, 0) + COALESCE(t.final_record_ties, 0), 0) ASC NULLS LAST,
    s.year DESC
)
SELECT
  m.id AS member_id,
  m.display_name,
  COALESCE(ts.total_wins, 0) AS total_wins,
  COALESCE(ts.total_losses, 0) AS total_losses,
  COALESCE(ts.total_ties, 0) AS total_ties,
  -- Win percentage: wins / (wins + losses + ties)
  CASE
    WHEN COALESCE(ts.total_wins, 0) + COALESCE(ts.total_losses, 0) + COALESCE(ts.total_ties, 0) = 0 THEN 0
    ELSE ROUND(
      COALESCE(ts.total_wins, 0)::DECIMAL /
      (COALESCE(ts.total_wins, 0) + COALESCE(ts.total_losses, 0) + COALESCE(ts.total_ties, 0)),
      4
    )
  END AS win_percentage,
  COALESCE(ts.total_points_for, 0) AS total_points_for,
  COALESCE(ts.total_points_against, 0) AS total_points_against,
  COALESCE(ts.seasons_played, 0) AS seasons_played,
  COALESCE(ts.championships, 0) AS championships,
  COALESCE(ts.playoff_appearances, 0) AS playoff_appearances,
  COALESCE(ts.last_place_finishes, 0) AS last_place_finishes,
  bs.best_season_year,
  ws.worst_season_year,
  ts.first_season_year,
  ts.last_season_year
FROM members m
LEFT JOIN team_stats ts ON m.id = ts.member_id
LEFT JOIN best_season bs ON m.id = bs.member_id
LEFT JOIN worst_season ws ON m.id = ws.member_id
WHERE m.is_active = TRUE OR ts.seasons_played > 0;

-- ==========================================
-- INDEXES
-- ==========================================

-- Unique index for fast single-member lookups
CREATE UNIQUE INDEX idx_mv_career_stats_member
  ON mv_career_stats(member_id);

-- Index for sorting by championships (leaderboard)
CREATE INDEX idx_mv_career_stats_championships
  ON mv_career_stats(championships DESC, win_percentage DESC);

-- Index for sorting by win percentage (leaderboard)
CREATE INDEX idx_mv_career_stats_win_pct
  ON mv_career_stats(win_percentage DESC) WHERE seasons_played > 0;

-- Index for sorting by total wins
CREATE INDEX idx_mv_career_stats_wins
  ON mv_career_stats(total_wins DESC);

-- ==========================================
-- REFRESH FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION refresh_career_stats()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_career_stats;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Refresh when teams data changes
CREATE TRIGGER refresh_career_stats_on_team_change
AFTER INSERT OR UPDATE OR DELETE ON teams
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_career_stats();

-- Refresh when members change (display_name, is_active)
CREATE TRIGGER refresh_career_stats_on_member_change
AFTER INSERT OR UPDATE OF display_name, is_active OR DELETE ON members
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_career_stats();

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON MATERIALIZED VIEW mv_career_stats IS
  'Pre-aggregated career statistics per member. Refresh triggered by teams/members changes.';

COMMENT ON COLUMN mv_career_stats.win_percentage IS
  'Calculated as total_wins / (total_wins + total_losses + total_ties). Range: 0-1.';

COMMENT ON COLUMN mv_career_stats.best_season_year IS
  'Year with highest win percentage (minimum 10 games played that season).';

COMMENT ON COLUMN mv_career_stats.worst_season_year IS
  'Year with lowest win percentage (minimum 10 games played that season).';
