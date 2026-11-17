create table if not exists public.legacy_import_rows (
  id bigint generated always as identity primary key,
  source_collection text not null check (
    source_collection in ('RitualSession', 'JournalEntry', 'Favorite', 'Order', 'Entitlement')
  ),
  source_id text not null,
  legacy_user_id text,
  payload jsonb not null,
  imported_by uuid not null references auth.users(id),
  imported_at timestamptz not null default now(),
  unique (source_collection, source_id)
);

alter table public.legacy_import_rows enable row level security;
revoke all on public.legacy_import_rows from public, anon, authenticated;
grant select on public.legacy_import_rows to authenticated;

drop policy if exists "Admins read legacy import rows" on public.legacy_import_rows;
create policy "Admins read legacy import rows" on public.legacy_import_rows
for select to authenticated using ((select public.is_admin()));

create or replace function public.import_ritualos_legacy_backup(p_backup jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  collection_name text;
  section jsonb;
  row_data jsonb;
  activity_counts jsonb := '{}'::jsonb;
  staged_count integer;
  brand jsonb;
  branding_imported boolean := false;
  content_result jsonb;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Administrator access is required.';
  end if;

  if p_backup is null
     or jsonb_typeof(p_backup) <> 'object'
     or p_backup ->> 'format' <> 'ritualos-backup'
     or p_backup ->> 'version' <> '1'
     or jsonb_typeof(p_backup -> 'data') <> 'object'
     or octet_length(p_backup::text) > 5242880 then
    raise exception 'This is not a supported RitualOS backup or it exceeds the 5 MB import limit.';
  end if;

  content_result := public.restore_ritualos_backup(p_backup, 'merge');

  section := coalesce(p_backup -> 'data' -> 'AppBranding', '[]'::jsonb);
  if jsonb_typeof(section) <> 'array' or jsonb_array_length(section) > 1 then
    raise exception 'The AppBranding section is invalid.';
  end if;
  if jsonb_array_length(section) = 1 then
    brand := section -> 0;
    if jsonb_typeof(brand) <> 'object' then
      raise exception 'The AppBranding record is invalid.';
    end if;

    update public.app_branding
    set app_name = coalesce(nullif(left(brand ->> 'app_name', 60), ''), app_name),
        logo_url = coalesce(left(brand ->> 'logo_url', 2048), logo_url),
        icon_url = coalesce(left(brand ->> 'icon_url', 2048), icon_url),
        hero_subtitle = coalesce(left(brand ->> 'description', 240), hero_subtitle),
        updated_by = auth.uid()
    where id = 1;
    branding_imported := true;
  end if;

  foreach collection_name in array array[
    'RitualSession',
    'JournalEntry',
    'Favorite',
    'Order',
    'Entitlement'
  ]
  loop
    section := coalesce(p_backup -> 'data' -> collection_name, '[]'::jsonb);
    if jsonb_typeof(section) <> 'array' then
      raise exception 'The % section must be an array.', collection_name;
    end if;
    if jsonb_array_length(section) > 5000 then
      raise exception 'The % section exceeds the 5000 row import limit.', collection_name;
    end if;

    staged_count := 0;
    for row_data in select value from jsonb_array_elements(section) as rows(value)
    loop
      if jsonb_typeof(row_data) <> 'object'
         or nullif(row_data ->> 'id', '') is null then
        raise exception 'The % section contains an invalid row.', collection_name;
      end if;

      insert into public.legacy_import_rows (
        source_collection,
        source_id,
        legacy_user_id,
        payload,
        imported_by
      )
      values (
        collection_name,
        row_data ->> 'id',
        nullif(row_data ->> 'user_id', ''),
        row_data,
        auth.uid()
      )
      on conflict (source_collection, source_id) do update
      set legacy_user_id = excluded.legacy_user_id,
          payload = excluded.payload,
          imported_by = excluded.imported_by,
          imported_at = now();

      staged_count := staged_count + 1;
    end loop;

    activity_counts := activity_counts || jsonb_build_object(collection_name, staged_count);
  end loop;

  return jsonb_build_object(
    'content', content_result,
    'branding_imported', branding_imported,
    'activity_staged', activity_counts,
    'orders_grant_access', false
  );
end;
$$;

revoke all on function public.import_ritualos_legacy_backup(jsonb) from public;
revoke all on function public.import_ritualos_legacy_backup(jsonb) from anon;
grant execute on function public.import_ritualos_legacy_backup(jsonb) to authenticated;
