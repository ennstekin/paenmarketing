-- ============================================
-- Migration 007: Campaign Details & Content Management
-- Kampanya detayları, priority, deadline, checklist
-- ============================================

-- 1. Marketing Items'a ek detay alanları ekle
ALTER TABLE marketing_items ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE marketing_items ADD COLUMN IF NOT EXISTS content_type TEXT;
ALTER TABLE marketing_items ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE marketing_items ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]';
ALTER TABLE marketing_items ADD COLUMN IF NOT EXISTS campaign_id UUID;

-- Priority constraint
ALTER TABLE marketing_items DROP CONSTRAINT IF EXISTS marketing_items_priority_check;
ALTER TABLE marketing_items ADD CONSTRAINT marketing_items_priority_check
  CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- Content type constraint
ALTER TABLE marketing_items DROP CONSTRAINT IF EXISTS marketing_items_content_type_check;
ALTER TABLE marketing_items ADD CONSTRAINT marketing_items_content_type_check
  CHECK (content_type IS NULL OR content_type IN ('post', 'story', 'reel', 'article', 'newsletter', 'ad'));

-- 2. Kampanyalar Tablosu (içerikleri gruplamak için)
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active', -- 'draft', 'active', 'completed', 'archived'
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check;
ALTER TABLE campaigns ADD CONSTRAINT campaigns_status_check
  CHECK (status IN ('draft', 'active', 'completed', 'archived'));

CREATE INDEX IF NOT EXISTS idx_campaigns_user ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- Add foreign key after campaigns table is created
ALTER TABLE marketing_items DROP CONSTRAINT IF EXISTS marketing_items_campaign_id_fkey;
ALTER TABLE marketing_items ADD CONSTRAINT marketing_items_campaign_id_fkey
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_marketing_items_campaign ON marketing_items(campaign_id);
CREATE INDEX IF NOT EXISTS idx_marketing_items_priority ON marketing_items(priority);
CREATE INDEX IF NOT EXISTS idx_marketing_items_deadline ON marketing_items(deadline);

-- 3. İçerik Geçmişi (revizyon takibi)
CREATE TABLE IF NOT EXISTS content_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketing_item_id UUID REFERENCES marketing_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'status_changed', 'assigned', 'priority_changed'
  changes JSONB DEFAULT '{}', -- Değişen alanlar
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_history_item ON content_history(marketing_item_id);
CREATE INDEX IF NOT EXISTS idx_content_history_created ON content_history(created_at DESC);

-- 4. Hatırlatıcılar Tablosu
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketing_item_id UUID REFERENCES marketing_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  remind_at TIMESTAMPTZ NOT NULL,
  message TEXT,
  is_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_item ON reminders(marketing_item_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_pending ON reminders(remind_at) WHERE is_sent = false;

-- 5. RLS Politikaları

-- Campaigns
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_select" ON campaigns
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "campaigns_insert" ON campaigns
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
        AND is_active = true
    )
  );

CREATE POLICY "campaigns_update" ON campaigns
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
        AND is_active = true
    )
  );

CREATE POLICY "campaigns_delete" ON campaigns
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- Content History
ALTER TABLE content_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_history_select" ON content_history
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "content_history_insert" ON content_history
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Reminders
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reminders_all" ON reminders
  FOR ALL USING (auth.uid() = user_id);

-- 6. Content history trigger - değişiklikleri otomatik kaydet
CREATE OR REPLACE FUNCTION log_content_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changes JSONB;
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
    v_changes := jsonb_build_object('title', NEW.title);
  ELSIF TG_OP = 'UPDATE' THEN
    v_changes := '{}'::jsonb;
    v_action := 'updated';

    -- Status değişikliği
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      v_action := 'status_changed';
      v_changes := v_changes || jsonb_build_object(
        'status', jsonb_build_object('old', OLD.status, 'new', NEW.status)
      );
    END IF;

    -- Atama değişikliği
    IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
      v_action := 'assigned';
      v_changes := v_changes || jsonb_build_object(
        'assigned_to', jsonb_build_object('old', OLD.assigned_to, 'new', NEW.assigned_to)
      );
    END IF;

    -- Priority değişikliği
    IF NEW.priority IS DISTINCT FROM OLD.priority THEN
      v_action := 'priority_changed';
      v_changes := v_changes || jsonb_build_object(
        'priority', jsonb_build_object('old', OLD.priority, 'new', NEW.priority)
      );
    END IF;

    -- Title değişikliği
    IF NEW.title IS DISTINCT FROM OLD.title THEN
      v_changes := v_changes || jsonb_build_object(
        'title', jsonb_build_object('old', OLD.title, 'new', NEW.title)
      );
    END IF;

    -- Değişiklik yoksa log oluşturma
    IF v_changes = '{}'::jsonb THEN
      RETURN NEW;
    END IF;
  END IF;

  INSERT INTO content_history (marketing_item_id, user_id, action, changes)
  VALUES (NEW.id, auth.uid(), v_action, v_changes);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_content_change ON marketing_items;
CREATE TRIGGER on_content_change
  AFTER INSERT OR UPDATE ON marketing_items
  FOR EACH ROW EXECUTE FUNCTION log_content_changes();

-- 7. Deadline yaklaştığında bildirim oluştur (daily cron için hazır function)
CREATE OR REPLACE FUNCTION notify_upcoming_deadlines()
RETURNS void AS $$
DECLARE
  v_item RECORD;
  v_user_name TEXT;
BEGIN
  -- Yarın deadline olan içerikler için bildirim oluştur
  FOR v_item IN
    SELECT mi.id, mi.title, mi.deadline, mi.assigned_to, mi.user_id
    FROM marketing_items mi
    WHERE mi.deadline = CURRENT_DATE + INTERVAL '1 day'
      AND mi.status != 'completed'
  LOOP
    -- Atanan kişiye veya oluşturana bildirim gönder
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      COALESCE(v_item.assigned_to, v_item.user_id),
      'deadline',
      'Yarın son gün!',
      '"' || LEFT(v_item.title, 30) || '..." için yarın son gün',
      '/dashboard?item=' || v_item.id,
      jsonb_build_object('marketing_item_id', v_item.id, 'deadline', v_item.deadline)
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Campaigns updated_at trigger
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS campaigns_updated_at ON campaigns;
CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_campaigns_updated_at();
