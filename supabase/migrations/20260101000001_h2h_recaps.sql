-- H2H Recaps Table
-- Stores AI-generated ESPN-style rivalry recaps for head-to-head matchups
-- Each rivalry pair gets one recap (member_1_id < member_2_id for consistency)

CREATE TABLE h2h_recaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Member pair (always stored as member_1_id < member_2_id for consistency with mv_h2h_matrix)
  member_1_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  member_2_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,

  -- AI-generated content
  ai_recap TEXT NOT NULL,
  ai_recap_preview TEXT,  -- 2-3 sentence preview for rivalry cards
  ai_recap_generated_at TIMESTAMPTZ DEFAULT NOW(),
  ai_recap_model TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique pair and consistent ordering
  UNIQUE(member_1_id, member_2_id),
  CHECK (member_1_id < member_2_id)
);

-- Indexes for efficient lookups
CREATE INDEX idx_h2h_recaps_member_1 ON h2h_recaps(member_1_id);
CREATE INDEX idx_h2h_recaps_member_2 ON h2h_recaps(member_2_id);

-- Comments
COMMENT ON TABLE h2h_recaps IS 'AI-generated ESPN-style rivalry recaps for head-to-head matchups';
COMMENT ON COLUMN h2h_recaps.ai_recap IS 'Full AI-generated rivalry recap (400-500 words, ESPN broadcast style)';
COMMENT ON COLUMN h2h_recaps.ai_recap_preview IS 'Short 2-3 sentence preview for rivalry cards';
COMMENT ON COLUMN h2h_recaps.ai_recap_generated_at IS 'Timestamp when AI recap was generated';
COMMENT ON COLUMN h2h_recaps.ai_recap_model IS 'Model ID used for generation (e.g., claude-sonnet-4-20250514)';

-- Trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_h2h_recaps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER h2h_recaps_updated_at
  BEFORE UPDATE ON h2h_recaps
  FOR EACH ROW
  EXECUTE FUNCTION update_h2h_recaps_updated_at();

-- RLS Policies (following writeups pattern - currently using admin client, so disabled)
-- These can be enabled when switching to authenticated client
-- ALTER TABLE h2h_recaps ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Members can view h2h_recaps" ON h2h_recaps
--   FOR SELECT USING (true);  -- All authenticated members can view
-- CREATE POLICY "Commissioners can manage h2h_recaps" ON h2h_recaps
--   FOR ALL USING (is_commissioner());
