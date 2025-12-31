-- ============================================
-- Migration 006: Team Collaboration
-- Yorumlar, bildirimler, onay akışı, görev atama
-- ============================================

-- 1. Yorumlar Tablosu
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketing_item_id UUID REFERENCES marketing_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- Reply desteği
  content TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}', -- @mention edilen user_id'ler
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_item ON comments(marketing_item_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- 2. Bildirimler Tablosu
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'mention', 'comment', 'assignment', 'approval_request', 'approval_response', 'deadline', 'status_change'
  title TEXT NOT NULL,
  message TEXT,
  link TEXT, -- İçerik linki (örn: /dashboard?item=xxx)
  metadata JSONB DEFAULT '{}', -- Ek veriler
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- 3. Onay Akışı Tablosu
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketing_item_id UUID REFERENCES marketing_items(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- NULL = herhangi bir admin/editor
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'changes_requested'
  notes TEXT, -- Onay/red açıklaması
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_item ON approval_requests(marketing_item_id);
CREATE INDEX IF NOT EXISTS idx_approval_reviewer ON approval_requests(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_approval_status ON approval_requests(status);

-- 4. Marketing Items'a görev atama alanı ekle
ALTER TABLE marketing_items ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id);
ALTER TABLE marketing_items ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE marketing_items ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES profiles(id);

CREATE INDEX IF NOT EXISTS idx_marketing_items_assigned ON marketing_items(assigned_to);

-- 5. RLS Politikaları

-- Comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select" ON comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "comments_insert" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_update" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "comments_delete" ON comments
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_all" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- Approval Requests
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approval_select" ON approval_requests
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "approval_insert" ON approval_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "approval_update" ON approval_requests
  FOR UPDATE USING (
    auth.uid() = reviewer_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 6. Yorum eklendiğinde bildirim oluştur (trigger)
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_item_title TEXT;
  v_commenter_name TEXT;
  v_item_owner UUID;
  v_mentioned_user UUID;
BEGIN
  -- İçerik başlığını al
  SELECT title, user_id INTO v_item_title, v_item_owner
  FROM marketing_items
  WHERE id = NEW.marketing_item_id;

  -- Yorum yapan kişinin adını al
  SELECT COALESCE(full_name, email) INTO v_commenter_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- İçerik sahibine bildirim gönder (kendi yorumu değilse)
  IF v_item_owner IS NOT NULL AND v_item_owner != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      v_item_owner,
      'comment',
      'Yeni yorum',
      v_commenter_name || ' "' || LEFT(v_item_title, 30) || '..." içeriğine yorum yaptı',
      '/dashboard?item=' || NEW.marketing_item_id,
      jsonb_build_object('comment_id', NEW.id, 'marketing_item_id', NEW.marketing_item_id)
    );
  END IF;

  -- Mention edilen kullanıcılara bildirim gönder
  IF array_length(NEW.mentions, 1) > 0 THEN
    FOREACH v_mentioned_user IN ARRAY NEW.mentions
    LOOP
      IF v_mentioned_user != NEW.user_id THEN
        INSERT INTO notifications (user_id, type, title, message, link, metadata)
        VALUES (
          v_mentioned_user,
          'mention',
          'Bir yorumda etiketlendiniz',
          v_commenter_name || ' sizi "' || LEFT(v_item_title, 30) || '..." içeriğindeki yorumda etiketledi',
          '/dashboard?item=' || NEW.marketing_item_id,
          jsonb_build_object('comment_id', NEW.id, 'marketing_item_id', NEW.marketing_item_id)
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_created ON comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- 7. Görev atandığında bildirim oluştur (trigger)
CREATE OR REPLACE FUNCTION notify_on_assignment()
RETURNS TRIGGER AS $$
DECLARE
  v_assigner_name TEXT;
BEGIN
  -- Sadece assigned_to değiştiğinde ve yeni değer varsa
  IF (TG_OP = 'UPDATE' AND NEW.assigned_to IS DISTINCT FROM OLD.assigned_to AND NEW.assigned_to IS NOT NULL)
     OR (TG_OP = 'INSERT' AND NEW.assigned_to IS NOT NULL) THEN

    -- Atayan kişinin adını al
    SELECT COALESCE(full_name, email) INTO v_assigner_name
    FROM profiles
    WHERE id = NEW.assigned_by;

    -- Atanan kişiye bildirim gönder
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      NEW.assigned_to,
      'assignment',
      'Size bir görev atandı',
      COALESCE(v_assigner_name, 'Birisi') || ' size "' || LEFT(NEW.title, 30) || '..." görevini atadı',
      '/dashboard?item=' || NEW.id,
      jsonb_build_object('marketing_item_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_item_assignment ON marketing_items;
CREATE TRIGGER on_item_assignment
  AFTER INSERT OR UPDATE OF assigned_to ON marketing_items
  FOR EACH ROW EXECUTE FUNCTION notify_on_assignment();

-- 8. Onay isteği oluşturulduğunda bildirim gönder
CREATE OR REPLACE FUNCTION notify_on_approval_request()
RETURNS TRIGGER AS $$
DECLARE
  v_requester_name TEXT;
  v_item_title TEXT;
  v_reviewer UUID;
BEGIN
  -- İstekte bulunan kişinin adını al
  SELECT COALESCE(full_name, email) INTO v_requester_name
  FROM profiles
  WHERE id = NEW.requester_id;

  -- İçerik başlığını al
  SELECT title INTO v_item_title
  FROM marketing_items
  WHERE id = NEW.marketing_item_id;

  -- Eğer belirli bir reviewer varsa ona, yoksa tüm adminlere bildirim gönder
  IF NEW.reviewer_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      NEW.reviewer_id,
      'approval_request',
      'Onay isteği',
      v_requester_name || ' "' || LEFT(v_item_title, 30) || '..." için onay istiyor',
      '/dashboard?item=' || NEW.marketing_item_id,
      jsonb_build_object('approval_id', NEW.id, 'marketing_item_id', NEW.marketing_item_id)
    );
  ELSE
    -- Tüm adminlere bildirim gönder
    FOR v_reviewer IN SELECT id FROM profiles WHERE role = 'admin' AND is_active = true
    LOOP
      INSERT INTO notifications (user_id, type, title, message, link, metadata)
      VALUES (
        v_reviewer,
        'approval_request',
        'Onay isteği',
        v_requester_name || ' "' || LEFT(v_item_title, 30) || '..." için onay istiyor',
        '/dashboard?item=' || NEW.marketing_item_id,
        jsonb_build_object('approval_id', NEW.id, 'marketing_item_id', NEW.marketing_item_id)
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_approval_request_created ON approval_requests;
CREATE TRIGGER on_approval_request_created
  AFTER INSERT ON approval_requests
  FOR EACH ROW EXECUTE FUNCTION notify_on_approval_request();

-- 9. Onay yanıtlandığında bildirim gönder
CREATE OR REPLACE FUNCTION notify_on_approval_response()
RETURNS TRIGGER AS $$
DECLARE
  v_reviewer_name TEXT;
  v_item_title TEXT;
  v_status_text TEXT;
BEGIN
  -- Sadece status değiştiğinde
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status != 'pending' THEN
    -- Onaylayan kişinin adını al
    SELECT COALESCE(full_name, email) INTO v_reviewer_name
    FROM profiles
    WHERE id = NEW.reviewer_id;

    -- İçerik başlığını al
    SELECT title INTO v_item_title
    FROM marketing_items
    WHERE id = NEW.marketing_item_id;

    -- Status metni
    v_status_text := CASE NEW.status
      WHEN 'approved' THEN 'onayladı'
      WHEN 'rejected' THEN 'reddetti'
      WHEN 'changes_requested' THEN 'değişiklik istedi'
      ELSE 'yanıtladı'
    END;

    -- İstekte bulunan kişiye bildirim gönder
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      NEW.requester_id,
      'approval_response',
      'Onay yanıtı',
      v_reviewer_name || ' "' || LEFT(v_item_title, 30) || '..." içeriğini ' || v_status_text,
      '/dashboard?item=' || NEW.marketing_item_id,
      jsonb_build_object('approval_id', NEW.id, 'marketing_item_id', NEW.marketing_item_id, 'status', NEW.status)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_approval_response ON approval_requests;
CREATE TRIGGER on_approval_response
  AFTER UPDATE OF status ON approval_requests
  FOR EACH ROW EXECUTE FUNCTION notify_on_approval_response();
