create table if not exists public.auth_provider_settings (
  id integer primary key check (id = 1),
  google_enabled boolean not null default false,
  google_configured boolean not null default false,
  facebook_enabled boolean not null default false,
  facebook_configured boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  check (not google_enabled or google_configured),
  check (not facebook_enabled or facebook_configured)
);

create or replace function public.touch_auth_provider_settings_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists touch_auth_provider_settings_updated_at on public.auth_provider_settings;
create trigger touch_auth_provider_settings_updated_at
before update on public.auth_provider_settings
for each row execute function public.touch_auth_provider_settings_updated_at();

alter table public.auth_provider_settings enable row level security;
revoke all on public.auth_provider_settings from anon, authenticated;
grant select on public.auth_provider_settings to anon, authenticated;
grant update on public.auth_provider_settings to authenticated;

drop policy if exists "Public can read auth provider settings" on public.auth_provider_settings;
create policy "Public can read auth provider settings" on public.auth_provider_settings
for select to anon, authenticated using (true);

drop policy if exists "Admins manage auth provider settings" on public.auth_provider_settings;
create policy "Admins manage auth provider settings" on public.auth_provider_settings
for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

insert into public.auth_provider_settings (id)
values (1)
on conflict (id) do nothing;
