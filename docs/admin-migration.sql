-- ---------------------------------------------------------------------------
-- CornerMug admin migration
-- Run once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
-- Safe to run more than once.
--
-- Adds:
--   * is_admin / is_owner flags
--   * owner-only role changes, renames, password reveal, grants
--   * protection so other admins cannot touch the owner account
--   * the refund terminal's server-side RPCs
-- ---------------------------------------------------------------------------

-- Flags ---------------------------------------------------------------------
alter table public.users add column if not exists is_admin boolean not null default false;
alter table public.users add column if not exists is_owner boolean not null default false;

-- Only one owner row can ever exist.
create unique index if not exists users_single_owner
  on public.users ((is_owner))
  where is_owner;

-- Helpers: security definer so RLS policies and triggers can use them.
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

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_owner from public.users where id = auth.uid()),
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

-- Account protection trigger ------------------------------------------------
-- Blocks direct REST/RPC edits that would let one admin damage another admin
-- or the owner. Direct SQL editor access has no JWT, so it bypasses this check.
create or replace function public.protect_user_accounts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor       uuid := auth.uid();
  v_actor_owner boolean;
begin
  if v_actor is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  v_actor_owner := public.is_owner();

  if tg_op = 'INSERT' then
    if (new.is_admin or new.is_owner) and not v_actor_owner then
      raise exception 'Only the owner can create admin accounts.';
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.is_owner then
      raise exception 'The owner account cannot be deleted.';
    end if;
    if old.is_admin and old.id <> v_actor and not v_actor_owner then
      raise exception 'Only the owner can remove another admin.';
    end if;
    return old;
  end if;

  if new.is_owner is distinct from old.is_owner then
    raise exception 'The owner flag cannot be changed.';
  end if;

  if old.is_owner and not new.is_admin then
    raise exception 'The owner account must stay an admin.';
  end if;

  if old.is_owner and old.id <> v_actor then
    raise exception 'The owner account can only be changed by the owner.';
  end if;

  if new.is_admin is distinct from old.is_admin and not v_actor_owner then
    raise exception 'Only the owner can change admin roles.';
  end if;

  if old.is_admin and not old.is_owner and old.id <> v_actor and not v_actor_owner then
    raise exception 'Only the owner can change another admin.';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_user_accounts on public.users;
create trigger protect_user_accounts
  before insert or update or delete on public.users
  for each row execute function public.protect_user_accounts();

-- Remove a player end to end: profile row + Supabase Auth account ----------
create or replace function public.admin_remove_user(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target public.users%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Only admins can remove users.';
  end if;
  if target_id = auth.uid() then
    raise exception 'You cannot remove your own account.';
  end if;

  select * into v_target from public.users where id = target_id;
  if not found then
    raise exception 'Player not found.';
  end if;

  if v_target.is_owner then
    raise exception 'The owner account cannot be removed.';
  end if;
  if v_target.is_admin and not public.is_owner() then
    raise exception 'Only the owner can remove another admin.';
  end if;

  delete from public.users where id = target_id;
  delete from auth.users where id = target_id;
end;
$$;

-- Promote / demote an admin. Owner only. ------------------------------------
create or replace function public.admin_set_role(target_id uuid, make_admin boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target public.users%rowtype;
begin
  if not public.is_owner() then
    raise exception 'Only the owner can change admin roles.';
  end if;

  select * into v_target from public.users where id = target_id;
  if not found then
    raise exception 'Player not found.';
  end if;
  if v_target.is_owner then
    raise exception 'The owner account cannot be changed here.';
  end if;

  update public.users
     set is_admin = coalesce(make_admin, false)
   where id = target_id;
end;
$$;

-- Rename a player. Admins may rename players; only the owner may rename admins.
create or replace function public.admin_rename_user(target_id uuid, new_username text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target public.users%rowtype;
  v_name   text := btrim(coalesce(new_username, ''));
begin
  if not public.is_admin() then
    raise exception 'Only admins can rename players.';
  end if;
  if char_length(v_name) < 3 or char_length(v_name) > 24 then
    raise exception 'Username must be 3 to 24 characters.';
  end if;

  select * into v_target from public.users where id = target_id;
  if not found then
    raise exception 'Player not found.';
  end if;

  if v_target.is_owner then
    raise exception 'The owner account cannot be renamed here.';
  end if;
  if v_target.is_admin and v_target.id <> auth.uid() and not public.is_owner() then
    raise exception 'Only the owner can rename another admin.';
  end if;

  update public.users set username = v_name where id = target_id;
end;
$$;

-- Reveal a stored sign-in password. Owner only. -----------------------------
create or replace function public.admin_get_password(target_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
begin
  if not public.is_owner() then
    raise exception 'Only the owner can view passwords.';
  end if;

  select user_key into v_key from public.users where id = target_id;
  if not found then
    raise exception 'Player not found.';
  end if;

  return v_key;
end;
$$;

-- Grant XP, money, or an item to any player. Admin only. --------------------
create or replace function public.admin_grant(
  target_id uuid,
  p_xp integer default 0,
  p_money integer default 0,
  p_item text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_xp        integer := least(greatest(coalesce(p_xp, 0), 0), 1000000);
  v_money     integer := least(greatest(coalesce(p_money, 0), 0), 1000000);
  v_item      text := nullif(btrim(coalesce(p_item, '')), '');
  v_row       public.users%rowtype;
  v_granted   text := null;
begin
  if not public.is_admin() then
    raise exception 'Only admins can grant rewards.';
  end if;

  select * into v_row from public.users where id = target_id for update;
  if not found then
    raise exception 'Player not found.';
  end if;

  if v_item is not null then
    if v_item = 'kitten'
       or v_item = 'dessert-cheesecake'
       or v_item = 'dessert-chocolate-cake'
       or v_item = 'dessert-strawberry-shortcake'
       or v_item = 'dessert-macarons'
       or v_item = 'dessert-croissant'
       or v_item = 'dessert-pancakes'
    then
      if not (v_item = any (v_row.owned_items)) then
        v_row.owned_items := array_append(v_row.owned_items, v_item);
        v_granted := v_item;
      end if;
    elsif v_item = 'money-250' then
      v_money := v_money + 250;
      v_granted := v_item;
    elsif v_item = 'money-600' then
      v_money := v_money + 600;
      v_granted := v_item;
    elsif v_item = 'money-1500' then
      v_money := v_money + 1500;
      v_granted := v_item;
    else
      raise exception 'Unknown item. Use kitten, money-250, money-600, money-1500, or dessert-cheesecake, dessert-chocolate-cake, dessert-strawberry-shortcake, dessert-macarons, dessert-croissant, dessert-pancakes.';
    end if;
  end if;

  update public.users
     set xp = xp + v_xp,
         money = money + v_money,
         owned_items = v_row.owned_items,
         last_seen_at = now()
   where id = target_id
  returning * into v_row;

  return jsonb_build_object(
    'username', v_row.username,
    'xp', v_row.xp,
    'money', v_row.money,
    'owned_items', to_jsonb(v_row.owned_items),
    'granted_xp', v_xp,
    'granted_money', v_money,
    'granted_item', v_granted
  );
end;
$$;

-- Remove XP, money, or an owned item from any player. Admin only. -----------
create or replace function public.admin_take(
  target_id uuid,
  p_xp integer default 0,
  p_money integer default 0,
  p_item text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_xp      integer := least(greatest(coalesce(p_xp, 0), 0), 1000000);
  v_money   integer := least(greatest(coalesce(p_money, 0), 0), 1000000);
  v_item    text := nullif(btrim(coalesce(p_item, '')), '');
  v_row     public.users%rowtype;
  v_taken   text := null;
  v_took_xp integer := 0;
  v_took_money integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Only admins can remove rewards.';
  end if;

  select * into v_row from public.users where id = target_id for update;
  if not found then
    raise exception 'Player not found.';
  end if;

  if v_item is not null then
    if v_item = 'kitten'
       or v_item = 'dessert-cheesecake'
       or v_item = 'dessert-chocolate-cake'
       or v_item = 'dessert-strawberry-shortcake'
       or v_item = 'dessert-macarons'
       or v_item = 'dessert-croissant'
       or v_item = 'dessert-pancakes'
    then
      if v_item = any (v_row.owned_items) then
        v_row.owned_items := array_remove(v_row.owned_items, v_item);
        v_taken := v_item;
      end if;
    elsif v_item in ('money-250', 'money-600', 'money-1500') then
      raise exception 'Money packs are not owned items. Use /take @user <amount> money.';
    else
      raise exception 'Unknown item. Use kitten or dessert-cheesecake, dessert-chocolate-cake, dessert-strawberry-shortcake, dessert-macarons, dessert-croissant, dessert-pancakes.';
    end if;
  end if;

  v_took_xp := least(v_xp, v_row.xp);
  v_took_money := least(v_money, v_row.money);

  update public.users
     set xp = greatest(0, xp - v_xp),
         money = greatest(0, money - v_money),
         owned_items = v_row.owned_items,
         last_seen_at = now()
   where id = target_id
  returning * into v_row;

  return jsonb_build_object(
    'username', v_row.username,
    'xp', v_row.xp,
    'money', v_row.money,
    'owned_items', to_jsonb(v_row.owned_items),
    'taken_xp', v_took_xp,
    'taken_money', v_took_money,
    'taken_item', v_taken
  );
end;
$$;

-- Permissions ---------------------------------------------------------------
revoke all on function public.is_admin() from public;
revoke all on function public.is_owner() from public;
revoke all on function public.admin_remove_user(uuid) from public;
revoke all on function public.admin_set_role(uuid, boolean) from public;
revoke all on function public.admin_rename_user(uuid, text) from public;
revoke all on function public.admin_get_password(uuid) from public;
revoke all on function public.admin_grant(uuid, integer, integer, text) from public;
revoke all on function public.admin_take(uuid, integer, integer, text) from public;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_owner() to authenticated;
grant execute on function public.admin_remove_user(uuid) to authenticated;
grant execute on function public.admin_set_role(uuid, boolean) to authenticated;
grant execute on function public.admin_rename_user(uuid, text) to authenticated;
grant execute on function public.admin_get_password(uuid) to authenticated;
grant execute on function public.admin_grant(uuid, integer, integer, text) to authenticated;
grant execute on function public.admin_take(uuid, integer, integer, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Set the owner. Replace the email if your account uses a different one.
-- The account must already have a public.users row (it is created at sign-up).
-- ---------------------------------------------------------------------------
update public.users
   set is_owner = true,
       is_admin = true
 where email = 'arthur.joseph.lawson@gmail.com';

-- Check it worked:
--   select username, email, is_admin, is_owner from public.users where is_owner;

-- ---------------------------------------------------------------------------
-- Lock down direct table access
-- ---------------------------------------------------------------------------
-- Only the RPCs above may change XP, money, owned items, or roles. Players can
-- still edit the fields the app writes directly: avatar, last seen, password.
revoke update on public.users from authenticated;
grant update (avatar_slug, last_seen_at, user_key) on public.users to authenticated;

-- Sign-up goes through register_profile(), so clients never insert rows.
revoke insert on public.users from authenticated;
revoke insert on public.users from anon;

-- Removal goes through admin_remove_user(), which checks the owner rules.
revoke delete on public.users from authenticated;

-- Passwords are readable only through admin_get_password() and only by the
-- owner. Without column grants, even an admin token cannot select user_key.
revoke select on public.users from authenticated;
revoke select on public.users from anon;
grant select (
  id, email, username, avatar_slug, is_admin, is_owner,
  last_seen_at, created_at, xp, money, owned_items
) on public.users to authenticated;
