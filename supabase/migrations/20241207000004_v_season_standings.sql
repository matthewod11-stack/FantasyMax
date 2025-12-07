-- ==========================================
-- Season Standings View
-- Agent B: Data Layer
-- Date: December 7, 2025
-- ==========================================
-- Purpose: Provide denormalized season standings with member info
-- Contract: Must match SeasonStandingsRow in src/types/contracts/queries.ts
-- ==========================================

-- Using a regular view (not materialized) because:
-- 1. Season standings are mostly static after season ends
-- 2. During active season, we want real-time data
-- 3. Simpler maintenance than materialized view

CREATE OR REPLACE VIEW v_season_standings AS
SELECT
  s.id AS season_id,
  s.year AS season_year,
  t.id AS team_id,
  m.id AS member_id,
  m.display_name,
  t.team_name,
  COALESCE(t.final_record_wins, 0) AS wins,
  COALESCE(t.final_record_losses, 0) AS losses,
  COALESCE(t.final_record_ties, 0) AS ties,
  COALESCE(t.total_points_for, 0)::DECIMAL(12,2) AS points_for,
  COALESCE(t.total_points_against, 0)::DECIMAL(12,2) AS points_against,
  COALESCE(t.final_rank,
    -- If final_rank not set, compute from record
    RANK() OVER (
      PARTITION BY s.id
      ORDER BY
        COALESCE(t.final_record_wins, 0) DESC,
        COALESCE(t.total_points_for, 0) DESC
    )
  )::INTEGER AS final_rank,
  COALESCE(t.is_champion, FALSE) AS is_champion,
  COALESCE(t.is_last_place, FALSE) AS is_last_place,
  COALESCE(t.made_playoffs, FALSE) AS made_playoffs
FROM teams t
JOIN seasons s ON t.season_id = s.id
JOIN members m ON t.member_id = m.id
ORDER BY s.year DESC, COALESCE(t.final_rank, 999) ASC;

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON VIEW v_season_standings IS
  'Season standings with member info. If final_rank not set, computes from win record.';

COMMENT ON COLUMN v_season_standings.final_rank IS
  'Team ranking in the season. Uses stored final_rank if available, otherwise computed from wins/points.';
