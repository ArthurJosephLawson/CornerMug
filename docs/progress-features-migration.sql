-- CornerMug progress features migration
-- Run once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
-- Safe to re-run: every statement is idempotent.
--
-- Includes:
--   * progress columns
--   * hangout XP awards
--   * server-priced purchases/refunds (XP and money unlocks + money packs)
--   * laptop removal/refund migration (+500 XP once for owned laptop)

-- ---------------------------------------------------------------------------
-- 1. Progress columns
-- ---------------------------------------------------------------------------
alter table public.users add column if not exists xp integer not null default 0;
alter table public.users add column if not exists money integer not null default 0;
alter table public.users add column if not exists owned_items text[] not null default '{}';

alter table public.users drop constraint if exists users_xp_non_negative;
alter table public.users add constraint users_xp_non_negative check (xp >= 0);

alter table public.users drop constraint if exists users_money_non_negative;
alter table public.users add constraint users_money_non_negative check (money >= 0);

-- Mail subjects for the Info & Feedback page.
alter table public.feedback add column if not exists subject text;

-- Laptop removed from runtime: refund owned laptops once (+500 XP), idempotent.
update public.users
   set xp = xp + 500,
       owned_items = array_remove(owned_items, 'laptop'),
       last_seen_at = now()
 where 'laptop' = any (owned_items);

-- ---------------------------------------------------------------------------
-- 2. award_hangout: XP for time spent in rooms
-- ---------------------------------------------------------------------------
-- 12 XP per minute = 1 XP per 5 seconds. The server decides the amount so the
-- browser cannot claim arbitrary XP. Awarded time is capped at 10 minutes per
-- call as an abuse guard.
create or replace function public.award_hangout(p_seconds integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_seconds integer := greatest(0, least(coalesce(p_seconds, 0), 600));
  v_gained  integer := v_seconds / 5;
  v_row     public.users%rowtype;
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;

  update public.users
     set xp = xp + v_gained,
         last_seen_at = now()
   where id = v_uid
  returning * into v_row;

  if not found then
    raise exception 'Profile not found';
  end if;

  insert into public.user_stats (user_id, hangout_seconds, updated_at)
  values (v_uid, v_seconds, now())
  on conflict (user_id) do update
    set hangout_seconds = public.user_stats.hangout_seconds + excluded.hangout_seconds,
        updated_at = now();

  return jsonb_build_object(
    'xp', v_row.xp,
    'money', v_row.money,
    'owned_items', to_jsonb(v_row.owned_items),
    'gained', v_gained,
    'seconds', v_seconds
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. purchase_item: server-priced shop/menu
-- ---------------------------------------------------------------------------
-- kitten                    -> permanent unlock, 350 XP
-- dessert-cheesecake        -> permanent unlock, 200 money
-- dessert-chocolate-cake    -> permanent unlock, 200 money
-- dessert-strawberry-shortcake -> permanent unlock, 250 money
-- dessert-macarons          -> permanent unlock, 250 money
-- dessert-croissant         -> permanent unlock, 150 money
-- dessert-pancakes          -> permanent unlock, 150 money
-- money-250                 -> +250 money for 100 XP
-- money-600                 -> +600 money for 200 XP
-- money-1500                -> +1500 money for 450 XP
create or replace function public.purchase_item(p_item text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_price     integer := 0;
  v_amount    integer := 0;
  v_kind      text; -- xp_unlock | money_unlock | money_pack
  v_currency  text; -- xp | money
  v_row       public.users%rowtype;
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;

  if p_item = 'kitten' then
    v_price := 350; v_kind := 'xp_unlock'; v_currency := 'xp';
  elsif p_item = 'dessert-cheesecake' then
    v_price := 200; v_kind := 'money_unlock'; v_currency := 'money';
  elsif p_item = 'dessert-chocolate-cake' then
    v_price := 200; v_kind := 'money_unlock'; v_currency := 'money';
  elsif p_item = 'dessert-strawberry-shortcake' then
    v_price := 250; v_kind := 'money_unlock'; v_currency := 'money';
  elsif p_item = 'dessert-macarons' then
    v_price := 250; v_kind := 'money_unlock'; v_currency := 'money';
  elsif p_item = 'dessert-croissant' then
    v_price := 150; v_kind := 'money_unlock'; v_currency := 'money';
  elsif p_item = 'dessert-pancakes' then
    v_price := 150; v_kind := 'money_unlock'; v_currency := 'money';
  elsif p_item = 'money-250' then
    v_price := 100; v_amount := 250; v_kind := 'money_pack'; v_currency := 'xp';
  elsif p_item = 'money-600' then
    v_price := 200; v_amount := 600; v_kind := 'money_pack'; v_currency := 'xp';
  elsif p_item = 'money-1500' then
    v_price := 450; v_amount := 1500; v_kind := 'money_pack'; v_currency := 'xp';
  else
    raise exception 'Unknown item';
  end if;

  select * into v_row from public.users where id = v_uid for update;
  if not found then
    raise exception 'Profile not found';
  end if;

  if v_kind in ('xp_unlock', 'money_unlock') and p_item = any (v_row.owned_items) then
    return jsonb_build_object(
      'xp', v_row.xp,
      'money', v_row.money,
      'owned_items', to_jsonb(v_row.owned_items),
      'spent', 0,
      'already_owned', true,
      'currency', v_currency
    );
  end if;

  if v_kind = 'xp_unlock' then
    if v_row.xp < v_price then raise exception 'Not enough XP'; end if;
    update public.users
       set xp = xp - v_price,
           owned_items = array_append(owned_items, p_item),
           last_seen_at = now()
     where id = v_uid
    returning * into v_row;
  elsif v_kind = 'money_unlock' then
    if v_row.money < v_price then raise exception 'Not enough money'; end if;
    update public.users
       set money = money - v_price,
           owned_items = array_append(owned_items, p_item),
           last_seen_at = now()
     where id = v_uid
    returning * into v_row;
  else
    if v_row.xp < v_price then raise exception 'Not enough XP'; end if;
    update public.users
       set xp = xp - v_price,
           money = money + v_amount,
           last_seen_at = now()
     where id = v_uid
    returning * into v_row;
  end if;

  return jsonb_build_object(
    'xp', v_row.xp,
    'money', v_row.money,
    'owned_items', to_jsonb(v_row.owned_items),
    'spent', v_price,
    'already_owned', false,
    'currency', v_currency
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. refund_item: return purchases (XP/money depending on item type)
-- ---------------------------------------------------------------------------
-- XP unlocks (kitten)      -> remove item, refund XP.
-- Money unlocks (desserts) -> remove item, refund money.
-- Money packs              -> deduct money, refund XP.
-- Buy/refund is net-neutral so it cannot mint value.
create or replace function public.refund_item(p_item text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_price    integer := 0;
  v_amount   integer := 0;
  v_kind     text; -- xp_unlock | money_unlock | money_pack
  v_row      public.users%rowtype;
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;

  if p_item = 'kitten' then
    v_price := 350; v_kind := 'xp_unlock';
  elsif p_item = 'dessert-cheesecake' then
    v_price := 200; v_kind := 'money_unlock';
  elsif p_item = 'dessert-chocolate-cake' then
    v_price := 200; v_kind := 'money_unlock';
  elsif p_item = 'dessert-strawberry-shortcake' then
    v_price := 250; v_kind := 'money_unlock';
  elsif p_item = 'dessert-macarons' then
    v_price := 250; v_kind := 'money_unlock';
  elsif p_item = 'dessert-croissant' then
    v_price := 150; v_kind := 'money_unlock';
  elsif p_item = 'dessert-pancakes' then
    v_price := 150; v_kind := 'money_unlock';
  elsif p_item = 'money-250' then
    v_price := 100; v_amount := 250; v_kind := 'money_pack';
  elsif p_item = 'money-600' then
    v_price := 200; v_amount := 600; v_kind := 'money_pack';
  elsif p_item = 'money-1500' then
    v_price := 450; v_amount := 1500; v_kind := 'money_pack';
  else
    raise exception 'Unknown item';
  end if;

  select * into v_row from public.users where id = v_uid for update;
  if not found then
    raise exception 'Profile not found';
  end if;

  if v_kind = 'xp_unlock' then
    if not (p_item = any (v_row.owned_items)) then
      raise exception 'You do not own that item';
    end if;
    update public.users
       set xp = xp + v_price,
           owned_items = array_remove(owned_items, p_item),
           last_seen_at = now()
     where id = v_uid
    returning * into v_row;
    return jsonb_build_object(
      'xp', v_row.xp,
      'money', v_row.money,
      'owned_items', to_jsonb(v_row.owned_items),
      'refunded', v_price,
      'refunded_money', 0,
      'deducted_money', 0,
      'item', p_item
    );
  elsif v_kind = 'money_unlock' then
    if not (p_item = any (v_row.owned_items)) then
      raise exception 'You do not own that item';
    end if;
    update public.users
       set money = money + v_price,
           owned_items = array_remove(owned_items, p_item),
           last_seen_at = now()
     where id = v_uid
    returning * into v_row;
    return jsonb_build_object(
      'xp', v_row.xp,
      'money', v_row.money,
      'owned_items', to_jsonb(v_row.owned_items),
      'refunded', 0,
      'refunded_money', v_price,
      'deducted_money', 0,
      'item', p_item
    );
  else
    if v_row.money < v_amount then
      raise exception 'You need % money to refund this pack', v_amount;
    end if;
    update public.users
       set xp = xp + v_price,
           money = money - v_amount,
           last_seen_at = now()
     where id = v_uid
    returning * into v_row;
    return jsonb_build_object(
      'xp', v_row.xp,
      'money', v_row.money,
      'owned_items', to_jsonb(v_row.owned_items),
      'refunded', v_price,
      'refunded_money', 0,
      'deducted_money', v_amount,
      'item', p_item
    );
  end if;
end;
$$;

-- Only signed-in players may call these, and only as themselves (auth.uid()).
revoke all on function public.award_hangout(integer) from public;
revoke all on function public.purchase_item(text) from public;
revoke all on function public.refund_item(text) from public;
grant execute on function public.award_hangout(integer) to authenticated;
grant execute on function public.purchase_item(text) to authenticated;
grant execute on function public.refund_item(text) to authenticated;
