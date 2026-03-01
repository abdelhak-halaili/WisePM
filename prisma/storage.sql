-- Create the storage bucket 'ticket-assets'
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-assets', 'ticket-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Give authenticated users access to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'ticket-assets' AND auth.uid() = owner );

-- Policy: Give authenticated users access to update their own images
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'ticket-assets' AND auth.uid() = owner );

-- Policy: Give authenticated users access to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'ticket-assets' AND auth.uid() = owner );

-- Policy: Allow public read access to the bucket (since it's a public bucket)
-- Or restrict to authenticated if preferred, but usually ticket images are meant to be seen.
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'ticket-assets' );
