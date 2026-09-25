create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  holder_name text not null,
  bank_name text not null,
  country text not null,
  currency char(3) not null,
  account_identifier text not null,
  created_at timestamptz not null default now()
);

create index if not exists bank_accounts_user_id_idx on public.bank_accounts(user_id);

alter table public.bank_accounts enable row level security;

drop policy if exists "Users can view their bank accounts" on public.bank_accounts;
create policy "Users can view their bank accounts" on public.bank_accounts
  for select using (auth.uid() = user_id);

drop policy if exists "Users can create their bank accounts" on public.bank_accounts;
create policy "Users can create their bank accounts" on public.bank_accounts
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their bank accounts" on public.bank_accounts;
create policy "Users can update their bank accounts" on public.bank_accounts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete their bank accounts" on public.bank_accounts;
create policy "Users can delete their bank accounts" on public.bank_accounts
  for delete using (auth.uid() = user_id);
