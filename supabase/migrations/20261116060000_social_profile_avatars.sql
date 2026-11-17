create or replace function public.handle_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  provider_avatar text;
  provider_name text;
begin
  provider_avatar := coalesce(
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(new.raw_user_meta_data ->> 'picture', ''),
    nullif(new.raw_user_meta_data ->> 'photo_url', '')
  );

  if provider_avatar is not null
    and (length(provider_avatar) > 2048 or provider_avatar !~* '^https://') then
    provider_avatar := null;
  end if;

  provider_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    ''
  );

  insert into public.profiles as existing_profile (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    provider_name,
    provider_avatar
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = case
        when btrim(existing_profile.full_name) = '' then excluded.full_name
        else existing_profile.full_name
      end,
      avatar_url = case
        when nullif(btrim(existing_profile.avatar_url), '') is null then excluded.avatar_url
        else existing_profile.avatar_url
      end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email on auth.users
for each row execute function public.handle_auth_user();

update public.profiles as profile
set avatar_url = provider.avatar_url
from auth.users as auth_user
cross join lateral (
  select coalesce(
    nullif(auth_user.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(auth_user.raw_user_meta_data ->> 'picture', ''),
    nullif(auth_user.raw_user_meta_data ->> 'photo_url', '')
  ) as avatar_url
) as provider
where profile.id = auth_user.id
  and (profile.avatar_url is null or btrim(profile.avatar_url) = '')
  and provider.avatar_url is not null
  and length(provider.avatar_url) <= 2048
  and provider.avatar_url ~* '^https://';
