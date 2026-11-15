create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  preferred_language text,
  avatar_url text,
  created_date timestamptz not null default now()
);

create or replace function public.handle_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
  set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email on auth.users
for each row execute function public.handle_auth_user();

create table if not exists public.categories (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  slug text not null unique,
  icon text not null default '',
  description text not null default '',
  sort_order integer not null default 0,
  created_date timestamptz not null default now()
);

create table if not exists public.rituals (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  category_id text references public.categories(id) on delete set null,
  category_slug text,
  category_name text,
  description text not null default '',
  duration_minutes integer not null default 0,
  difficulty text not null default 'Beginner',
  price numeric(12, 2) not null default 0 check (price >= 0),
  source text not null default '',
  practice_type text not null default 'traditional',
  image_url text not null default '',
  is_published boolean not null default false,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_by_id uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now()
);

create table if not exists public.ritual_steps (
  id text primary key default gen_random_uuid()::text,
  ritual_id text not null references public.rituals(id) on delete cascade,
  "order" integer not null default 0,
  type text not null default 'instruction',
  title text not null default '',
  content text not null default '',
  repetitions integer not null default 0,
  duration_seconds integer not null default 0,
  audio_url text not null default '',
  translations jsonb not null default '[]'::jsonb,
  created_date timestamptz not null default now()
);

create table if not exists public.ritual_sessions (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_by_id uuid references auth.users(id) on delete set null,
  ritual_id text references public.rituals(id) on delete set null,
  ritual_name text not null default '',
  current_step integer not null default 0,
  total_steps integer not null default 0,
  status text not null default 'in_progress',
  progress_log jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  created_date timestamptz not null default now()
);

create or replace function public.set_session_owner()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is not null then
    new.user_id := auth.uid();
    new.created_by_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists set_ritual_session_owner on public.ritual_sessions;
create trigger set_ritual_session_owner
before insert on public.ritual_sessions
for each row execute function public.set_session_owner();

create table if not exists public.orders (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_by_id uuid references auth.users(id) on delete set null,
  ritual_id text references public.rituals(id) on delete set null,
  ritual_name text not null default '',
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  status text not null default 'pending',
  payment_mode text not null default '',
  payment_id text not null default '',
  created_date timestamptz not null default now()
);

create table if not exists public.entitlements (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  ritual_id text not null references public.rituals(id) on delete cascade,
  order_id text references public.orders(id) on delete set null,
  created_date timestamptz not null default now(),
  unique (user_id, ritual_id)
);

create table if not exists public.favorites (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  ritual_id text not null references public.rituals(id) on delete cascade,
  created_date timestamptz not null default now(),
  unique (user_id, ritual_id)
);

create table if not exists public.journal_entries (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text references public.ritual_sessions(id) on delete set null,
  ritual_id text references public.rituals(id) on delete set null,
  ritual_name text not null default '',
  notes text not null default '',
  rating integer not null default 0 check (rating between 0 and 5),
  mood text not null default '',
  created_date timestamptz not null default now()
);

create index if not exists rituals_category_id_idx on public.rituals(category_id);
create index if not exists ritual_steps_ritual_order_idx on public.ritual_steps(ritual_id, "order");
create index if not exists ritual_sessions_user_created_idx on public.ritual_sessions(user_id, created_date desc);
create index if not exists orders_user_created_idx on public.orders(user_id, created_date desc);
create index if not exists journal_entries_user_created_idx on public.journal_entries(user_id, created_date desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.rituals enable row level security;
alter table public.ritual_steps enable row level security;
alter table public.ritual_sessions enable row level security;
alter table public.orders enable row level security;
alter table public.entitlements enable row level security;
alter table public.favorites enable row level security;
alter table public.journal_entries enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.categories, public.rituals, public.ritual_steps,
  public.ritual_sessions, public.orders, public.entitlements,
  public.favorites, public.journal_entries from anon, authenticated;

grant select on public.categories, public.rituals, public.ritual_steps to anon, authenticated;
grant select on public.profiles, public.ritual_sessions, public.orders,
  public.entitlements, public.favorites, public.journal_entries to authenticated;
grant update (full_name, preferred_language, avatar_url) on public.profiles to authenticated;
grant insert, update, delete on public.categories, public.rituals, public.ritual_steps to authenticated;
grant insert, update, delete on public.ritual_sessions, public.journal_entries to authenticated;
grant insert, delete on public.entitlements, public.favorites to authenticated;

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories" on public.categories
for select to anon, authenticated using (true);
drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories" on public.categories
for all to authenticated using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Public can read published rituals" on public.rituals;
create policy "Public can read published rituals" on public.rituals
for select to anon, authenticated using (is_published or (select public.is_admin()));
drop policy if exists "Admins manage rituals" on public.rituals;
create policy "Admins manage rituals" on public.rituals
for all to authenticated using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Public can read steps for published rituals" on public.ritual_steps;
create policy "Public can read steps for published rituals" on public.ritual_steps
for select to anon, authenticated using (
  exists (
    select 1 from public.rituals
    where rituals.id = ritual_steps.ritual_id
      and (rituals.is_published or (select public.is_admin()))
  )
);
drop policy if exists "Admins manage ritual steps" on public.ritual_steps;
create policy "Admins manage ritual steps" on public.ritual_steps
for all to authenticated using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
for update to authenticated using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists "Users read own sessions" on public.ritual_sessions;
create policy "Users read own sessions" on public.ritual_sessions
for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "Users create own sessions" on public.ritual_sessions;
create policy "Users create own sessions" on public.ritual_sessions
for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Users update own sessions" on public.ritual_sessions;
create policy "Users update own sessions" on public.ritual_sessions
for update to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()))
with check (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "Users delete own sessions" on public.ritual_sessions;
create policy "Users delete own sessions" on public.ritual_sessions
for delete to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Users read own orders" on public.orders;
create policy "Users read own orders" on public.orders
for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "Admins manage orders" on public.orders;
create policy "Admins manage orders" on public.orders
for all to authenticated using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Users read own entitlements" on public.entitlements;
create policy "Users read own entitlements" on public.entitlements
for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "Users claim free rituals" on public.entitlements;
create policy "Users claim free rituals" on public.entitlements
for insert to authenticated with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.rituals
    where rituals.id = entitlements.ritual_id
      and rituals.is_published
      and rituals.price = 0
  )
);
drop policy if exists "Admins manage entitlements" on public.entitlements;
create policy "Admins manage entitlements" on public.entitlements
for all to authenticated using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Users manage own favorites" on public.favorites;
create policy "Users manage own favorites" on public.favorites
for all to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Users manage own journal entries" on public.journal_entries;
create policy "Users manage own journal entries" on public.journal_entries
for all to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
drop policy if exists "Admins read journal entries" on public.journal_entries;
create policy "Admins read journal entries" on public.journal_entries
for select to authenticated using ((select public.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ritual-assets',
  'ritual-assets',
  true,
  26214400,
  array['image/*', 'audio/*']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view ritual assets" on storage.objects;
create policy "Public can view ritual assets" on storage.objects
for select to anon, authenticated using (bucket_id = 'ritual-assets');
drop policy if exists "Admins upload ritual assets" on storage.objects;
create policy "Admins upload ritual assets" on storage.objects
for insert to authenticated with check (
  bucket_id = 'ritual-assets' and (select public.is_admin())
);
drop policy if exists "Admins update ritual assets" on storage.objects;
create policy "Admins update ritual assets" on storage.objects
for update to authenticated using (
  bucket_id = 'ritual-assets' and (select public.is_admin())
)
with check (bucket_id = 'ritual-assets' and (select public.is_admin()));
drop policy if exists "Admins delete ritual assets" on storage.objects;
create policy "Admins delete ritual assets" on storage.objects
for delete to authenticated using (
  bucket_id = 'ritual-assets' and (select public.is_admin())
);
