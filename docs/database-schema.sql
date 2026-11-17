-- CornerMug database schema
-- Target: PostgreSQL 15+ (Supabase)
-- Run once in the Supabase SQL editor. RLS is enabled on every table.

create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  email         citext not null unique,
  username      text not null unique check (char_length(username) between 3 and 24),
  user_key      text not null unique check (char_length(user_key) between 8 and 32),
  avatar_slug   text not null default 'resident',
  last_seen_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

alter table public.users enable row level security;

-- Public profile fields are readable by any signed-in user so friends lists can
-- show usernames without exposing emails.
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
  on public.users for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own"
  on public.users for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
  on public.users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- rooms
-- ---------------------------------------------------------------------------
create table if not exists public.rooms (
  id          text primary key,
  name        text not null,
  is_public   boolean not null default false,
  room_key    text unique,
  owner_id    uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.rooms enable row level security;

drop policy if exists "rooms_select_all" on public.rooms;
create policy "rooms_select_all"
  on public.rooms for select
  to authenticated
  using (true);

drop policy if exists "rooms_insert_own" on public.rooms;
create policy "rooms_insert_own"
  on public.rooms for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "rooms_update_owner" on public.rooms;
create policy "rooms_update_owner"
  on public.rooms for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "rooms_delete_owner" on public.rooms;
create policy "rooms_delete_owner"
  on public.rooms for delete
  to authenticated
  using (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- friends
-- ---------------------------------------------------------------------------
create table if not exists public.friends (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  friend_id   uuid not null references public.users(id) on delete cascade,
  status      text not null default 'accepted' check (status in ('pending', 'accepted')),
  created_at  timestamptz not null default now(),
  unique (user_id, friend_id),
  check (user_id <> friend_id)
);

alter table public.friends enable row level security;

drop policy if exists "friends_select_involved" on public.friends;
create policy "friends_select_involved"
  on public.friends for select
  to authenticated
  using (user_id = auth.uid() or friend_id = auth.uid());

drop policy if exists "friends_insert_own" on public.friends;
create policy "friends_insert_own"
  on public.friends for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "friends_respond" on public.friends;
create policy "friends_respond"
  on public.friends for update
  to authenticated
  using (friend_id = auth.uid())
  with check (friend_id = auth.uid());

drop policy if exists "friends_delete_own" on public.friends;
drop policy if exists "friends_delete_involved" on public.friends;
create policy "friends_delete_involved"
  on public.friends for delete
  to authenticated
  using (user_id = auth.uid() or friend_id = auth.uid());

-- ---------------------------------------------------------------------------
-- feedback
-- ---------------------------------------------------------------------------
create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete set null,
  category    text not null default 'general'
              check (category in ('bug', 'feature', 'review', 'general')),
  message     text not null check (char_length(message) between 1 and 2000),
  created_at  timestamptz not null default now()
);

alter table public.feedback enable row level security;

drop policy if exists "feedback_select_own" on public.feedback;
create policy "feedback_select_own"
  on public.feedback for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "feedback_insert_own" on public.feedback;
create policy "feedback_insert_own"
  on public.feedback for insert
  to authenticated
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- user_stats (pomodoro focus minutes + hangout seconds)
-- ---------------------------------------------------------------------------
create table if not exists public.user_stats (
  user_id             uuid primary key references public.users(id) on delete cascade,
  focus_minutes       integer not null default 0,
  hangout_seconds     integer not null default 0,
  sessions_completed  integer not null default 0,
  updated_at          timestamptz not null default now()
);

alter table public.user_stats enable row level security;

drop policy if exists "user_stats_select_own" on public.user_stats;
create policy "user_stats_select_own"
  on public.user_stats for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "user_stats_insert_own" on public.user_stats;
create policy "user_stats_insert_own"
  on public.user_stats for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "user_stats_update_own" on public.user_stats;
create policy "user_stats_update_own"
  on public.user_stats for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Helpful indexes
create index if not exists friends_user_idx on public.friends (user_id);
create index if not exists friends_friend_idx on public.friends (friend_id);
create index if not exists feedback_user_idx on public.feedback (user_id);
create index if not exists rooms_public_idx on public.rooms (is_public) where is_public;

-- ---------------------------------------------------------------------------
-- Public profiles view
-- Exposes only username/avatar/last_seen so friend lists can render other
-- players without leaking email addresses or user keys. The view runs with
-- the owner's privileges, so it intentionally bypasses the users RLS policy.
-- ---------------------------------------------------------------------------
create or replace view public.profiles as
select id, username, avatar_slug, last_seen_at
from public.users;

grant select on public.profiles to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Registration helper
-- Runs as the function owner so a freshly created Supabase Auth user can insert
-- its own profile row before the client session is available. Unique violations
-- on username/user_key/email surface to the caller as normal errors.
-- ---------------------------------------------------------------------------
create or replace function public.register_profile(
  p_id uuid,
  p_email text,
  p_username text,
  p_avatar_slug text,
  p_user_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, username, avatar_slug, user_key)
  values (p_id, p_email, p_username, p_avatar_slug, p_user_key);
end;
$$;

grant execute on function public.register_profile(uuid, text, text, text, text) to anon, authenticated;

-- NOTE: CornerMug signs users up with their generated User Key as the Supabase
-- Auth password (password = user key). If Supabase's "Confirm email" setting is
-- enabled, new accounts cannot sign in until they click the confirmation link.
-- For frictionless local play, disable it under Authentication > Sign In / Providers.

-- ---------------------------------------------------------------------------
-- Admin support (see docs/admin-migration.sql for the standalone version)
-- ---------------------------------------------------------------------------
alter table public.users add column if not exists is_admin boolean not null default false;

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
