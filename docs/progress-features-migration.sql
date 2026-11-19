-- CornerMug progress features migration
-- Run once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
-- Safe to re-run: every statement is idempotent.

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
-- 3. purchase_item: server-priced shop
-- ---------------------------------------------------------------------------
-- laptop      -> permanent unlock, 500 XP
-- kitten      -> permanent unlock, 350 XP
-- money-250   -> +250 money for 100 XP
-- money-600   -> +600 money for 200 XP
-- money-1500  -> +1500 money for 450 XP
create or replace function public.purchase_item(p_item text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_price  integer;
  v_amount integer := 0;
  v_unlock boolean := false;
  v_row    public.users%rowtype;
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;

  if p_item = 'laptop' then
    v_price := 500;
    v_unlock := true;
  elsif p_item = 'kitten' then
    v_price := 350;
    v_unlock := true;
  elsif p_item = 'money-250' then
    v_price := 100;
    v_amount := 250;
  elsif p_item = 'money-600' then
    v_price := 200;
    v_amount := 600;
  elsif p_item = 'money-1500' then
    v_price := 450;
    v_amount := 1500;
  else
    raise exception 'Unknown item';
  end if;

  select * into v_row from public.users where id = v_uid for update;
  if not found then
    raise exception 'Profile not found';
  end if;

  if v_unlock and p_item = any (v_row.owned_items) then
    return jsonb_build_object(
      'xp', v_row.xp,
      'money', v_row.money,
      'owned_items', to_jsonb(v_row.owned_items),
      'spent', 0,
      'already_owned', true
    );
  end if;

  if v_row.xp < v_price then
    raise exception 'Not enough XP';
  end if;

  if v_unlock then
    update public.users
       set xp = xp - v_price,
           owned_items = array_append(owned_items, p_item),
           last_seen_at = now()
     where id = v_uid
    returning * into v_row;
  else
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
    'already_owned', false
  );
end;
$$;

-- Only signed-in players may call these, and only as themselves (auth.uid()).
revoke all on function public.award_hangout(integer) from public;
revoke all on function public.purchase_item(text) from public;
grant execute on function public.award_hangout(integer) to authenticated;
grant execute on function public.purchase_item(text) to authenticated;
