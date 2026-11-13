-- LosOja in-app notifications
-- Run once in Supabase SQL Editor. No frontend insert permission is granted.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  business_id uuid null references public.businesses(id) on delete set null,
  escrow_id uuid null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_created_idx
  on public.notifications (user_id, is_read, created_at desc);

alter table public.notifications enable row level security;
grant select on public.notifications to authenticated;
grant update (is_read) on public.notifications to authenticated;

drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications"
  on public.notifications for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own notification read state" on public.notifications;
create policy "Users can update their own notification read state"
  on public.notifications for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Notify the owner when another user saves their business.
create or replace function public.losoja_notify_business_saved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  shop_owner uuid;
  shop_name text;
begin
  select b.user_id, b.name into shop_owner, shop_name
  from public.businesses b
  where b.id = new.business_id;

  if shop_owner is not null and shop_owner <> new.user_id then
    insert into public.notifications (user_id, type, title, message, business_id)
    values (
      shop_owner,
      'shop_saved',
      'Someone saved your shop',
      coalesce(shop_name, 'Your shop') || ' was saved',
      new.business_id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists losoja_business_saved_notification on public.saved_businesses;
create trigger losoja_business_saved_notification
after insert on public.saved_businesses
for each row execute function public.losoja_notify_business_saved();

-- Notify both escrow participants when the escrow status actually changes.
create or replace function public.losoja_notify_escrow_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  status_message text;
begin
  if new.status is distinct from old.status then
    status_message := 'Escrow update: ' || coalesce(new.status, 'updated');
    if new.buyer_id is not null then
      insert into public.notifications (user_id, type, title, message, escrow_id)
      values (new.buyer_id, 'escrow_update', 'Escrow update', status_message, new.id);
    end if;
    if new.seller_id is not null and new.seller_id is distinct from new.buyer_id then
      insert into public.notifications (user_id, type, title, message, escrow_id)
      values (new.seller_id, 'escrow_update', 'Escrow update', status_message, new.id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists losoja_escrow_status_notification on public.escrow_transactions;
create trigger losoja_escrow_status_notification
after update of status on public.escrow_transactions
for each row execute function public.losoja_notify_escrow_status();

-- Notify the wallet owner when a transaction is recorded.
create or replace function public.losoja_notify_wallet_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  direction text;
  amount_text text;
begin
  if lower(coalesce(new.status, '')) in ('success', 'successful', 'completed', 'complete')
     and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    direction := case
      when lower(coalesce(new.type, '')) like '%credit%'
        or lower(coalesce(new.type, '')) like '%deposit%'
        or lower(coalesce(new.type, '')) like '%refund%'
        or lower(coalesce(new.type, '')) like '%release%' then 'credited'
      else 'debited'
    end;
    amount_text := '₦' || to_char(coalesce(new.amount, 0), 'FM999,999,999,990.00');
    insert into public.notifications (user_id, type, title, message)
    values (
      new.user_id,
      'wallet_update',
      'Wallet update',
      amount_text || ' ' || direction
    );
  end if;
  return new;
end;
$$;

drop trigger if exists losoja_wallet_transaction_notification on public.wallet_transactions;
create trigger losoja_wallet_transaction_notification
after insert or update of status on public.wallet_transactions
for each row execute function public.losoja_notify_wallet_transaction();

-- No order table exists in the supplied schema, so order-created notifications
-- are intentionally not wired in this migration. Shop-view notifications are
-- also omitted to avoid creating noisy events on every page visit.
