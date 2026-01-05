-- Add is_standby flag to marketing_items for Stand By feature
-- Items in Stand By are not scheduled but are ready to be planned

ALTER TABLE marketing_items ADD COLUMN IF NOT EXISTS is_standby BOOLEAN DEFAULT FALSE;

-- Add index for is_standby queries
CREATE INDEX IF NOT EXISTS idx_marketing_items_is_standby ON marketing_items(is_standby);

-- Comment for documentation
COMMENT ON COLUMN marketing_items.is_standby IS 'When true, item is in Stand By pool - ready to be scheduled but not yet planned';
