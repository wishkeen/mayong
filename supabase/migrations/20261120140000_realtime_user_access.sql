do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'entitlements'
    ) then
      alter publication supabase_realtime add table public.entitlements;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ritual_unlock_requests'
    ) then
      alter publication supabase_realtime add table public.ritual_unlock_requests;
    end if;
  end if;
end;
$$;
