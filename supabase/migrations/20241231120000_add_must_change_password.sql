-- Add must_change_password field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- Add temporary_password field to store the hashed temporary password (optional, for display)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS temp_password_hint TEXT DEFAULT NULL;
