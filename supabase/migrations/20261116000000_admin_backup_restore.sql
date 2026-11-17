create or replace function public.restore_ritualos_backup(p_backup jsonb, p_mode text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  category_rows jsonb;
  ritual_rows jsonb;
  step_rows jsonb;
  category_count integer;
  ritual_count integer;
  step_count integer;
  imported_step_count integer;
  deleted_ritual_count integer := 0;
  deleted_category_count integer := 0;
begin
  if p_backup is null then
    raise exception 'Select a valid RitualOS backup file.';
  end if;

  if auth.uid() is null or not public.is_admin() then
    raise exception 'Administrator access is required.';
  end if;

  if p_mode is null or p_mode not in ('merge', 'replace') then
    raise exception 'Choose a supported restore mode.';
  end if;

  if jsonb_typeof(p_backup) <> 'object'
     or p_backup ->> 'format' <> 'ritualos-backup'
     or p_backup ->> 'version' <> '1'
     or jsonb_typeof(p_backup -> 'data') <> 'object' then
    raise exception 'This file is not a supported RitualOS backup.';
  end if;

  category_rows := coalesce(p_backup -> 'data' -> 'Category', '[]'::jsonb);
  ritual_rows := coalesce(p_backup -> 'data' -> 'Ritual', '[]'::jsonb);
  step_rows := coalesce(p_backup -> 'data' -> 'RitualStep', '[]'::jsonb);

  if jsonb_typeof(category_rows) <> 'array'
     or jsonb_typeof(ritual_rows) <> 'array'
     or jsonb_typeof(step_rows) <> 'array' then
    raise exception 'The backup content sections must be arrays.';
  end if;

  category_count := jsonb_array_length(category_rows);
  ritual_count := jsonb_array_length(ritual_rows);
  step_count := jsonb_array_length(step_rows);

  if category_count > 5000 or ritual_count > 5000 or step_count > 5000 then
    raise exception 'A backup section exceeds the supported limit of 5000 records.';
  end if;

  if category_count = 0 and ritual_count = 0 and step_count = 0 then
    raise exception 'This backup contains no app content to restore.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(category_rows) as row_data(value)
    where jsonb_typeof(value) <> 'object'
       or nullif(value ->> 'id', '') is null
       or nullif(value ->> 'name', '') is null
       or nullif(value ->> 'slug', '') is null
  ) then
    raise exception 'The backup contains an invalid category record.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(ritual_rows) as row_data(value)
    where jsonb_typeof(value) <> 'object'
       or nullif(value ->> 'id', '') is null
       or nullif(value ->> 'name', '') is null
  ) then
    raise exception 'The backup contains an invalid ritual record.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(step_rows) as row_data(value)
    where jsonb_typeof(value) <> 'object'
       or nullif(value ->> 'id', '') is null
       or nullif(value ->> 'ritual_id', '') is null
  ) then
    raise exception 'The backup contains an invalid ritual step.';
  end if;

  insert into public.categories (id, name, slug, icon, description, sort_order)
  select
    item.id,
    item.name,
    item.slug,
    coalesce(item.icon, ''),
    coalesce(item.description, ''),
    coalesce(item.sort_order, 0)
  from jsonb_to_recordset(category_rows) as item(
    id text,
    name text,
    slug text,
    icon text,
    description text,
    sort_order integer
  )
  where item.id is not null and item.name is not null and item.slug is not null
  on conflict (id) do update set
    name = excluded.name,
    slug = excluded.slug,
    icon = excluded.icon,
    description = excluded.description,
    sort_order = excluded.sort_order;

  insert into public.rituals (
    id, name, category_id, category_slug, category_name, description,
    duration_minutes, difficulty, source, price, image_url, is_published,
    is_featured, practice_type, sort_order
  )
  select
    item.id,
    item.name,
    item.category_id,
    item.category_slug,
    item.category_name,
    coalesce(item.description, ''),
    coalesce(item.duration_minutes, 0),
    coalesce(item.difficulty, 'Beginner'),
    coalesce(item.source, ''),
    coalesce(item.price, 0),
    coalesce(item.image_url, ''),
    coalesce(item.is_published, false),
    coalesce(item.is_featured, false),
    coalesce(item.practice_type, 'traditional'),
    coalesce(item.sort_order, 0)
  from jsonb_to_recordset(ritual_rows) as item(
    id text,
    name text,
    category_id text,
    category_slug text,
    category_name text,
    description text,
    duration_minutes integer,
    difficulty text,
    source text,
    price numeric,
    image_url text,
    is_published boolean,
    is_featured boolean,
    practice_type text,
    sort_order integer
  )
  where item.id is not null and item.name is not null
  on conflict (id) do update set
    name = excluded.name,
    category_id = excluded.category_id,
    category_slug = excluded.category_slug,
    category_name = excluded.category_name,
    description = excluded.description,
    duration_minutes = excluded.duration_minutes,
    difficulty = excluded.difficulty,
    source = excluded.source,
    price = excluded.price,
    image_url = excluded.image_url,
    is_published = excluded.is_published,
    is_featured = excluded.is_featured,
    practice_type = excluded.practice_type,
    sort_order = excluded.sort_order;

  if p_mode = 'replace' then
    delete from public.ritual_steps;

    delete from public.rituals
    where not exists (
      select 1
      from jsonb_to_recordset(ritual_rows) as item(id text)
      where item.id = rituals.id
    );
    get diagnostics deleted_ritual_count = row_count;

    delete from public.categories
    where not exists (
      select 1
      from jsonb_to_recordset(category_rows) as item(id text)
      where item.id = categories.id
    );
    get diagnostics deleted_category_count = row_count;
  else
    delete from public.ritual_steps
    where ritual_id in (
      select item.id
      from jsonb_to_recordset(ritual_rows) as item(id text)
      where item.id is not null
    );
  end if;

  insert into public.ritual_steps (
    id, ritual_id, "order", type, title, content, duration_seconds,
    repetitions, audio_url, translations
  )
  select
    item.id,
    item.ritual_id,
    coalesce(item."order", 0),
    coalesce(item.type, 'instruction'),
    coalesce(item.title, ''),
    coalesce(item.content, ''),
    coalesce(item.duration_seconds, 0),
    coalesce(item.repetitions, 0),
    coalesce(item.audio_url, ''),
    coalesce(item.translations, '[]'::jsonb)
  from jsonb_to_recordset(step_rows) as item(
    id text,
    ritual_id text,
    "order" integer,
    type text,
    title text,
    content text,
    duration_seconds integer,
    repetitions integer,
    audio_url text,
    translations jsonb
  )
  where item.id is not null
    and item.ritual_id is not null
    and exists (
      select 1
      from jsonb_to_recordset(ritual_rows) as ritual(id text)
      where ritual.id = item.ritual_id
    );
  get diagnostics imported_step_count = row_count;

  return jsonb_build_object(
    'mode', p_mode,
    'categories', category_count,
    'rituals', ritual_count,
    'steps', imported_step_count,
    'skipped_steps', greatest(step_count - imported_step_count, 0),
    'deleted_rituals', deleted_ritual_count,
    'deleted_categories', deleted_category_count
  );
end;
$$;

revoke all on function public.restore_ritualos_backup(jsonb, text) from public;
revoke all on function public.restore_ritualos_backup(jsonb, text) from anon;
grant execute on function public.restore_ritualos_backup(jsonb, text) to authenticated;

drop policy if exists "Admins read favorites" on public.favorites;
create policy "Admins read favorites" on public.favorites
for select to authenticated using ((select public.is_admin()));
