-- Source-first writeup identity.
-- Existing historical rows remain untouched; nullable unique keys allow the
-- curated archive importer to upsert individual source records safely.

ALTER TABLE public.writeups
  ADD COLUMN IF NOT EXISTS source_key TEXT,
  ADD COLUMN IF NOT EXISTS source_published_on DATE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_writeups_source_key
  ON public.writeups (source_key);

COMMENT ON COLUMN public.writeups.source_key IS
  'Stable archive identity for idempotent source imports; null for legacy rows until curated.';

COMMENT ON COLUMN public.writeups.source_published_on IS
  'Original source publication date when known; separate from application published_at.';
