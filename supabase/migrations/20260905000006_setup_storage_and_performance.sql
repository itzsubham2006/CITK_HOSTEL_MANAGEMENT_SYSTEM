-- ====================================================================
-- CITK HOSTEL ISSUE MANAGEMENT SYSTEM
-- MIGRATION: Storage Buckets Setup & Performance Indexes
-- ====================================================================

-- 1. Ensure storage buckets exist and are public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('diary-images', 'diary-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']),
  ('issue-images', 'issue-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Policies for diary-images
DROP POLICY IF EXISTS "Public can view diary images" ON storage.objects;
CREATE POLICY "Public can view diary images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'diary-images');

DROP POLICY IF EXISTS "Authenticated users can upload diary images" ON storage.objects;
CREATE POLICY "Authenticated users can upload diary images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'diary-images');

DROP POLICY IF EXISTS "Users can delete own diary images" ON storage.objects;
CREATE POLICY "Users can delete own diary images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'diary-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. Storage Policies for issue-images
DROP POLICY IF EXISTS "Public can view issue images" ON storage.objects;
CREATE POLICY "Public can view issue images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'issue-images');

DROP POLICY IF EXISTS "Authenticated users can upload issue images" ON storage.objects;
CREATE POLICY "Authenticated users can upload issue images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'issue-images');

-- 4. Storage Policies for avatars
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- 5. Performance Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_hostel_diaries_created_at 
ON public.hostel_diaries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_diary_likes_diary_user 
ON public.diary_likes(diary_id, user_id);

CREATE INDEX IF NOT EXISTS idx_diary_comments_diary_id 
ON public.diary_comments(diary_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_complaints_hostel_status 
ON public.complaints(hostel, status);
