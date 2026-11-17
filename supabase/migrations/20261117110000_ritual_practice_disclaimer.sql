alter table public.rituals
  add column if not exists practice_disclaimer text not null default 'Rituals are offered as traditional, spiritual, symbolic, meditative and intention-based practices. They are not a substitute for professional medical, psychological, or financial advice, and no supernatural or guaranteed outcome is promised.';

alter table public.rituals
  drop constraint if exists rituals_practice_disclaimer_length_check;

alter table public.rituals
  add constraint rituals_practice_disclaimer_length_check
  check (char_length(practice_disclaimer) <= 2000);

alter table public.rituals
  drop constraint if exists rituals_translations_array_check;

alter table public.rituals
  add constraint rituals_translations_array_check
  check (jsonb_typeof(translations) = 'array');

do $$
begin
  if to_regprocedure('public.restore_ritualos_backup_with_practice_disclaimer(jsonb,text)') is null then
    alter function public.restore_ritualos_backup(jsonb, text)
      rename to restore_ritualos_backup_with_practice_disclaimer;
  end if;
end;
$$;

revoke all on function public.restore_ritualos_backup_with_practice_disclaimer(jsonb, text)
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
  translation_row jsonb;
  translation jsonb;
  practice_disclaimer text;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Administrator access is required.';
  end if;

  if jsonb_typeof(p_backup -> 'data' -> 'Ritual') = 'array' then
    for ritual_row in
      select value
      from jsonb_array_elements(p_backup -> 'data' -> 'Ritual') as rows(value)
    loop
      if ritual_row ? 'practice_disclaimer' then
        if jsonb_typeof(ritual_row -> 'practice_disclaimer') not in ('string', 'null') then
          raise exception 'A ritual practice disclaimer must be text.';
        end if;
        practice_disclaimer := ritual_row ->> 'practice_disclaimer';
        if char_length(coalesce(practice_disclaimer, '')) > 2000 then
          raise exception 'A ritual practice disclaimer exceeds the 2000 character limit.';
        end if;
      end if;

      if ritual_row ? 'translations' then
        if jsonb_typeof(ritual_row -> 'translations') <> 'array' then
          raise exception 'Ritual metadata translations must be an array.';
        end if;
        for translation_row in
          select value
          from jsonb_array_elements(ritual_row -> 'translations') as entries(value)
        loop
          translation := translation_row -> 'practice_disclaimer';
          if translation_row ? 'practice_disclaimer'
             and jsonb_typeof(translation) not in ('string', 'null') then
            raise exception 'A translated practice disclaimer must be text.';
          end if;
          if char_length(coalesce(translation_row ->> 'practice_disclaimer', '')) > 2000 then
            raise exception 'A translated practice disclaimer exceeds the 2000 character limit.';
          end if;
        end loop;
      end if;
    end loop;
  end if;

  result := public.restore_ritualos_backup_with_practice_disclaimer(p_backup, p_mode);

  if jsonb_typeof(p_backup -> 'data' -> 'Ritual') = 'array' then
    for ritual_row in
      select value
      from jsonb_array_elements(p_backup -> 'data' -> 'Ritual') as rows(value)
      where value ? 'practice_disclaimer'
    loop
      update public.rituals
      set practice_disclaimer = coalesce(
        ritual_row ->> 'practice_disclaimer',
        'Rituals are offered as traditional, spiritual, symbolic, meditative and intention-based practices. They are not a substitute for professional medical, psychological, or financial advice, and no supernatural or guaranteed outcome is promised.'
      )
      where id = ritual_row ->> 'id';
    end loop;
  end if;

  return result;
end;
$$;

revoke all on function public.restore_ritualos_backup(jsonb, text) from public, anon;
grant execute on function public.restore_ritualos_backup(jsonb, text) to authenticated;
