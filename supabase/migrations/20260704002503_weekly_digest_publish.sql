-- League Dispatch v1: drafts can be edited by the commissioner and only
-- published digests appear on the member dashboard.

ALTER TABLE weekly_digests
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS commissioner_note TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_title TEXT;

ALTER TABLE weekly_digests
  ALTER COLUMN highlights SET DEFAULT '[]'::jsonb;

UPDATE weekly_digests
SET highlights = '[]'::jsonb
WHERE highlights = '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'weekly_digests_status_check'
      AND conrelid = 'weekly_digests'::regclass
  ) THEN
    ALTER TABLE weekly_digests
      ADD CONSTRAINT weekly_digests_status_check
      CHECK (status IN ('draft', 'published'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_weekly_digests_published
  ON weekly_digests(season_id, week)
  WHERE status = 'published';

DROP POLICY IF EXISTS "Members can view weekly_digests" ON weekly_digests;
DROP POLICY IF EXISTS "Commissioners can manage weekly_digests" ON weekly_digests;
DROP POLICY IF EXISTS "Members can view published weekly_digests" ON weekly_digests;

CREATE POLICY "Members can view published weekly_digests" ON weekly_digests
  FOR SELECT
  USING (status = 'published');
