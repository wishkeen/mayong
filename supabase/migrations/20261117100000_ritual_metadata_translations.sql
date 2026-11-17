alter table public.rituals
  add column if not exists translations jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.rituals'::regclass
      and conname = 'rituals_translations_array_check'
  ) then
    alter table public.rituals
      add constraint rituals_translations_array_check
      check (jsonb_typeof(translations) = 'array');
  end if;

  if to_regprocedure('public.restore_ritualos_backup_with_ritual_translations(jsonb,text)') is null then
    alter function public.restore_ritualos_backup(jsonb, text)
      rename to restore_ritualos_backup_with_ritual_translations;
  end if;
end;
$$;

revoke all on function public.restore_ritualos_backup_with_ritual_translations(jsonb, text)
  from public, anon, authenticated;

create or replace function public.restore_ritualos_backup(p_backup jsonb, p_mode text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result jsonb;
  ritual_row jsonb;
  translations jsonb;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Administrator access is required.';
  end if;

  if jsonb_typeof(p_backup -> 'data' -> 'Ritual') = 'array' then
    for ritual_row in
      select value
      from jsonb_array_elements(p_backup -> 'data' -> 'Ritual') as rows(value)
      where value ? 'translations'
    loop
      translations := coalesce(ritual_row -> 'translations', '[]'::jsonb);
      if jsonb_typeof(translations) <> 'array' then
        raise exception 'Ritual metadata translations must be an array.';
      end if;
      if exists (
        select 1
        from jsonb_array_elements(translations) as entries(value)
        where jsonb_typeof(value) <> 'object'
          or coalesce(value ->> 'language', '') not in ('bn', 'hi')
          or jsonb_typeof(value -> 'name') not in ('string', 'null')
          or jsonb_typeof(value -> 'description') not in ('string', 'null')
          or jsonb_typeof(value -> 'source') not in ('string', 'null')
      ) then
        raise exception 'A ritual metadata translation is invalid.';
      end if;
      if exists (
        select 1
        from jsonb_array_elements(translations) as entries(value)
        group by value ->> 'language'
        having count(*) > 1
      ) then
        raise exception 'A ritual metadata translation language is duplicated.';
      end if;
    end loop;
  end if;

  result := public.restore_ritualos_backup_with_ritual_translations(p_backup, p_mode);

  if jsonb_typeof(p_backup -> 'data' -> 'Ritual') = 'array' then
    for ritual_row in
      select value
      from jsonb_array_elements(p_backup -> 'data' -> 'Ritual') as rows(value)
      where value ? 'translations'
    loop
      update public.rituals
      set translations = coalesce(ritual_row -> 'translations', '[]'::jsonb)
      where id = ritual_row ->> 'id';
    end loop;
  end if;

  return result;
end;
$$;

revoke all on function public.restore_ritualos_backup(jsonb, text) from public, anon;
grant execute on function public.restore_ritualos_backup(jsonb, text) to authenticated;
