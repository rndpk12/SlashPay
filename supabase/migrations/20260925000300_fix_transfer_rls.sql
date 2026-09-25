-- Ensure transfers can be created and returned for the signed-in user.
alter table public.transfers enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on table public.transfers to authenticated;
grant select, insert on table public.recipients to authenticated;

alter table public.recipients enable row level security;

drop policy if exists "Users can view their recipients" on public.recipients;
create policy "Users can view their recipients"
  on public.recipients
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their recipients" on public.recipients;
create policy "Users can create their recipients"
  on public.recipients
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can view their transfers" on public.transfers;
create policy "Users can view their transfers"
  on public.transfers
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their transfers" on public.transfers;
create policy "Users can create their transfers"
  on public.transfers
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their transfers" on public.transfers;
create policy "Users can update their transfers"
  on public.transfers
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
