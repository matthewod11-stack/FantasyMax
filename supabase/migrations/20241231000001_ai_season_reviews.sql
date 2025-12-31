-- Add AI review columns to seasons table
-- These are separate from the existing recap_title/recap_content fields
-- which are reserved for commissioner-written content

ALTER TABLE seasons
  ADD COLUMN IF NOT EXISTS ai_review TEXT,
  ADD COLUMN IF NOT EXISTS ai_review_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_review_model TEXT;

COMMENT ON COLUMN seasons.ai_review IS 'AI-generated season review using Claude API';
COMMENT ON COLUMN seasons.ai_review_generated_at IS 'Timestamp when AI review was generated';
COMMENT ON COLUMN seasons.ai_review_model IS 'Model ID used for generation (e.g., claude-sonnet-4-20250514)';
