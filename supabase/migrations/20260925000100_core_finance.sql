create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recipients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  country text,
  currency char(3) not null,
  account_identifier text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid references public.recipients(id) on delete set null,
  source_currency char(3) not null,
  target_currency char(3) not null,
  amount numeric(18,2) not null check (amount > 0),
  target_amount numeric(18,2) not null check (target_amount >= 0),
  fee numeric(18,2) not null default 0 check (fee >= 0),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists recipients_user_id_idx on public.recipients(user_id);
create index if not exists transfers_user_id_created_at_idx on public.transfers(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.recipients enable row level security;
alter table public.transfers enable row level security;

drop policy if exists "Users can view their profile" on public.profiles;
create policy "Users can view their profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Users can update their profile" on public.profiles;
create policy "Users can update their profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can view their recipients" on public.recipients;
create policy "Users can view their recipients" on public.recipients for select using (auth.uid() = user_id);
drop policy if exists "Users can create their recipients" on public.recipients;
create policy "Users can create their recipients" on public.recipients for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their recipients" on public.recipients;
create policy "Users can update their recipients" on public.recipients for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete their recipients" on public.recipients;
create policy "Users can delete their recipients" on public.recipients for delete using (auth.uid() = user_id);

drop policy if exists "Users can view their transfers" on public.transfers;
create policy "Users can view their transfers" on public.transfers for select using (auth.uid() = user_id);
drop policy if exists "Users can create their transfers" on public.transfers;
create policy "Users can create their transfers" on public.transfers for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their transfers" on public.transfers;
create policy "Users can update their transfers" on public.transfers for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
