grant update on table public.recipients to authenticated;

drop policy if exists "Users can update their recipients" on public.recipients;
create policy "Users can update their recipients"
  on public.recipients
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
