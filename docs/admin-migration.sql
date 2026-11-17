-- ---------------------------------------------------------------------------
-- CornerMug admin migration
-- Run once in the Supabase SQL editor. Safe to run more than once.
-- ---------------------------------------------------------------------------

-- Admin flag on users -------------------------------------------------------
alter table public.users add column if not exists is_admin boolean not null default false;

-- Helper: is the caller an admin? Security definer so RLS policies can use it.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.users where id = auth.uid()),
    false
  );
$$;

-- Admin policies on users ---------------------------------------------------
drop policy if exists "users_admin_select" on public.users;
create policy "users_admin_select"
  on public.users for select
  to authenticated
  using (public.is_admin());

drop policy if exists "users_admin_update" on public.users;
create policy "users_admin_update"
  on public.users for update
  to authenticated
  using (public.is_admin())
  with check (true);

drop policy if exists "users_admin_delete" on public.users;
create policy "users_admin_delete"
  on public.users for delete
  to authenticated
  using (public.is_admin());

-- Remove a player end to end: profile row + Supabase Auth account. ----------
create or replace function public.admin_remove_user(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can remove users.';
  end if;
  if target_id = auth.uid() then
    raise exception 'Admins cannot remove their own account here.';
  end if;

  delete from public.users where id = target_id;
  delete from auth.users where id = target_id;
end;
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_remove_user(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Promote your admin AFTER signing up with this email:
--   update public.users set is_admin = true where email = 'your-email@example.com';
-- Check it worked:
--   select username, is_admin from public.users where email = 'your-email@example.com';
-- ---------------------------------------------------------------------------
