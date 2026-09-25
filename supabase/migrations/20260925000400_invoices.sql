create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null,
  customer_email text,
  amount numeric(18,2) not null check (amount >= 0),
  currency char(3) not null default 'USD',
  due_date date,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_user_id_created_at_idx
  on public.invoices(user_id, created_at desc);

alter table public.invoices enable row level security;
grant select, insert, update, delete on table public.invoices to authenticated;

drop policy if exists "Users can view their invoices" on public.invoices;
create policy "Users can view their invoices"
  on public.invoices for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their invoices" on public.invoices;
create policy "Users can create their invoices"
  on public.invoices for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their invoices" on public.invoices;
create policy "Users can update their invoices"
  on public.invoices for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their invoices" on public.invoices;
create policy "Users can delete their invoices"
  on public.invoices for delete to authenticated
  using ((select auth.uid()) = user_id);
