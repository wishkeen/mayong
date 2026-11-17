create table if not exists public.translation_cache (
  target_language text not null,
  text_hash text not null check (text_hash ~ '^[0-9a-f]{64}$'),
  translated_text text not null,
  updated_at timestamptz not null default now(),
  primary key (target_language, text_hash)
);

alter table public.translation_cache enable row level security;
revoke all on public.translation_cache from anon, authenticated;
grant all on public.translation_cache to service_role;

create table if not exists public.translation_rate_limits (
  bucket_key text primary key check (bucket_key ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

create index if not exists translation_rate_limits_updated_at_idx
  on public.translation_rate_limits (updated_at);

alter table public.translation_rate_limits enable row level security;
revoke all on public.translation_rate_limits from anon, authenticated;
grant all on public.translation_rate_limits to service_role;

create or replace function public.consume_translation_request(
  p_bucket_key text,
  p_max_requests integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_count integer;
begin
  if auth.role() <> 'service_role'
    or p_bucket_key !~ '^[0-9a-f]{64}$'
    or p_max_requests < 1
    or p_max_requests > 120 then
    raise exception 'Invalid translation quota request';
  end if;

  delete from public.translation_rate_limits
  where updated_at < now() - interval '24 hours';

  insert into public.translation_rate_limits (
    bucket_key,
    window_started_at,
    request_count,
    updated_at
  )
  values (p_bucket_key, now(), 1, now())
  on conflict (bucket_key) do update
  set window_started_at = case
        when public.translation_rate_limits.window_started_at <= now() - interval '1 hour' then now()
        else public.translation_rate_limits.window_started_at
      end,
      request_count = case
        when public.translation_rate_limits.window_started_at <= now() - interval '1 hour' then 1
        else public.translation_rate_limits.request_count + 1
      end,
      updated_at = now()
  returning request_count into current_count;

  return current_count <= p_max_requests;
end;
$$;

revoke all on function public.consume_translation_request(text, integer) from public, anon, authenticated;
grant execute on function public.consume_translation_request(text, integer) to service_role;
