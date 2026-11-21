-- CornerMug bedroom access migration
-- Run once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
-- Safe to re-run: statements are idempotent where possible.

-- Personal bedroom records and invite keys
create table if not exists public.bedrooms (
  owner_id uuid primary key references public.users(id) on delete cascade,
  room_id text not null unique,
  invite_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bedrooms enable row level security;

-- No direct client reads/writes; access is mediated by security definer RPCs.
drop policy if exists "bedrooms_no_direct_select" on public.bedrooms;
-- (intentionally no policies: authenticated users cannot select/insert/update/delete directly)

-- Get or create the signed-in user's bedroom invite.
create or replace function public.get_or_create_bedroom_invite()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_room_id text;
  v_row public.bedrooms%rowtype;
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;

  v_room_id := 'bedroom-' || v_uid::text;

  insert into public.bedrooms (owner_id, room_id, invite_key, created_at, updated_at)
  values (
    v_uid,
    v_room_id,
    encode(gen_random_bytes(18), 'hex'),
    now(),
    now()
  )
  on conflict (owner_id) do update
    set room_id = excluded.room_id,
        updated_at = now()
  returning * into v_row;

  return jsonb_build_object(
    'room_id', v_row.room_id,
    'invite_key', v_row.invite_key
  );
end;
$$;

-- Check whether the signed-in user may enter a bedroom.
-- Owner access is allowed without invite key. Guests need a matching invite key.
create or replace function public.check_bedroom_access(p_room_id text, p_invite_key text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_row public.bedrooms%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('allowed', false, 'is_owner', false);
  end if;

  if coalesce(p_room_id, '') = '' or p_room_id not like 'bedroom-%' then
    return jsonb_build_object('allowed', false, 'is_owner', false);
  end if;

  v_owner := nullif(substring(p_room_id from 'bedroom-(.*)$'), '')::uuid;

  if v_owner = v_uid then
    return jsonb_build_object('allowed', true, 'is_owner', true);
  end if;

  select * into v_row from public.bedrooms where room_id = p_room_id;
  if not found then
    return jsonb_build_object('allowed', false, 'is_owner', false);
  end if;

  if p_invite_key is not null and length(btrim(p_invite_key)) > 0 and p_invite_key = v_row.invite_key then
    return jsonb_build_object('allowed', true, 'is_owner', false);
  end if;

  return jsonb_build_object('allowed', false, 'is_owner', false);
exception
  when others then
    return jsonb_build_object('allowed', false, 'is_owner', false);
end;
$$;

revoke all on function public.get_or_create_bedroom_invite() from public;
revoke all on function public.check_bedroom_access(text, text) from public;
grant execute on function public.get_or_create_bedroom_invite() to authenticated;
grant execute on function public.check_bedroom_access(text, text) to authenticated;
