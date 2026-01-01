-- Add is_idea flag to marketing_items for Ideas Pool feature
-- This allows items to be stored as ideas (without scheduled date) until moved to calendar

ALTER TABLE marketing_items ADD COLUMN IF NOT EXISTS is_idea BOOLEAN DEFAULT false;

-- Create index for faster querying of ideas
CREATE INDEX IF NOT EXISTS idx_marketing_items_is_idea ON marketing_items(is_idea) WHERE is_idea = true;

-- Comment
COMMENT ON COLUMN marketing_items.is_idea IS 'If true, this item is an idea/standby content not yet scheduled';
