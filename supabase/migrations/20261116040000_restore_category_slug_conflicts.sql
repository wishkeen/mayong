do $$
begin
  if to_regprocedure('public.restore_ritualos_backup_v1(jsonb,text)') is null then
    execute 'alter function public.restore_ritualos_backup(jsonb, text) rename to restore_ritualos_backup_v1';
  end if;
end;
$$;

revoke all on function public.restore_ritualos_backup_v1(jsonb, text) from public, anon, authenticated;

create or replace function public.restore_ritualos_backup(p_backup jsonb, p_mode text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  backup_to_restore jsonb := p_backup;
  category_rows jsonb;
  mapped_categories jsonb;
  mapped_rituals jsonb;
  category_id_map jsonb;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Administrator access is required.';
  end if;

  if p_backup is null
     or jsonb_typeof(p_backup) <> 'object'
     or jsonb_typeof(p_backup -> 'data') <> 'object' then
    return public.restore_ritualos_backup_v1(p_backup, p_mode);
  end if;

  category_rows := coalesce(p_backup -> 'data' -> 'Category', '[]'::jsonb);
  if jsonb_typeof(category_rows) <> 'array' then
    return public.restore_ritualos_backup_v1(p_backup, p_mode);
  end if;

  if exists (
    select 1
    from jsonb_array_elements(category_rows) as row_data(value)
    group by value ->> 'id'
    having count(*) > 1
  ) or exists (
    select 1
    from jsonb_array_elements(category_rows) as row_data(value)
    group by value ->> 'slug'
    having count(*) > 1
  ) then
    raise exception 'The backup contains duplicate category IDs or slugs.';
  end if;

  with source_categories as (
    select value, ordinality
    from jsonb_array_elements(category_rows) with ordinality as rows(value, ordinality)
  ),
  resolved_categories as (
    select
      source.value ->> 'id' as source_id,
      coalesce(existing.id, source.value ->> 'id') as target_id,
      source.value as row_value,
      source.ordinality
    from source_categories as source
    left join lateral (
      select category.id
      from public.categories as category
      where category.slug = source.value ->> 'slug'
         or category.id = source.value ->> 'id'
      order by
        case when category.slug = source.value ->> 'slug' then 0 else 1 end
      limit 1
    ) as existing on true
  )
  select
    coalesce(
      jsonb_agg(row_value || jsonb_build_object('id', target_id) order by ordinality),
      '[]'::jsonb
    ),
    coalesce(jsonb_object_agg(source_id, target_id), '{}'::jsonb)
  into mapped_categories, category_id_map
  from resolved_categories;

  if jsonb_typeof(p_backup -> 'data' -> 'Ritual') = 'array' then
    select coalesce(
      jsonb_agg(
        case
          when nullif(value ->> 'category_id', '') is null then value
          else value || jsonb_build_object(
            'category_id',
            coalesce(category_id_map ->> (value ->> 'category_id'), value ->> 'category_id')
          )
        end
        order by ordinality
      ),
      '[]'::jsonb
    )
    into mapped_rituals
    from jsonb_array_elements(p_backup -> 'data' -> 'Ritual') with ordinality as rows(value, ordinality);

    backup_to_restore := jsonb_set(
      backup_to_restore,
      '{data,Ritual}',
      mapped_rituals,
      true
    );
  end if;

  backup_to_restore := jsonb_set(
    backup_to_restore,
    '{data,Category}',
    mapped_categories,
    true
  );

  return public.restore_ritualos_backup_v1(backup_to_restore, p_mode);
end;
$$;

revoke all on function public.restore_ritualos_backup(jsonb, text) from public, anon;
grant execute on function public.restore_ritualos_backup(jsonb, text) to authenticated;
