-- Tüm kullanıcılar tüm içerikleri görebilsin
-- Supabase Dashboard > SQL Editor'da çalıştırın

-- Eski policy'leri kaldır
DROP POLICY IF EXISTS "Users can view own items" ON marketing_items;
DROP POLICY IF EXISTS "Users can create items" ON marketing_items;
DROP POLICY IF EXISTS "Users can update own items" ON marketing_items;
DROP POLICY IF EXISTS "Users can delete own items" ON marketing_items;

-- Yeni policy'ler - herkes her şeyi görebilir ve düzenleyebilir
CREATE POLICY "All users can view all items" ON marketing_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "All users can create items" ON marketing_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "All users can update all items" ON marketing_items
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "All users can delete all items" ON marketing_items
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Attachments için de güncelle
DROP POLICY IF EXISTS "Users can manage attachments for own items" ON attachments;

CREATE POLICY "All users can manage attachments" ON attachments
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Tags için de güncelle (paylaşımlı etiketler)
DROP POLICY IF EXISTS "Users can manage own tags" ON tags;

CREATE POLICY "All users can view all tags" ON tags
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "All users can create tags" ON tags
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "All users can update tags" ON tags
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "All users can delete tags" ON tags
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Item tags için de güncelle
DROP POLICY IF EXISTS "Users can manage item_tags for own items" ON item_tags;

CREATE POLICY "All users can manage item_tags" ON item_tags
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Profiles için de herkes herkesi görsün
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "All users can view all profiles" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);
