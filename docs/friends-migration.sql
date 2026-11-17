-- ---------------------------------------------------------------------------
-- CornerMug friends migration: friend requests + recommendations
-- Run once in the Supabase SQL editor. Safe to run more than once.
-- ---------------------------------------------------------------------------

-- 1. Requests: 'pending' until the other side accepts.
alter table public.friends add column if not exists status text not null default 'accepted';

alter table public.friends drop constraint if exists friends_status_check;
alter table public.friends add constraint friends_status_check
  check (status in ('pending', 'accepted'));

-- 2. The receiver can accept a request (update their incoming row).
drop policy if exists "friends_respond" on public.friends;
create policy "friends_respond"
  on public.friends for update
  to authenticated
  using (friend_id = auth.uid())
  with check (friend_id = auth.uid());

-- 3. Both sides can remove a friendship or decline a request.
drop policy if exists "friends_delete_own" on public.friends;
drop policy if exists "friends_delete_involved" on public.friends;
create policy "friends_delete_involved"
  on public.friends for delete
  to authenticated
  using (user_id = auth.uid() or friend_id = auth.uid());

-- 4. Room owners can delete their own rooms (cleanup of old private rooms).
drop policy if exists "rooms_delete_owner" on public.rooms;
create policy "rooms_delete_owner"
  on public.rooms for delete
  to authenticated
  using (owner_id = auth.uid());

-- 5. Existing friendships stay valid: they default to 'accepted'.
