/*
# Videos and video storage

1. New Tables
- `videos`: a video uploaded by a creator. Starts as pending and is approved or rejected by an admin. Stores the storage path of the file.

2. Storage
- New public bucket `videos` (max 200 MB; mp4, webm, or mov). Files are stored in a folder named after the uploader.

3. Security
- Row level security enabled on `videos`.
- Creators see their own videos. Everyone signed in sees approved videos. Admins see all videos and can change status.
- Creators can create videos only as pending and only under their own storage folder.
- Storage objects can be uploaded, listed, updated, and deleted only inside the uploader's own folder.

4. Important notes
- Status changes are admin-only (column-restricted update).
*/

CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 2000),
  file_path text NOT NULL CHECK (char_length(file_path) <= 300),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS videos_owner_id_idx ON videos (owner_id);
CREATE INDEX IF NOT EXISTS videos_status_idx ON videos (status);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON videos TO authenticated;
GRANT INSERT (title, description, file_path) ON videos TO authenticated;
GRANT UPDATE (status) ON videos TO authenticated;

DROP POLICY IF EXISTS "videos_select_own" ON videos;
CREATE POLICY "videos_select_own" ON videos FOR SELECT
TO authenticated USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "videos_select_approved" ON videos;
CREATE POLICY "videos_select_approved" ON videos FOR SELECT
TO authenticated USING (status = 'approved');

DROP POLICY IF EXISTS "videos_select_admin" ON videos;
CREATE POLICY "videos_select_admin" ON videos FOR SELECT
TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "videos_insert_own" ON videos;
CREATE POLICY "videos_insert_own" ON videos FOR INSERT
TO authenticated
WITH CHECK (
  owner_id = auth.uid()
  AND status = 'pending'
  AND split_part(file_path, '/', 1) = auth.uid()::text
);

DROP POLICY IF EXISTS "videos_update_admin" ON videos;
CREATE POLICY "videos_update_admin" ON videos FOR UPDATE
TO authenticated USING (is_admin()) WITH CHECK (is_admin());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos', 'videos', true, 209715200,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "videos_objects_select_own" ON storage.objects;
CREATE POLICY "videos_objects_select_own" ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "videos_objects_insert_own" ON storage.objects;
CREATE POLICY "videos_objects_insert_own" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "videos_objects_update_own" ON storage.objects;
CREATE POLICY "videos_objects_update_own" ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "videos_objects_delete_own" ON storage.objects;
CREATE POLICY "videos_objects_delete_own" ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);
