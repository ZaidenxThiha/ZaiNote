-- Add soft-delete (Trash) support to notes
ALTER TABLE notes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Index for efficient trash queries
CREATE INDEX IF NOT EXISTS notes_deleted_at_idx ON notes (user_id, deleted_at) WHERE deleted_at IS NOT NULL;

-- Update the existing RLS select policy to exclude trashed notes for normal reads
-- (The existing policy allows users to see their own notes; we filter deleted_at in the app layer)
-- No RLS change needed — the app always passes .is('deleted_at', null) for normal queries
-- and .not('deleted_at', 'is', null) for trash queries.
