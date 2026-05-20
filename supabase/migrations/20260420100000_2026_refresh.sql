-- FantasyMax 2026 Refresh: live sync credentials, weekly digests, draft, economy, governance helpers

-- Yahoo OAuth stored server-side for cron sync
CREATE TABLE IF NOT EXISTS yahoo_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES league(id) ON DELETE CASCADE NOT NULL UNIQUE,
  encrypted_tokens TEXT NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE yahoo_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages yahoo_credentials" ON yahoo_credentials
  FOR ALL USING (true) WITH CHECK (true);

-- Weekly digest for commissioner email ritual
CREATE TABLE IF NOT EXISTS weekly_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE NOT NULL,
  week INTEGER NOT NULL,
  highlights JSONB NOT NULL DEFAULT '{}',
  email_subject TEXT,
  email_body TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(season_id, week)
);

ALTER TABLE weekly_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view weekly_digests" ON weekly_digests
  FOR SELECT USING (true);

CREATE POLICY "Commissioners can manage weekly_digests" ON weekly_digests
  FOR ALL USING (true) WITH CHECK (true);

-- Draft picks
CREATE TABLE IF NOT EXISTS draft_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES members(id) NOT NULL,
  round INTEGER NOT NULL,
  pick INTEGER NOT NULL,
  overall_pick INTEGER NOT NULL,
  player_name TEXT NOT NULL,
  position TEXT,
  yahoo_player_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(season_id, overall_pick)
);

CREATE INDEX IF NOT EXISTS idx_draft_picks_season ON draft_picks(season_id);
CREATE INDEX IF NOT EXISTS idx_draft_picks_member ON draft_picks(member_id);

ALTER TABLE draft_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view draft_picks" ON draft_picks FOR SELECT USING (true);
CREATE POLICY "Commissioners can manage draft_picks" ON draft_picks FOR ALL USING (true) WITH CHECK (true);

-- Virtual league currency (Degenerate Dollars)
CREATE TABLE IF NOT EXISTS member_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE NOT NULL,
  balance INTEGER NOT NULL DEFAULT 50,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, season_id)
);

CREATE TABLE IF NOT EXISTS prop_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE NOT NULL,
  week INTEGER NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_option TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'locked', 'settled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prop_wagers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prop_bet_id UUID REFERENCES prop_bets(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES members(id) NOT NULL,
  option_key TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prop_bet_id, member_id)
);

ALTER TABLE member_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE prop_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE prop_wagers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view member_balances" ON member_balances FOR SELECT USING (true);
CREATE POLICY "Members can view prop_bets" ON prop_bets FOR SELECT USING (true);
CREATE POLICY "Members can view prop_wagers" ON prop_wagers FOR SELECT USING (true);
CREATE POLICY "Commissioners manage economy" ON member_balances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Commissioners manage prop_bets" ON prop_bets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Members can wager" ON prop_wagers FOR INSERT WITH CHECK (true);

-- Championship winnings by season (rules vary by year)
CREATE TABLE IF NOT EXISTS championship_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE NOT NULL UNIQUE,
  champion_amount NUMERIC(10, 2) DEFAULT 0,
  runner_up_amount NUMERIC(10, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE championship_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view championship_payouts" ON championship_payouts FOR SELECT USING (true);
CREATE POLICY "Commissioners manage championship_payouts" ON championship_payouts FOR ALL USING (true) WITH CHECK (true);

-- AI content drafts (commissioner approve workflow)
ALTER TABLE seasons ADD COLUMN IF NOT EXISTS ai_review_draft TEXT;
ALTER TABLE seasons ADD COLUMN IF NOT EXISTS ai_review_published BOOLEAN DEFAULT TRUE;

-- Trades upsert by Yahoo key
CREATE UNIQUE INDEX IF NOT EXISTS idx_trades_yahoo_trade_key
  ON trades(yahoo_trade_key) WHERE yahoo_trade_key IS NOT NULL;

-- Cron import logs without member context
ALTER TABLE import_logs ALTER COLUMN started_by DROP NOT NULL;
ALTER TABLE import_logs DROP CONSTRAINT IF EXISTS import_logs_source_check;
ALTER TABLE import_logs ADD CONSTRAINT import_logs_source_check
  CHECK (source IN ('yahoo', 'csv', 'cron'));
