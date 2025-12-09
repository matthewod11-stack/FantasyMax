-- ==========================================
-- Commissioner Writeups Table
-- Stores historical and new commissioner recaps,
-- weekly updates, playoff previews, and more.
-- ==========================================

-- Writeup types for categorization
CREATE TYPE writeup_type AS ENUM (
  'weekly_recap',      -- Week X recap
  'playoff_preview',   -- Playoff matchup previews
  'season_recap',      -- End of season summary
  'draft_notes',       -- Draft day notes/recap
  'standings_update',  -- Mid-season standings analysis
  'power_rankings',    -- Weekly power rankings
  'announcement',      -- League announcements
  'other'              -- Catch-all for uncategorized
);

-- Main writeups table
CREATE TABLE writeups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,  -- Short preview for lists (auto-generated if null)

  -- Classification
  season_id UUID REFERENCES seasons(id),  -- Nullable for league-wide announcements
  week INTEGER,  -- For weekly recaps (1-17+)
  writeup_type writeup_type NOT NULL DEFAULT 'other',

  -- Authorship
  author_id UUID REFERENCES members(id) NOT NULL,

  -- Publishing
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT FALSE,  -- Show on homepage

  -- Metadata for imported historical content
  imported_from TEXT,  -- 'alltimewriteups.md' for historical imports
  original_order INTEGER,  -- Preserve original ordering within season

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member mentions in writeups (for tagging/linking)
CREATE TABLE writeup_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  writeup_id UUID REFERENCES writeups(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES members(id) NOT NULL,
  mention_context TEXT,  -- The surrounding text where they're mentioned
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(writeup_id, member_id)
);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE writeups ENABLE ROW LEVEL SECURITY;
ALTER TABLE writeup_mentions ENABLE ROW LEVEL SECURITY;

-- Writeups: Members can view published, commissioners can manage all
CREATE POLICY "Members can view published writeups" ON writeups
  FOR SELECT USING (
    is_league_member() AND status = 'published'
  );

CREATE POLICY "Commissioners can view all writeups" ON writeups
  FOR SELECT USING (is_commissioner());

CREATE POLICY "Commissioners can manage writeups" ON writeups
  FOR ALL USING (is_commissioner());

-- Writeup mentions: Members can view
CREATE POLICY "Members can view writeup_mentions" ON writeup_mentions
  FOR SELECT USING (is_league_member());

CREATE POLICY "Commissioners can manage writeup_mentions" ON writeup_mentions
  FOR ALL USING (is_commissioner());

-- ==========================================
-- INDEXES
-- ==========================================

-- Primary query patterns
CREATE INDEX idx_writeups_season_id ON writeups(season_id);
CREATE INDEX idx_writeups_author_id ON writeups(author_id);
CREATE INDEX idx_writeups_type ON writeups(writeup_type);
CREATE INDEX idx_writeups_status ON writeups(status);
CREATE INDEX idx_writeups_published_at ON writeups(published_at DESC);
CREATE INDEX idx_writeups_featured ON writeups(is_featured) WHERE is_featured = TRUE;

-- For ordering within a season
CREATE INDEX idx_writeups_season_order ON writeups(season_id, original_order);

-- Full-text search index
CREATE INDEX idx_writeups_content_search ON writeups
  USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));

-- Writeup mentions
CREATE INDEX idx_writeup_mentions_writeup_id ON writeup_mentions(writeup_id);
CREATE INDEX idx_writeup_mentions_member_id ON writeup_mentions(member_id);

-- ==========================================
-- HELPER FUNCTION: Auto-generate excerpt
-- ==========================================

CREATE OR REPLACE FUNCTION generate_writeup_excerpt()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if excerpt is null and content exists
  IF NEW.excerpt IS NULL AND NEW.content IS NOT NULL THEN
    -- Take first 200 characters, break at word boundary
    NEW.excerpt := substring(
      regexp_replace(NEW.content, E'[\\n\\r]+', ' ', 'g')  -- Normalize newlines
      FROM 1 FOR 200
    );
    -- Trim to last complete word and add ellipsis if truncated
    IF length(NEW.content) > 200 THEN
      NEW.excerpt := regexp_replace(NEW.excerpt, '\s+\S*$', '') || '...';
    END IF;
  END IF;

  -- Set published_at if transitioning to published
  IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status != 'published') THEN
    NEW.published_at := COALESCE(NEW.published_at, NOW());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER writeup_before_insert_update
  BEFORE INSERT OR UPDATE ON writeups
  FOR EACH ROW
  EXECUTE FUNCTION generate_writeup_excerpt();

-- ==========================================
-- FULL-TEXT SEARCH FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION search_writeups(search_query TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  excerpt TEXT,
  season_year INTEGER,
  writeup_type writeup_type,
  published_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.title,
    w.excerpt,
    s.year AS season_year,
    w.writeup_type,
    w.published_at,
    ts_rank(
      to_tsvector('english', coalesce(w.title, '') || ' ' || coalesce(w.content, '')),
      plainto_tsquery('english', search_query)
    ) AS rank
  FROM writeups w
  LEFT JOIN seasons s ON w.season_id = s.id
  WHERE
    w.status = 'published'
    AND to_tsvector('english', coalesce(w.title, '') || ' ' || coalesce(w.content, ''))
        @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC, w.published_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON TABLE writeups IS 'Commissioner writeups including weekly recaps, playoff previews, season summaries, and historical content from 2015-2024.';
COMMENT ON COLUMN writeups.original_order IS 'Preserves original ordering from alltimewriteups.md for historical imports.';
COMMENT ON COLUMN writeups.excerpt IS 'Auto-generated preview text (first ~200 chars). Used in list views.';
COMMENT ON COLUMN writeups.imported_from IS 'Source file for historical imports, e.g., alltimewriteups.md';
