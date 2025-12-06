-- ==========================================
-- FantasyMax Initial Schema
-- ==========================================

-- ==========================================
-- CORE IDENTITY TABLES
-- ==========================================

-- League configuration (single record)
CREATE TABLE league (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  founded_year INTEGER NOT NULL,
  logo_url TEXT,
  yahoo_league_key TEXT,
  yahoo_game_key TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- League members (actual people, not fantasy teams)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  display_name TEXT NOT NULL,
  email TEXT UNIQUE,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('commissioner', 'president', 'treasurer', 'member')),
  yahoo_manager_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  joined_year INTEGER NOT NULL,
  invite_token TEXT UNIQUE,
  invite_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- SEASON & TEAM TABLES
-- ==========================================

-- Seasons (one per year)
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES league(id) NOT NULL,
  year INTEGER NOT NULL,
  name TEXT,
  num_teams INTEGER NOT NULL,
  num_weeks INTEGER NOT NULL DEFAULT 17,
  playoff_weeks INTEGER DEFAULT 3,
  data_source TEXT CHECK (data_source IN ('yahoo', 'csv', 'manual')),
  yahoo_league_key TEXT,
  import_status TEXT DEFAULT 'pending' CHECK (import_status IN ('pending', 'in_progress', 'complete', 'error')),
  last_sync_at TIMESTAMPTZ,
  champion_team_id UUID,
  last_place_team_id UUID,
  recap_title TEXT,
  recap_content TEXT,
  recap_published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(league_id, year)
);

-- Fantasy teams (manager's team for a specific season)
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES seasons(id) NOT NULL,
  member_id UUID REFERENCES members(id) NOT NULL,
  team_name TEXT NOT NULL,
  logo_url TEXT,
  yahoo_team_key TEXT,
  yahoo_team_id INTEGER,
  final_rank INTEGER,
  final_record_wins INTEGER DEFAULT 0,
  final_record_losses INTEGER DEFAULT 0,
  final_record_ties INTEGER DEFAULT 0,
  total_points_for DECIMAL(10,2) DEFAULT 0,
  total_points_against DECIMAL(10,2) DEFAULT 0,
  playoff_seed INTEGER,
  made_playoffs BOOLEAN DEFAULT FALSE,
  is_champion BOOLEAN DEFAULT FALSE,
  is_last_place BOOLEAN DEFAULT FALSE,
  is_regular_season_champ BOOLEAN DEFAULT FALSE,
  is_highest_scorer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(season_id, member_id)
);

-- Add FKs after teams table exists
ALTER TABLE seasons ADD CONSTRAINT fk_champion_team
  FOREIGN KEY (champion_team_id) REFERENCES teams(id);
ALTER TABLE seasons ADD CONSTRAINT fk_last_place_team
  FOREIGN KEY (last_place_team_id) REFERENCES teams(id);

-- ==========================================
-- MATCHUP & SCORING TABLES
-- ==========================================

CREATE TABLE matchups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES seasons(id) NOT NULL,
  week INTEGER NOT NULL,
  home_team_id UUID REFERENCES teams(id) NOT NULL,
  away_team_id UUID REFERENCES teams(id) NOT NULL,
  home_score DECIMAL(10,2),
  away_score DECIMAL(10,2),
  winner_team_id UUID REFERENCES teams(id),
  is_tie BOOLEAN DEFAULT FALSE,
  is_playoff BOOLEAN DEFAULT FALSE,
  is_championship BOOLEAN DEFAULT FALSE,
  is_consolation BOOLEAN DEFAULT FALSE,
  yahoo_matchup_key TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'final')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(season_id, week, home_team_id, away_team_id)
);

-- ==========================================
-- TRADE HISTORY
-- ==========================================

CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES seasons(id) NOT NULL,
  team_1_id UUID REFERENCES teams(id) NOT NULL,
  team_2_id UUID REFERENCES teams(id) NOT NULL,
  team_1_sends JSONB NOT NULL,
  team_2_sends JSONB NOT NULL,
  trade_date DATE NOT NULL,
  week INTEGER,
  yahoo_trade_key TEXT,
  notes TEXT,
  is_notable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- AWARDS & ACHIEVEMENTS
-- ==========================================

CREATE TABLE award_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  is_positive BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  award_type_id UUID REFERENCES award_types(id) NOT NULL,
  season_id UUID REFERENCES seasons(id) NOT NULL,
  team_id UUID REFERENCES teams(id),
  member_id UUID REFERENCES members(id) NOT NULL,
  value TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(award_type_id, season_id, member_id)
);

-- ==========================================
-- VOTING SYSTEM
-- ==========================================

CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES seasons(id),
  title TEXT NOT NULL,
  description TEXT,
  poll_type TEXT NOT NULL CHECK (poll_type IN ('single_choice', 'multiple_choice', 'ranking')),
  options JSONB NOT NULL,
  opens_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closes_at TIMESTAMPTZ NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES members(id) NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) NOT NULL,
  member_id UUID REFERENCES members(id) NOT NULL,
  selection JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, member_id)
);

-- ==========================================
-- MEDIA & CONTENT
-- ==========================================

CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES seasons(id),
  member_id UUID REFERENCES members(id),
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
  file_size INTEGER,
  title TEXT,
  description TEXT,
  taken_at DATE,
  event_name TEXT,
  uploaded_by UUID REFERENCES members(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE media_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID REFERENCES media(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES members(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(media_id, member_id)
);

-- ==========================================
-- CONSTITUTION & RULES
-- ==========================================

CREATE TABLE rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES league(id) NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  effective_date DATE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rule_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES rules(id) NOT NULL,
  previous_content TEXT NOT NULL,
  new_content TEXT NOT NULL,
  reason TEXT,
  approved_by_poll_id UUID REFERENCES polls(id),
  amended_by UUID REFERENCES members(id) NOT NULL,
  amended_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- IMPORT TRACKING
-- ==========================================

CREATE TABLE import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('yahoo', 'csv')),
  season_id UUID REFERENCES seasons(id),
  status TEXT DEFAULT 'started' CHECK (status IN ('started', 'processing', 'completed', 'failed')),
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  started_by UUID REFERENCES members(id) NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ==========================================
-- HEAD-TO-HEAD RECORDS (Materialized View)
-- ==========================================

CREATE MATERIALIZED VIEW head_to_head_records AS
WITH all_matchups AS (
  SELECT
    m.season_id,
    m.home_team_id AS team_id,
    m.away_team_id AS opponent_team_id,
    CASE
      WHEN m.winner_team_id = m.home_team_id THEN 1
      WHEN m.is_tie THEN 0.5
      ELSE 0
    END AS wins,
    CASE
      WHEN m.winner_team_id = m.away_team_id THEN 1
      WHEN m.is_tie THEN 0.5
      ELSE 0
    END AS losses,
    m.home_score AS points_for,
    m.away_score AS points_against
  FROM matchups m
  WHERE m.status = 'final'

  UNION ALL

  SELECT
    m.season_id,
    m.away_team_id AS team_id,
    m.home_team_id AS opponent_team_id,
    CASE
      WHEN m.winner_team_id = m.away_team_id THEN 1
      WHEN m.is_tie THEN 0.5
      ELSE 0
    END AS wins,
    CASE
      WHEN m.winner_team_id = m.home_team_id THEN 1
      WHEN m.is_tie THEN 0.5
      ELSE 0
    END AS losses,
    m.away_score AS points_for,
    m.home_score AS points_against
  FROM matchups m
  WHERE m.status = 'final'
)
SELECT
  t1.member_id AS member_1_id,
  t2.member_id AS member_2_id,
  SUM(am.wins)::INTEGER AS member_1_wins,
  SUM(am.losses)::INTEGER AS member_1_losses,
  SUM(am.points_for)::DECIMAL(12,2) AS member_1_points,
  SUM(am.points_against)::DECIMAL(12,2) AS member_2_points,
  COUNT(*)::INTEGER AS total_matchups
FROM all_matchups am
JOIN teams t1 ON am.team_id = t1.id
JOIN teams t2 ON am.opponent_team_id = t2.id
GROUP BY t1.member_id, t2.member_id;

-- Create index for faster lookups
CREATE UNIQUE INDEX idx_h2h_members ON head_to_head_records(member_1_id, member_2_id);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE league ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchups ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE award_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_amendments ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is a league member
CREATE OR REPLACE FUNCTION is_league_member()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid()
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is commissioner
CREATE OR REPLACE FUNCTION is_commissioner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid()
    AND role = 'commissioner'
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current member id
CREATE OR REPLACE FUNCTION get_current_member_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM members
    WHERE user_id = auth.uid()
    AND is_active = TRUE
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- RLS POLICIES
-- ==========================================

-- League: Members can view, commissioners can modify
CREATE POLICY "Members can view league" ON league
  FOR SELECT USING (is_league_member());

CREATE POLICY "Commissioners can modify league" ON league
  FOR ALL USING (is_commissioner());

-- Members: Members can view all, commissioners can modify
CREATE POLICY "Members can view members" ON members
  FOR SELECT USING (is_league_member() OR invite_token IS NOT NULL);

CREATE POLICY "Commissioners can manage members" ON members
  FOR ALL USING (is_commissioner());

CREATE POLICY "Members can update own profile" ON members
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Seasons: Members can view, commissioners can modify
CREATE POLICY "Members can view seasons" ON seasons
  FOR SELECT USING (is_league_member());

CREATE POLICY "Commissioners can manage seasons" ON seasons
  FOR ALL USING (is_commissioner());

-- Teams: Members can view, commissioners can modify
CREATE POLICY "Members can view teams" ON teams
  FOR SELECT USING (is_league_member());

CREATE POLICY "Commissioners can manage teams" ON teams
  FOR ALL USING (is_commissioner());

-- Matchups: Members can view, commissioners can modify
CREATE POLICY "Members can view matchups" ON matchups
  FOR SELECT USING (is_league_member());

CREATE POLICY "Commissioners can manage matchups" ON matchups
  FOR ALL USING (is_commissioner());

-- Trades: Members can view, commissioners can modify
CREATE POLICY "Members can view trades" ON trades
  FOR SELECT USING (is_league_member());

CREATE POLICY "Commissioners can manage trades" ON trades
  FOR ALL USING (is_commissioner());

-- Award Types: Members can view, commissioners can modify
CREATE POLICY "Members can view award_types" ON award_types
  FOR SELECT USING (is_league_member());

CREATE POLICY "Commissioners can manage award_types" ON award_types
  FOR ALL USING (is_commissioner());

-- Awards: Members can view, commissioners can modify
CREATE POLICY "Members can view awards" ON awards
  FOR SELECT USING (is_league_member());

CREATE POLICY "Commissioners can manage awards" ON awards
  FOR ALL USING (is_commissioner());

-- Polls: Members can view open polls, commissioners can manage
CREATE POLICY "Members can view polls" ON polls
  FOR SELECT USING (is_league_member());

CREATE POLICY "Commissioners can manage polls" ON polls
  FOR ALL USING (is_commissioner());

-- Votes: Members can view (if not anonymous) and submit their own
CREATE POLICY "Members can view non-anonymous votes" ON votes
  FOR SELECT USING (
    is_league_member() AND
    EXISTS (SELECT 1 FROM polls WHERE id = poll_id AND is_anonymous = FALSE)
  );

CREATE POLICY "Members can submit votes" ON votes
  FOR INSERT WITH CHECK (
    is_league_member() AND
    member_id = get_current_member_id() AND
    EXISTS (SELECT 1 FROM polls WHERE id = poll_id AND status = 'open')
  );

-- Media: Members can view and upload
CREATE POLICY "Members can view media" ON media
  FOR SELECT USING (is_league_member());

CREATE POLICY "Members can upload media" ON media
  FOR INSERT WITH CHECK (
    is_league_member() AND
    uploaded_by = get_current_member_id()
  );

CREATE POLICY "Commissioners can manage media" ON media
  FOR ALL USING (is_commissioner());

-- Media Tags: Members can view and tag
CREATE POLICY "Members can view media_tags" ON media_tags
  FOR SELECT USING (is_league_member());

CREATE POLICY "Members can create media_tags" ON media_tags
  FOR INSERT WITH CHECK (is_league_member());

CREATE POLICY "Commissioners can manage media_tags" ON media_tags
  FOR ALL USING (is_commissioner());

-- Rules: Members can view, commissioners can modify
CREATE POLICY "Members can view rules" ON rules
  FOR SELECT USING (is_league_member());

CREATE POLICY "Commissioners can manage rules" ON rules
  FOR ALL USING (is_commissioner());

-- Rule Amendments: Members can view, commissioners can modify
CREATE POLICY "Members can view rule_amendments" ON rule_amendments
  FOR SELECT USING (is_league_member());

CREATE POLICY "Commissioners can manage rule_amendments" ON rule_amendments
  FOR ALL USING (is_commissioner());

-- Import Logs: Commissioners only
CREATE POLICY "Commissioners can view import_logs" ON import_logs
  FOR SELECT USING (is_commissioner());

CREATE POLICY "Commissioners can manage import_logs" ON import_logs
  FOR ALL USING (is_commissioner());

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_invite_token ON members(invite_token);
CREATE INDEX idx_seasons_year ON seasons(year);
CREATE INDEX idx_teams_season_id ON teams(season_id);
CREATE INDEX idx_teams_member_id ON teams(member_id);
CREATE INDEX idx_matchups_season_week ON matchups(season_id, week);
CREATE INDEX idx_matchups_home_team ON matchups(home_team_id);
CREATE INDEX idx_matchups_away_team ON matchups(away_team_id);
CREATE INDEX idx_trades_season_id ON trades(season_id);
CREATE INDEX idx_awards_season_id ON awards(season_id);
CREATE INDEX idx_awards_member_id ON awards(member_id);
CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_media_season_id ON media(season_id);
CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);

-- ==========================================
-- SEED DEFAULT AWARD TYPES
-- ==========================================

INSERT INTO award_types (name, description, icon, is_positive) VALUES
  ('Champion', 'League champion for the season', '🏆', true),
  ('Runner Up', 'Second place finish', '🥈', true),
  ('Regular Season Champ', 'Best regular season record', '👑', true),
  ('Highest Scorer', 'Most total points scored', '📈', true),
  ('Best Manager', 'Voted best manager of the season', '⭐', true),
  ('Biggest Upset', 'Most surprising playoff win', '😲', true),
  ('Best Trade', 'Trade of the year', '🤝', true),
  ('Best Draft Pick', 'Best value draft pick', '🎯', true),
  ('Sacko', 'Last place finish (Hall of Shame)', '🚽', false),
  ('Worst Trade', 'Worst trade of the season', '🗑️', false),
  ('Biggest Disappointment', 'Underperformed expectations', '📉', false);

-- ==========================================
-- FUNCTION TO REFRESH H2H VIEW
-- ==========================================

CREATE OR REPLACE FUNCTION refresh_head_to_head()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY head_to_head_records;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to refresh after matchup changes
CREATE TRIGGER refresh_h2h_after_matchup_change
AFTER INSERT OR UPDATE OR DELETE ON matchups
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_head_to_head();
