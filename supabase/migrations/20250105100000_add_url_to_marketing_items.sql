-- Add url column to marketing_items table
ALTER TABLE marketing_items ADD COLUMN IF NOT EXISTS url TEXT;
