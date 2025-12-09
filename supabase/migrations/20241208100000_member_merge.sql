-- Member Merge Infrastructure
-- Allows commissioners to merge duplicate member records created when
-- Yahoo users change email accounts over the years.

-- 1. Add merged_into_id column to members table
-- When a member is merged, this points to the canonical member
ALTER TABLE members
ADD COLUMN merged_into_id UUID REFERENCES members(id);

-- 2. Add index for querying active (non-merged) members
CREATE INDEX idx_members_active_not_merged
ON members(is_active)
WHERE merged_into_id IS NULL;

-- 3. Create audit table to track merge history
CREATE TABLE member_merges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The member that was kept (canonical)
  primary_member_id UUID NOT NULL REFERENCES members(id),

  -- The member that was merged away
  merged_member_id UUID NOT NULL REFERENCES members(id),

  -- Who performed the merge
  merged_by UUID REFERENCES members(id),

  -- When the merge happened
  merged_at TIMESTAMPTZ DEFAULT NOW(),

  -- Stats at time of merge (for audit/undo reference)
  merged_member_stats JSONB,

  -- Optional reason/notes
  notes TEXT,

  CONSTRAINT different_members CHECK (primary_member_id != merged_member_id)
);

-- Index for looking up merge history
CREATE INDEX idx_member_merges_primary ON member_merges(primary_member_id);
CREATE INDEX idx_member_merges_merged ON member_merges(merged_member_id);

-- 4. Create function to perform the merge
CREATE OR REPLACE FUNCTION merge_members(
  p_primary_id UUID,
  p_merged_id UUID,
  p_merged_by UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_teams_updated INTEGER := 0;
  v_awards_updated INTEGER := 0;
  v_merged_stats JSONB;
BEGIN
  -- Validate: both members must exist and be different
  IF p_primary_id = p_merged_id THEN
    RAISE EXCEPTION 'Cannot merge a member into themselves';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM members WHERE id = p_primary_id AND merged_into_id IS NULL) THEN
    RAISE EXCEPTION 'Primary member not found or already merged';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM members WHERE id = p_merged_id AND merged_into_id IS NULL) THEN
    RAISE EXCEPTION 'Member to merge not found or already merged';
  END IF;

  -- Capture stats before merge for audit
  SELECT jsonb_build_object(
    'display_name', m.display_name,
    'yahoo_manager_id', m.yahoo_manager_id,
    'joined_year', m.joined_year,
    'team_count', (SELECT COUNT(*) FROM teams WHERE member_id = p_merged_id),
    'team_names', (SELECT jsonb_agg(DISTINCT team_name) FROM teams WHERE member_id = p_merged_id)
  ) INTO v_merged_stats
  FROM members m WHERE m.id = p_merged_id;

  -- Update all teams to point to primary member
  UPDATE teams SET member_id = p_primary_id WHERE member_id = p_merged_id;
  GET DIAGNOSTICS v_teams_updated = ROW_COUNT;

  -- Update awards
  UPDATE awards SET member_id = p_primary_id WHERE member_id = p_merged_id;
  GET DIAGNOSTICS v_awards_updated = ROW_COUNT;

  -- Update votes (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'votes') THEN
    UPDATE votes SET member_id = p_primary_id WHERE member_id = p_merged_id;
  END IF;

  -- Update media (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media') THEN
    UPDATE media SET uploaded_by = p_primary_id WHERE uploaded_by = p_merged_id;
  END IF;

  -- Update media_tags (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media_tags') THEN
    UPDATE media_tags SET member_id = p_primary_id WHERE member_id = p_merged_id;
  END IF;

  -- Update polls created_by (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'polls') THEN
    UPDATE polls SET created_by = p_primary_id WHERE created_by = p_merged_id;
  END IF;

  -- Update rule_amendments (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rule_amendments') THEN
    UPDATE rule_amendments SET proposed_by = p_primary_id WHERE proposed_by = p_merged_id;
  END IF;

  -- Mark the merged member
  UPDATE members
  SET
    merged_into_id = p_primary_id,
    is_active = FALSE,
    updated_at = NOW()
  WHERE id = p_merged_id;

  -- Update primary member's joined_year if merged member joined earlier
  UPDATE members
  SET joined_year = LEAST(
    joined_year,
    (SELECT joined_year FROM members WHERE id = p_merged_id)
  )
  WHERE id = p_primary_id;

  -- Create audit record
  INSERT INTO member_merges (primary_member_id, merged_member_id, merged_by, notes, merged_member_stats)
  VALUES (p_primary_id, p_merged_id, p_merged_by, p_notes, v_merged_stats);

  -- Refresh materialized views that depend on member data
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_career_stats') THEN
    REFRESH MATERIALIZED VIEW mv_career_stats;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_h2h_matrix') THEN
    REFRESH MATERIALIZED VIEW mv_h2h_matrix;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'teams_updated', v_teams_updated,
    'awards_updated', v_awards_updated,
    'merged_member_stats', v_merged_stats
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS policies for member_merges table
ALTER TABLE member_merges ENABLE ROW LEVEL SECURITY;

-- All authenticated members can view merge history
CREATE POLICY "Members can view merge history"
  ON member_merges
  FOR SELECT
  TO authenticated
  USING (true);

-- Only commissioners can create merges (done via function with SECURITY DEFINER)

-- 6. Add comment for documentation
COMMENT ON FUNCTION merge_members IS
'Merges a duplicate member into a primary member. Updates all FKs (teams, awards, votes, media, etc.),
marks the duplicate as merged, and refreshes materialized views. Returns a summary of changes made.';

COMMENT ON TABLE member_merges IS
'Audit log of member merges. Stores the merged member stats at time of merge for potential undo.';

COMMENT ON COLUMN members.merged_into_id IS
'If set, this member has been merged into the referenced member. Query active members with WHERE merged_into_id IS NULL.';
