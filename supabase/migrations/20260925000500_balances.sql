create table if not exists public.balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  currency char(3) not null,
  available numeric(18,2) not null default 0 check (available >= 0),
  pending numeric(18,2) not null default 0 check (pending >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, currency)
);

create index if not exists balances_user_id_idx on public.balances(user_id);
alter table public.balances enable row level security;
grant select, insert, update on table public.balances to authenticated;

drop policy if exists "Users can view their balances" on public.balances;
create policy "Users can view their balances"
  on public.balances for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their balances" on public.balances;
create policy "Users can create their balances"
  on public.balances for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their balances" on public.balances;
create policy "Users can update their balances"
  on public.balances for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
