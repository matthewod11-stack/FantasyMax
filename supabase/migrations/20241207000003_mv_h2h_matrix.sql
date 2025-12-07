-- ==========================================
-- H2H Matrix Materialized View (Enhanced)
-- Agent B: Data Layer
-- Date: December 7, 2025
-- ==========================================
-- Purpose: Replace basic head_to_head_records with enhanced mv_h2h_matrix
-- Contract: Must match H2HMatrixRow in src/types/contracts/queries.ts
-- ==========================================

-- ==========================================
-- DROP OLD TRIGGER FIRST
-- ==========================================

-- Drop the old trigger that uses head_to_head_records
DROP TRIGGER IF EXISTS refresh_h2h_after_matchup_change ON matchups;

-- ==========================================
-- NEW MATERIALIZED VIEW: mv_h2h_matrix
-- ==========================================

CREATE MATERIALIZED VIEW mv_h2h_matrix AS
WITH matchup_pairs AS (
  -- Normalize all matchups to ordered pairs (member_1 < member_2)
  -- This ensures each rivalry only appears once in the final result
  SELECT
    m.id AS matchup_id,
    m.season_id,
    s.year AS season_year,
    m.week,
    m.created_at AS matchup_date,
    LEAST(t_home.member_id, t_away.member_id) AS member_1_id,
    GREATEST(t_home.member_id, t_away.member_id) AS member_2_id,
    -- Determine who won from member_1's perspective
    CASE
      WHEN m.is_tie = TRUE THEN 'tie'
      WHEN m.winner_team_id = t_home.id AND t_home.member_id = LEAST(t_home.member_id, t_away.member_id) THEN 'member_1_win'
      WHEN m.winner_team_id = t_away.id AND t_away.member_id = LEAST(t_home.member_id, t_away.member_id) THEN 'member_1_win'
      ELSE 'member_2_win'
    END AS result,
    -- Points for member_1
    CASE
      WHEN t_home.member_id = LEAST(t_home.member_id, t_away.member_id) THEN m.home_score
      ELSE m.away_score
    END AS member_1_score,
    -- Points for member_2
    CASE
      WHEN t_home.member_id = GREATEST(t_home.member_id, t_away.member_id) THEN m.home_score
      ELSE m.away_score
    END AS member_2_score
  FROM matchups m
  JOIN teams t_home ON m.home_team_id = t_home.id
  JOIN teams t_away ON m.away_team_id = t_away.id
  JOIN seasons s ON m.season_id = s.id
  WHERE m.status = 'final'
),
aggregated AS (
  -- Aggregate stats per rivalry pair
  SELECT
    member_1_id,
    member_2_id,
    COUNT(*) FILTER (WHERE result = 'member_1_win')::INTEGER AS member_1_wins,
    COUNT(*) FILTER (WHERE result = 'member_2_win')::INTEGER AS member_2_wins,
    COUNT(*) FILTER (WHERE result = 'tie')::INTEGER AS ties,
    COALESCE(SUM(member_1_score), 0)::DECIMAL(12,2) AS member_1_points,
    COALESCE(SUM(member_2_score), 0)::DECIMAL(12,2) AS member_2_points,
    COUNT(*)::INTEGER AS total_matchups,
    MAX(matchup_date)::DATE AS last_matchup_date
  FROM matchup_pairs
  GROUP BY member_1_id, member_2_id
),
streak_calc AS (
  -- Calculate current streak for member_1 (positive = winning, negative = losing)
  -- Using a window function to find consecutive results
  SELECT DISTINCT ON (member_1_id, member_2_id)
    mp.member_1_id,
    mp.member_2_id,
    -- Count consecutive same results from most recent
    CASE
      WHEN mp.result = 'tie' THEN 0
      WHEN mp.result = 'member_1_win' THEN (
        SELECT COUNT(*)
        FROM matchup_pairs mp2
        WHERE mp2.member_1_id = mp.member_1_id
          AND mp2.member_2_id = mp.member_2_id
          AND mp2.matchup_date >= (
            -- Find the last non-member_1_win before counting
            SELECT COALESCE(MAX(mp3.matchup_date), '1900-01-01'::timestamp)
            FROM matchup_pairs mp3
            WHERE mp3.member_1_id = mp.member_1_id
              AND mp3.member_2_id = mp.member_2_id
              AND mp3.result != 'member_1_win'
          )
          AND mp2.result = 'member_1_win'
      )::INTEGER
      ELSE -(
        SELECT COUNT(*)
        FROM matchup_pairs mp2
        WHERE mp2.member_1_id = mp.member_1_id
          AND mp2.member_2_id = mp.member_2_id
          AND mp2.matchup_date >= (
            -- Find the last non-member_2_win before counting
            SELECT COALESCE(MAX(mp3.matchup_date), '1900-01-01'::timestamp)
            FROM matchup_pairs mp3
            WHERE mp3.member_1_id = mp.member_1_id
              AND mp3.member_2_id = mp.member_2_id
              AND mp3.result != 'member_2_win'
          )
          AND mp2.result = 'member_2_win'
      )::INTEGER
    END AS member_1_streak
  FROM matchup_pairs mp
  ORDER BY mp.member_1_id, mp.member_2_id, mp.matchup_date DESC
)
SELECT
  a.member_1_id,
  a.member_2_id,
  a.member_1_wins,
  a.member_2_wins,
  a.ties,
  a.member_1_points,
  a.member_2_points,
  a.total_matchups,
  a.last_matchup_date::TEXT,
  COALESCE(sc.member_1_streak, 0) AS member_1_streak
FROM aggregated a
LEFT JOIN streak_calc sc ON a.member_1_id = sc.member_1_id AND a.member_2_id = sc.member_2_id;

-- ==========================================
-- INDEXES
-- ==========================================

-- Unique index for lookups (required for CONCURRENTLY refresh)
CREATE UNIQUE INDEX idx_mv_h2h_member_pair
  ON mv_h2h_matrix(member_1_id, member_2_id);

-- Index for finding a specific member's rivalries
CREATE INDEX idx_mv_h2h_member_1
  ON mv_h2h_matrix(member_1_id);

CREATE INDEX idx_mv_h2h_member_2
  ON mv_h2h_matrix(member_2_id);

-- Index for finding biggest rivalries (most matchups)
CREATE INDEX idx_mv_h2h_total_matchups
  ON mv_h2h_matrix(total_matchups DESC);

-- ==========================================
-- REFRESH FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION refresh_h2h_matrix()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_h2h_matrix;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- TRIGGERS
-- ==========================================

CREATE TRIGGER refresh_h2h_matrix_after_matchup_change
AFTER INSERT OR UPDATE OR DELETE ON matchups
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_h2h_matrix();

-- ==========================================
-- KEEP OLD VIEW FOR BACKWARD COMPATIBILITY
-- ==========================================

-- Don't drop head_to_head_records yet - other code might depend on it
-- Just refresh its trigger to also refresh the new view

CREATE OR REPLACE FUNCTION refresh_head_to_head()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh both views for backward compatibility
  REFRESH MATERIALIZED VIEW CONCURRENTLY head_to_head_records;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Re-create the old trigger (we dropped it at the start)
CREATE TRIGGER refresh_h2h_after_matchup_change
AFTER INSERT OR UPDATE OR DELETE ON matchups
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_head_to_head();

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON MATERIALIZED VIEW mv_h2h_matrix IS
  'Head-to-head records between all member pairs. Each pair appears once with member_1_id < member_2_id.';

COMMENT ON COLUMN mv_h2h_matrix.member_1_streak IS
  'Current streak from member_1 perspective. Positive = member_1 winning streak, negative = losing streak, 0 = tie or no streak.';

COMMENT ON COLUMN mv_h2h_matrix.last_matchup_date IS
  'Date of the most recent matchup between these two members.';
