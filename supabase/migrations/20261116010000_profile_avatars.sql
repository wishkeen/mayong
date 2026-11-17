drop policy if exists "Users upload own profile avatars" on storage.objects;
create policy "Users upload own profile avatars" on storage.objects
for insert to authenticated with check (
  bucket_id = 'ritual-assets'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

drop policy if exists "Users update own profile avatars" on storage.objects;
create policy "Users update own profile avatars" on storage.objects
for update to authenticated using (
  bucket_id = 'ritual-assets'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = (select auth.uid())::text
)
with check (
  bucket_id = 'ritual-assets'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

drop policy if exists "Users delete own profile avatars" on storage.objects;
create policy "Users delete own profile avatars" on storage.objects
for delete to authenticated using (
  bucket_id = 'ritual-assets'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);
