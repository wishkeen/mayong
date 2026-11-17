create table if not exists public.app_branding (
  id integer primary key check (id = 1),
  app_name text not null default 'RitualOS' check (char_length(app_name) between 1 and 60),
  logo_url text not null default '',
  icon_url text not null default '',
  accent_color text not null default '#D6B56A' check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  secondary_color text not null default '#171522' check (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  hero_title text not null default '' check (char_length(hero_title) <= 120),
  hero_subtitle text not null default '' check (char_length(hero_subtitle) <= 240),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_app_branding_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists touch_app_branding_updated_at on public.app_branding;
create trigger touch_app_branding_updated_at
before update on public.app_branding
for each row execute function public.touch_app_branding_updated_at();

alter table public.app_branding enable row level security;
revoke all on public.app_branding from anon, authenticated;
grant select on public.app_branding to anon, authenticated;
grant insert, update on public.app_branding to authenticated;

drop policy if exists "Public can read app branding" on public.app_branding;
create policy "Public can read app branding" on public.app_branding
for select to anon, authenticated using (true);

drop policy if exists "Admins manage app branding" on public.app_branding;
create policy "Admins manage app branding" on public.app_branding
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

insert into public.app_branding (id)
values (1)
on conflict (id) do nothing;
