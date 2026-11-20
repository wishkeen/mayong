-- Public, non-sensitive payment availability lets open ritual pages react to
-- gateway activation/deactivation without exposing provider credentials.
create table if not exists public.payment_gateway_runtime (
  id integer primary key check (id = 1),
  enabled boolean not null default false,
  provider text not null default '' check (provider in ('', 'razorpay', 'instamojo')),
  environment text not null default 'test' check (environment in ('test', 'live')),
  updated_at timestamptz not null default now()
);

alter table public.payment_gateway_runtime enable row level security;
revoke all on public.payment_gateway_runtime from anon, authenticated;
grant select on public.payment_gateway_runtime to anon, authenticated;
drop policy if exists "Anyone can read public payment availability" on public.payment_gateway_runtime;
create policy "Anyone can read public payment availability" on public.payment_gateway_runtime
for select to anon, authenticated using (true);

create or replace function public.sync_payment_gateway_runtime()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare active_gateway public.payment_gateway_settings;
begin
  select * into active_gateway from public.payment_gateway_settings where enabled = true limit 1;
  if found then
    insert into public.payment_gateway_runtime (id, enabled, provider, environment, updated_at)
    values (1, true, active_gateway.provider, active_gateway.environment, now())
    on conflict (id) do update set
      enabled = excluded.enabled,
      provider = excluded.provider,
      environment = excluded.environment,
      updated_at = excluded.updated_at;
  else
    insert into public.payment_gateway_runtime (id, enabled, provider, environment, updated_at)
    values (1, false, '', 'test', now())
    on conflict (id) do update set
      enabled = false,
      provider = '',
      environment = 'test',
      updated_at = now();
  end if;
  return null;
end;
$$;

revoke all on function public.sync_payment_gateway_runtime() from public, anon, authenticated;

drop trigger if exists sync_payment_gateway_runtime on public.payment_gateway_settings;
create trigger sync_payment_gateway_runtime
after insert or update or delete on public.payment_gateway_settings
for each statement execute function public.sync_payment_gateway_runtime();

do $$
declare active_gateway public.payment_gateway_settings;
begin
  select * into active_gateway from public.payment_gateway_settings where enabled = true limit 1;
  if found then
    insert into public.payment_gateway_runtime (id, enabled, provider, environment)
    values (1, true, active_gateway.provider, active_gateway.environment)
    on conflict (id) do update set
      enabled = excluded.enabled,
      provider = excluded.provider,
      environment = excluded.environment,
      updated_at = now();
  else
    insert into public.payment_gateway_runtime (id, enabled, provider, environment)
    values (1, false, '', 'test')
    on conflict (id) do update set
      enabled = false,
      provider = '',
      environment = 'test',
      updated_at = now();
  end if;
end;
$$;

-- Reuse the unlock publication migration's idempotent publication setup and add
-- the tables needed by app pages, activity views and public/admin settings.
do $$
declare table_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array[
      'categories', 'rituals', 'ritual_steps', 'profiles', 'ritual_sessions',
      'orders', 'favorites', 'journal_entries', 'app_branding',
      'auth_provider_settings', 'ritual_unlock_settings', 'payment_gateway_runtime'
    ] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name
      ) then
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      end if;
    end loop;
  end if;
end;
$$;
