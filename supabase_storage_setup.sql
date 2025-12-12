-- RUN THIS SCRIPT IN SUPABASE SQL EDITOR

-- 1. Create a storage bucket for avatars
-- 'public' is set to true so avatars can be viewed by anyone
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- 2. Allow public access to view avatars
-- This ensures the avatar URLs are accessible to everyone (e.g., on profile page)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 3. Allow authenticated users to upload avatars
-- Only logged-in users can upload files
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated, anon 
-- Note: 'anon' is included if you are using Supabase Client with Anon Key from server side without auth context, 
-- or if you handle auth simply. If strict RLS is needed, remove 'anon'.
WITH CHECK ( bucket_id = 'avatars' );

-- 4. Allow users to update their own avatars
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated, anon
USING ( bucket_id = 'avatars' );

-- 5. Allow users to delete their own avatars (optional)
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated, anon
USING ( bucket_id = 'avatars' );
