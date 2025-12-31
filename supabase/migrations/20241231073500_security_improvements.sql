-- ============================================
-- Migration 005: Security Improvements
-- Güvenlik iyileştirmeleri - RLS politikalarını düzelt
-- ============================================

-- 1. Mevcut gevşek politikaları kaldır
DROP POLICY IF EXISTS "All users can view all items" ON marketing_items;
DROP POLICY IF EXISTS "All users can create items" ON marketing_items;
DROP POLICY IF EXISTS "All users can update all items" ON marketing_items;
DROP POLICY IF EXISTS "All users can delete all items" ON marketing_items;

DROP POLICY IF EXISTS "All users can view all attachments" ON attachments;
DROP POLICY IF EXISTS "All users can create attachments" ON attachments;
DROP POLICY IF EXISTS "All users can delete attachments" ON attachments;

DROP POLICY IF EXISTS "All users can view all tags" ON tags;
DROP POLICY IF EXISTS "All users can create tags" ON tags;
DROP POLICY IF EXISTS "All users can update tags" ON tags;
DROP POLICY IF EXISTS "All users can delete tags" ON tags;

DROP POLICY IF EXISTS "All users can view all item_tags" ON item_tags;
DROP POLICY IF EXISTS "All users can create item_tags" ON item_tags;
DROP POLICY IF EXISTS "All users can delete item_tags" ON item_tags;

-- 2. Marketing Items - Role-based Politikalar
-- Tüm authenticated kullanıcılar görebilir (küçük ekip için)
CREATE POLICY "marketing_items_select" ON marketing_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create: Admin ve Editor yapabilir
CREATE POLICY "marketing_items_insert" ON marketing_items
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.is_active = true
        AND p.role IN ('admin', 'editor')
    )
  );

-- Update: Kendi içeriğini veya admin/editor ise herhangi birini
CREATE POLICY "marketing_items_update" ON marketing_items
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND role IN ('admin', 'editor')
          AND is_active = true
      )
    )
  );

-- Delete: Sadece admin
CREATE POLICY "marketing_items_delete" ON marketing_items
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- 3. Attachments - Marketing item'a bağlı politikalar
CREATE POLICY "attachments_select" ON attachments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "attachments_insert" ON attachments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
        AND is_active = true
    )
  );

CREATE POLICY "attachments_delete" ON attachments
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
        AND is_active = true
    )
  );

-- 4. Tags - Tüm kullanıcılar görebilir, admin/editor yönetebilir
CREATE POLICY "tags_select" ON tags
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "tags_insert" ON tags
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
        AND is_active = true
    )
  );

CREATE POLICY "tags_update" ON tags
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
        AND is_active = true
    )
  );

CREATE POLICY "tags_delete" ON tags
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- 5. Item Tags - Junction table
CREATE POLICY "item_tags_select" ON item_tags
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "item_tags_insert" ON item_tags
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
        AND is_active = true
    )
  );

CREATE POLICY "item_tags_delete" ON item_tags
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
        AND is_active = true
    )
  );

-- 6. Channels tablosuna RLS ekle (eğer yoksa)
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "channels_select" ON channels;
DROP POLICY IF EXISTS "channels_insert" ON channels;
DROP POLICY IF EXISTS "channels_update" ON channels;
DROP POLICY IF EXISTS "channels_delete" ON channels;

CREATE POLICY "channels_select" ON channels
  FOR SELECT USING (true); -- Herkes görebilir

CREATE POLICY "channels_insert" ON channels
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

CREATE POLICY "channels_update" ON channels
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

CREATE POLICY "channels_delete" ON channels
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- 7. Helper function: Kullanıcının rolünü kontrol et
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 8. Helper function: Kullanıcının belirli bir yetkisi var mı?
CREATE OR REPLACE FUNCTION public.user_has_permission(p_resource TEXT, p_action TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_allowed BOOLEAN;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid() AND is_active = true;

  IF v_role IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT allowed INTO v_allowed
  FROM permissions
  WHERE role = v_role AND resource = p_resource AND action = p_action;

  RETURN COALESCE(v_allowed, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
