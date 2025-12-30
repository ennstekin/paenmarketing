-- PAEN Marketing Dashboard - Users, Permissions & Logs Schema
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın

-- 1. Roles ENUM
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer');

-- 2. Update profiles table with role
ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'viewer';
ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN last_login_at TIMESTAMPTZ;

-- 3. Activity Logs Table
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Action info
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout', etc.
  entity_type TEXT, -- 'marketing_item', 'profile', 'tag', etc.
  entity_id UUID,

  -- Details
  description TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Enable RLS for activity_logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view all logs, others can view their own
CREATE POLICY "Admins can view all logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view own logs" ON activity_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Only system can insert logs (via service role or functions)
CREATE POLICY "System can insert logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

-- 4. Permissions Table (granular permissions)
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  resource TEXT NOT NULL, -- 'marketing_items', 'users', 'logs', 'settings'
  action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete'
  allowed BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(role, resource, action)
);

-- Insert default permissions
INSERT INTO permissions (role, resource, action, allowed) VALUES
  -- Admin permissions (full access)
  ('admin', 'marketing_items', 'create', true),
  ('admin', 'marketing_items', 'read', true),
  ('admin', 'marketing_items', 'update', true),
  ('admin', 'marketing_items', 'delete', true),
  ('admin', 'users', 'create', true),
  ('admin', 'users', 'read', true),
  ('admin', 'users', 'update', true),
  ('admin', 'users', 'delete', true),
  ('admin', 'logs', 'read', true),
  ('admin', 'settings', 'read', true),
  ('admin', 'settings', 'update', true),

  -- Editor permissions
  ('editor', 'marketing_items', 'create', true),
  ('editor', 'marketing_items', 'read', true),
  ('editor', 'marketing_items', 'update', true),
  ('editor', 'marketing_items', 'delete', false),
  ('editor', 'users', 'read', true),
  ('editor', 'logs', 'read', false),
  ('editor', 'settings', 'read', true),

  -- Viewer permissions
  ('viewer', 'marketing_items', 'read', true),
  ('viewer', 'users', 'read', false),
  ('viewer', 'logs', 'read', false),
  ('viewer', 'settings', 'read', true);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read permissions" ON permissions
  FOR SELECT USING (true);

-- 5. Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, metadata)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_description, p_metadata)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to check permission
CREATE OR REPLACE FUNCTION has_permission(
  p_resource TEXT,
  p_action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_role user_role;
  v_allowed BOOLEAN;
BEGIN
  -- Get user's role
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();

  IF v_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check permission
  SELECT allowed INTO v_allowed
  FROM permissions
  WHERE role = v_role
    AND resource = p_resource
    AND action = p_action;

  RETURN COALESCE(v_allowed, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Update first user to admin (run after first signup)
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';

-- 8. Trigger to log marketing item changes
CREATE OR REPLACE FUNCTION log_marketing_item_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity('create', 'marketing_item', NEW.id, 'Marketing item created: ' || NEW.title);
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_activity('update', 'marketing_item', NEW.id, 'Marketing item updated: ' || NEW.title);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity('delete', 'marketing_item', OLD.id, 'Marketing item deleted: ' || OLD.title);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER marketing_items_audit
  AFTER INSERT OR UPDATE OR DELETE ON marketing_items
  FOR EACH ROW EXECUTE FUNCTION log_marketing_item_changes();
