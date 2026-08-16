
CREATE POLICY "Public read report-images" ON storage.objects FOR SELECT USING (bucket_id = 'report-images');
CREATE POLICY "Auth upload report-images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'report-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Auth update own report-images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'report-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Auth delete own report-images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'report-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Auth upload avatars" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Auth update own avatar" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Auth delete own avatar" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
