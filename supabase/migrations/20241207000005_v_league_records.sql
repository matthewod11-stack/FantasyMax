-- ==========================================
-- League Records View
-- Agent B: Data Layer
-- Date: December 7, 2025
-- ==========================================
-- Purpose: Calculate all-time league records
-- Contract: Must match LeagueRecordRow in src/types/contracts/queries.ts
-- ==========================================

-- Using a regular view for real-time accuracy
-- Could be materialized if performance becomes an issue

CREATE OR REPLACE VIEW v_league_records AS

-- ==========================================
-- SINGLE WEEK RECORDS
-- ==========================================

-- Highest single week score
SELECT
  'highest_single_week_score'::TEXT AS record_type,
  'single_week'::TEXT AS category,
  GREATEST(m.home_score, m.away_score)::DECIMAL(12,2) AS value,
  CASE WHEN m.home_score >= m.away_score THEN t_home.member_id ELSE t_away.member_id END AS holder_member_id,
  CASE WHEN m.home_score >= m.away_score THEN mb_home.display_name ELSE mb_away.display_name END AS holder_display_name,
  s.year AS season_year,
  m.week,
  m.id AS matchup_id,
  'Highest single week score: ' ||
    GREATEST(m.home_score, m.away_score)::TEXT || ' pts in Week ' || m.week || ', ' || s.year AS description
FROM matchups m
JOIN teams t_home ON m.home_team_id = t_home.id
JOIN teams t_away ON m.away_team_id = t_away.id
JOIN members mb_home ON t_home.member_id = mb_home.id
JOIN members mb_away ON t_away.member_id = mb_away.id
JOIN seasons s ON m.season_id = s.id
WHERE m.status = 'final'
ORDER BY GREATEST(m.home_score, m.away_score) DESC NULLS LAST
LIMIT 1

UNION ALL

-- Lowest single week score
SELECT
  'lowest_single_week_score'::TEXT AS record_type,
  'single_week'::TEXT AS category,
  LEAST(m.home_score, m.away_score)::DECIMAL(12,2) AS value,
  CASE WHEN m.home_score <= m.away_score THEN t_home.member_id ELSE t_away.member_id END AS holder_member_id,
  CASE WHEN m.home_score <= m.away_score THEN mb_home.display_name ELSE mb_away.display_name END AS holder_display_name,
  s.year AS season_year,
  m.week,
  m.id AS matchup_id,
  'Lowest single week score: ' ||
    LEAST(m.home_score, m.away_score)::TEXT || ' pts in Week ' || m.week || ', ' || s.year AS description
FROM matchups m
JOIN teams t_home ON m.home_team_id = t_home.id
JOIN teams t_away ON m.away_team_id = t_away.id
JOIN members mb_home ON t_home.member_id = mb_home.id
JOIN members mb_away ON t_away.member_id = mb_away.id
JOIN seasons s ON m.season_id = s.id
WHERE m.status = 'final'
  AND m.home_score IS NOT NULL
  AND m.away_score IS NOT NULL
ORDER BY LEAST(m.home_score, m.away_score) ASC NULLS LAST
LIMIT 1

UNION ALL

-- Biggest blowout
SELECT
  'biggest_blowout_margin'::TEXT AS record_type,
  'single_week'::TEXT AS category,
  ABS(m.home_score - m.away_score)::DECIMAL(12,2) AS value,
  CASE WHEN m.home_score > m.away_score THEN t_home.member_id ELSE t_away.member_id END AS holder_member_id,
  CASE WHEN m.home_score > m.away_score THEN mb_home.display_name ELSE mb_away.display_name END AS holder_display_name,
  s.year AS season_year,
  m.week,
  m.id AS matchup_id,
  'Biggest blowout: ' ||
    ABS(m.home_score - m.away_score)::TEXT || ' pts margin in Week ' || m.week || ', ' || s.year AS description
FROM matchups m
JOIN teams t_home ON m.home_team_id = t_home.id
JOIN teams t_away ON m.away_team_id = t_away.id
JOIN members mb_home ON t_home.member_id = mb_home.id
JOIN members mb_away ON t_away.member_id = mb_away.id
JOIN seasons s ON m.season_id = s.id
WHERE m.status = 'final'
  AND m.is_tie = FALSE
ORDER BY ABS(m.home_score - m.away_score) DESC NULLS LAST
LIMIT 1

UNION ALL

-- Closest game
SELECT
  'closest_game_margin'::TEXT AS record_type,
  'single_week'::TEXT AS category,
  ABS(m.home_score - m.away_score)::DECIMAL(12,2) AS value,
  CASE WHEN m.home_score > m.away_score THEN t_home.member_id ELSE t_away.member_id END AS holder_member_id,
  CASE WHEN m.home_score > m.away_score THEN mb_home.display_name ELSE mb_away.display_name END AS holder_display_name,
  s.year AS season_year,
  m.week,
  m.id AS matchup_id,
  'Closest game: ' ||
    ABS(m.home_score - m.away_score)::TEXT || ' pts margin in Week ' || m.week || ', ' || s.year AS description
FROM matchups m
JOIN teams t_home ON m.home_team_id = t_home.id
JOIN teams t_away ON m.away_team_id = t_away.id
JOIN members mb_home ON t_home.member_id = mb_home.id
JOIN members mb_away ON t_away.member_id = mb_away.id
JOIN seasons s ON m.season_id = s.id
WHERE m.status = 'final'
  AND m.is_tie = FALSE
  AND m.home_score IS NOT NULL
  AND m.away_score IS NOT NULL
ORDER BY ABS(m.home_score - m.away_score) ASC NULLS LAST
LIMIT 1

UNION ALL

-- ==========================================
-- SEASON RECORDS
-- ==========================================

-- Most season wins
SELECT
  'most_season_wins'::TEXT AS record_type,
  'season'::TEXT AS category,
  t.final_record_wins::DECIMAL(12,2) AS value,
  m.id AS holder_member_id,
  m.display_name AS holder_display_name,
  s.year AS season_year,
  NULL::INTEGER AS week,
  NULL::UUID AS matchup_id,
  'Most season wins: ' || t.final_record_wins || ' wins in ' || s.year AS description
FROM teams t
JOIN members m ON t.member_id = m.id
JOIN seasons s ON t.season_id = s.id
ORDER BY t.final_record_wins DESC NULLS LAST
LIMIT 1

UNION ALL

-- Most season points
SELECT
  'most_season_points'::TEXT AS record_type,
  'season'::TEXT AS category,
  t.total_points_for::DECIMAL(12,2) AS value,
  m.id AS holder_member_id,
  m.display_name AS holder_display_name,
  s.year AS season_year,
  NULL::INTEGER AS week,
  NULL::UUID AS matchup_id,
  'Most season points: ' || ROUND(t.total_points_for, 1) || ' pts in ' || s.year AS description
FROM teams t
JOIN members m ON t.member_id = m.id
JOIN seasons s ON t.season_id = s.id
ORDER BY t.total_points_for DESC NULLS LAST
LIMIT 1

UNION ALL

-- Best season record (by win %)
SELECT
  'best_season_record'::TEXT AS record_type,
  'season'::TEXT AS category,
  ROUND(
    t.final_record_wins::DECIMAL /
    NULLIF(t.final_record_wins + t.final_record_losses + COALESCE(t.final_record_ties, 0), 0),
    4
  ) AS value,
  m.id AS holder_member_id,
  m.display_name AS holder_display_name,
  s.year AS season_year,
  NULL::INTEGER AS week,
  NULL::UUID AS matchup_id,
  'Best season record: ' || t.final_record_wins || '-' || t.final_record_losses ||
    COALESCE('-' || t.final_record_ties, '') || ' in ' || s.year AS description
FROM teams t
JOIN members m ON t.member_id = m.id
JOIN seasons s ON t.season_id = s.id
WHERE (t.final_record_wins + t.final_record_losses + COALESCE(t.final_record_ties, 0)) >= 10
ORDER BY
  t.final_record_wins::DECIMAL /
  NULLIF(t.final_record_wins + t.final_record_losses + COALESCE(t.final_record_ties, 0), 0) DESC NULLS LAST
LIMIT 1

UNION ALL

-- Worst season record (by win %)
SELECT
  'worst_season_record'::TEXT AS record_type,
  'season'::TEXT AS category,
  ROUND(
    t.final_record_wins::DECIMAL /
    NULLIF(t.final_record_wins + t.final_record_losses + COALESCE(t.final_record_ties, 0), 0),
    4
  ) AS value,
  m.id AS holder_member_id,
  m.display_name AS holder_display_name,
  s.year AS season_year,
  NULL::INTEGER AS week,
  NULL::UUID AS matchup_id,
  'Worst season record: ' || t.final_record_wins || '-' || t.final_record_losses ||
    COALESCE('-' || t.final_record_ties, '') || ' in ' || s.year AS description
FROM teams t
JOIN members m ON t.member_id = m.id
JOIN seasons s ON t.season_id = s.id
WHERE (t.final_record_wins + t.final_record_losses + COALESCE(t.final_record_ties, 0)) >= 10
ORDER BY
  t.final_record_wins::DECIMAL /
  NULLIF(t.final_record_wins + t.final_record_losses + COALESCE(t.final_record_ties, 0), 0) ASC NULLS LAST
LIMIT 1

UNION ALL

-- ==========================================
-- CAREER RECORDS
-- ==========================================

-- Career wins (from mv_career_stats)
SELECT
  'career_wins'::TEXT AS record_type,
  'career'::TEXT AS category,
  cs.total_wins::DECIMAL(12,2) AS value,
  cs.member_id AS holder_member_id,
  cs.display_name AS holder_display_name,
  NULL::INTEGER AS season_year,
  NULL::INTEGER AS week,
  NULL::UUID AS matchup_id,
  'Career wins: ' || cs.total_wins || ' wins (' || cs.seasons_played || ' seasons)' AS description
FROM mv_career_stats cs
WHERE cs.seasons_played > 0
ORDER BY cs.total_wins DESC
LIMIT 1

UNION ALL

-- Career points (from mv_career_stats)
SELECT
  'career_points'::TEXT AS record_type,
  'career'::TEXT AS category,
  cs.total_points_for::DECIMAL(12,2) AS value,
  cs.member_id AS holder_member_id,
  cs.display_name AS holder_display_name,
  NULL::INTEGER AS season_year,
  NULL::INTEGER AS week,
  NULL::UUID AS matchup_id,
  'Career points: ' || ROUND(cs.total_points_for, 1) || ' pts (' || cs.seasons_played || ' seasons)' AS description
FROM mv_career_stats cs
WHERE cs.seasons_played > 0
ORDER BY cs.total_points_for DESC
LIMIT 1

UNION ALL

-- Most championships
SELECT
  'most_championships'::TEXT AS record_type,
  'career'::TEXT AS category,
  cs.championships::DECIMAL(12,2) AS value,
  cs.member_id AS holder_member_id,
  cs.display_name AS holder_display_name,
  NULL::INTEGER AS season_year,
  NULL::INTEGER AS week,
  NULL::UUID AS matchup_id,
  'Most championships: ' || cs.championships || ' titles' AS description
FROM mv_career_stats cs
WHERE cs.championships > 0
ORDER BY cs.championships DESC
LIMIT 1

UNION ALL

-- ==========================================
-- DUBIOUS RECORDS
-- ==========================================

-- Most last place finishes
SELECT
  'most_last_places'::TEXT AS record_type,
  'dubious'::TEXT AS category,
  cs.last_place_finishes::DECIMAL(12,2) AS value,
  cs.member_id AS holder_member_id,
  cs.display_name AS holder_display_name,
  NULL::INTEGER AS season_year,
  NULL::INTEGER AS week,
  NULL::UUID AS matchup_id,
  'Most last place finishes: ' || cs.last_place_finishes || ' times' AS description
FROM mv_career_stats cs
WHERE cs.last_place_finishes > 0
ORDER BY cs.last_place_finishes DESC
LIMIT 1;

-- ==========================================
-- NOTE: longest_win_streak is complex and requires
-- a separate function. Adding placeholder for now.
-- ==========================================

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON VIEW v_league_records IS
  'All-time league records across various categories. Depends on mv_career_stats being refreshed.';
