-- PAEN Marketing Dashboard - Database Schema
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın

-- 1. ENUM Types
CREATE TYPE channel_type AS ENUM ('email', 'sms', 'meta_ads', 'instagram');
CREATE TYPE item_status AS ENUM ('planned', 'in_progress', 'completed');

-- 2. Profiles Table (linked to Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 3. Marketing Items Table (Core Table)
CREATE TABLE marketing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Core fields
  title TEXT NOT NULL,
  description TEXT,
  channel channel_type NOT NULL,
  status item_status DEFAULT 'planned',

  -- Dates
  scheduled_date DATE,
  scheduled_time TIME,
  actual_publish_date TIMESTAMPTZ,

  -- Additional info
  notes TEXT,
  target_audience TEXT,
  budget DECIMAL(10,2),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_marketing_items_user_id ON marketing_items(user_id);
CREATE INDEX idx_marketing_items_status ON marketing_items(status);
CREATE INDEX idx_marketing_items_channel ON marketing_items(channel);
CREATE INDEX idx_marketing_items_scheduled_date ON marketing_items(scheduled_date);

-- Enable RLS for marketing_items
ALTER TABLE marketing_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own items" ON marketing_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create items" ON marketing_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items" ON marketing_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own items" ON marketing_items
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Attachments Table
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketing_item_id UUID REFERENCES marketing_items(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL,
  url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attachments_item_id ON attachments(marketing_item_id);

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage attachments for own items" ON attachments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM marketing_items
      WHERE marketing_items.id = attachments.marketing_item_id
      AND marketing_items.user_id = auth.uid()
    )
  );

-- 5. Tags Table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, name)
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tags" ON tags
  FOR ALL USING (auth.uid() = user_id);

-- 6. Item Tags (Junction Table)
CREATE TABLE item_tags (
  marketing_item_id UUID REFERENCES marketing_items(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (marketing_item_id, tag_id)
);

ALTER TABLE item_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage item_tags for own items" ON item_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM marketing_items
      WHERE marketing_items.id = item_tags.marketing_item_id
      AND marketing_items.user_id = auth.uid()
    )
  );

-- 7. Functions and Triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_marketing_items_updated_at
  BEFORE UPDATE ON marketing_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
