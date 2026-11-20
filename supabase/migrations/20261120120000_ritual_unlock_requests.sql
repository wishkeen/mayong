create table if not exists public.ritual_unlock_settings (
  id integer primary key check (id = 1),
  mode text not null default 'current' check (mode in ('current', 'approval')),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.ritual_unlock_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.ritual_unlock_requests (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  ritual_id text not null references public.rituals(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  unique (user_id, ritual_id, id)
);

create unique index if not exists ritual_unlock_requests_one_pending_idx
  on public.ritual_unlock_requests(user_id, ritual_id) where status = 'pending';
create index if not exists ritual_unlock_requests_status_created_idx
  on public.ritual_unlock_requests(status, created_at desc);

alter table public.ritual_unlock_settings enable row level security;
alter table public.ritual_unlock_requests enable row level security;
revoke all on public.ritual_unlock_settings, public.ritual_unlock_requests from anon, authenticated;
grant select on public.ritual_unlock_settings to anon, authenticated;
grant update (mode, updated_by, updated_at) on public.ritual_unlock_settings to authenticated;
grant select, insert on public.ritual_unlock_requests to authenticated;

drop policy if exists "Anyone can read ritual unlock mode" on public.ritual_unlock_settings;
create policy "Anyone can read ritual unlock mode" on public.ritual_unlock_settings
for select to anon, authenticated using (true);
drop policy if exists "Admins update ritual unlock mode" on public.ritual_unlock_settings;
create policy "Admins update ritual unlock mode" on public.ritual_unlock_settings
for update to authenticated using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Users read own unlock requests" on public.ritual_unlock_requests;
create policy "Users read own unlock requests" on public.ritual_unlock_requests
for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "Users request published ritual access" on public.ritual_unlock_requests;
create policy "Users request published ritual access" on public.ritual_unlock_requests
for insert to authenticated with check (
  user_id = (select auth.uid()) and status = 'pending' and reviewed_at is null and reviewed_by is null
  and exists (select 1 from public.rituals where id = ritual_id and is_published)
  and exists (select 1 from public.ritual_unlock_settings where id = 1 and mode = 'approval')
  and not exists (select 1 from public.entitlements where user_id = (select auth.uid()) and ritual_id = ritual_unlock_requests.ritual_id)
);

-- Keep direct free unlocks available only in the existing mode. Approval mode requires an admin decision.
drop policy if exists "Users claim free rituals" on public.entitlements;
create policy "Users claim free rituals" on public.entitlements
for insert to authenticated with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.ritual_unlock_settings where id = 1 and mode = 'current')
  and exists (
    select 1 from public.rituals
    where rituals.id = entitlements.ritual_id and rituals.is_published and rituals.price = 0
  )
);

-- Ritual steps are the protected content. Direct player URLs and direct API reads
-- must require an entitlement (except free rituals in the existing unlock mode).
drop policy if exists "Public can read steps for published rituals" on public.ritual_steps;
create policy "Users read accessible ritual steps" on public.ritual_steps
for select to authenticated using (
  exists (
    select 1 from public.rituals
    where rituals.id = ritual_steps.ritual_id and rituals.is_published
      and (
        (select public.is_admin())
        or exists (select 1 from public.entitlements where user_id = (select auth.uid()) and ritual_id = rituals.id)
      )
  )
);

create or replace function public.review_ritual_unlock_request(request_id text, decision text)
returns public.ritual_unlock_requests
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare request_row public.ritual_unlock_requests;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Administrator access is required.' using errcode = '42501';
  end if;
  if decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected.' using errcode = '22023';
  end if;

  select * into request_row from public.ritual_unlock_requests
  where id = request_id and status = 'pending' for update;
  if not found then
    raise exception 'This request is no longer pending.' using errcode = 'P0002';
  end if;

  if decision = 'approved' then
    insert into public.entitlements(user_id, ritual_id)
    values (request_row.user_id, request_row.ritual_id)
    on conflict (user_id, ritual_id) do nothing;
  end if;

  update public.ritual_unlock_requests
  set status = decision, reviewed_at = now(), reviewed_by = auth.uid()
  where id = request_id returning * into request_row;
  return request_row;
end;
$$;

revoke all on function public.review_ritual_unlock_request(text, text) from public, anon;
grant execute on function public.review_ritual_unlock_request(text, text) to authenticated;
