create table if not exists public.payment_gateway_settings (
  provider text not null check (provider in ('razorpay', 'instamojo')),
  enabled boolean not null default false,
  environment text not null default 'test' check (environment in ('test', 'live')),
  public_key text not null default '',
  secret_encrypted text not null default '',
  webhook_secret_encrypted text not null default '',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (provider, environment)
);
create unique index if not exists payment_gateway_only_one_active_idx
  on public.payment_gateway_settings(enabled) where enabled;

alter table public.orders
  add column if not exists gateway_order_id text not null default '',
  add column if not exists checkout_url text not null default '',
  add column if not exists payment_environment text not null default 'test',
  add column if not exists refund_recorded_at timestamptz,
  add column if not exists refund_note text not null default '',
  add column if not exists currency text not null default 'INR',
  add column if not exists payment_verified_at timestamptz;

create unique index if not exists orders_gateway_payment_unique_idx
  on public.orders(payment_mode, payment_id)
  where payment_mode in ('razorpay', 'instamojo') and payment_id <> '';

alter table public.payment_gateway_settings enable row level security;
revoke all on public.payment_gateway_settings from anon, authenticated;

create or replace function public.finalize_payment_order(
  local_order_id text,
  gateway_provider text,
  gateway_order_id text,
  gateway_payment_id text
)
returns public.orders
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare order_row public.orders;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role access required.' using errcode = '42501';
  end if;
  if gateway_provider not in ('razorpay', 'instamojo')
    or coalesce(gateway_order_id, '') = '' or coalesce(gateway_payment_id, '') = '' then
    raise exception 'Invalid payment reference.' using errcode = '22023';
  end if;

  select * into order_row from public.orders where id = local_order_id for update;
  if not found then raise exception 'Order not found.' using errcode = 'P0002'; end if;
  if order_row.payment_mode <> gateway_provider or order_row.gateway_order_id <> gateway_order_id then
    raise exception 'Payment does not match this order.' using errcode = '22023';
  end if;
  if order_row.status = 'paid' then
    if order_row.payment_id <> gateway_payment_id then
      raise exception 'A different payment is already recorded.' using errcode = '23505';
    end if;
    return order_row;
  end if;
  if order_row.status <> 'pending' then
    raise exception 'Order is not payable.' using errcode = '22023';
  end if;

  update public.orders
  set status = 'paid', payment_id = gateway_payment_id, payment_verified_at = now()
  where id = local_order_id returning * into order_row;

  insert into public.entitlements(user_id, ritual_id, order_id)
  values (order_row.user_id, order_row.ritual_id, order_row.id)
  on conflict (user_id, ritual_id) do update set order_id = excluded.order_id;

  return order_row;
end;
$$;

revoke all on function public.finalize_payment_order(text, text, text, text) from public, anon, authenticated;
grant execute on function public.finalize_payment_order(text, text, text, text) to service_role;

create or replace function public.record_manual_payment_refund(local_order_id text, reason text)
returns public.orders
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare order_row public.orders;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Administrator access is required.' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(reason, ''))) < 3 or char_length(reason) > 500 then
    raise exception 'Enter a refund note between 3 and 500 characters.' using errcode = '22023';
  end if;
  select * into order_row from public.orders where id = local_order_id for update;
  if not found then raise exception 'Order not found.' using errcode = 'P0002'; end if;
  if order_row.status <> 'paid' or order_row.payment_mode not in ('razorpay', 'instamojo') then
    raise exception 'Only confirmed gateway payments can be recorded as refunded.' using errcode = '22023';
  end if;
  update public.orders set status = 'refunded', refund_recorded_at = now(), refund_note = trim(reason)
  where id = local_order_id returning * into order_row;
  delete from public.entitlements where order_id = local_order_id;
  return order_row;
end;
$$;

revoke all on function public.record_manual_payment_refund(text, text) from public, anon;
grant execute on function public.record_manual_payment_refund(text, text) to authenticated;
