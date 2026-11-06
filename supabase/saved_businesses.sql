-- Run once in the Supabase SQL Editor if public.saved_businesses does not already exist.
create table if not exists public.saved_businesses (
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, business_id)
);
alter table public.saved_businesses enable row level security;
grant select, insert, delete on public.saved_businesses to authenticated;
drop policy if exists "Users can view their own saved businesses" on public.saved_businesses;
create policy "Users can view their own saved businesses"
  on public.saved_businesses for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "Users can save their own businesses" on public.saved_businesses;
create policy "Users can save their own businesses"
  on public.saved_businesses for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "Users can remove their own saved businesses" on public.saved_businesses;
create policy "Users can remove their own saved businesses"
  on public.saved_businesses for delete to authenticated
  using ((select auth.uid()) = user_id);
