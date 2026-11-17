-- ---------------------------------------------------------------------------
-- CornerMug: create the admin account directly (bypasses signup rate limits)
--
-- RUN THIS FIRST: docs/admin-migration.sql (adds the is_admin column).
-- Then run this whole file in the Supabase SQL editor. Safe to run twice.
--
-- Email:    your-email@example.com
-- Username: YourAdminName
-- User Key: YOUR-USER-KEY   <-- this is the sign-in password. Save it.
-- ---------------------------------------------------------------------------

create extension if not exists pgcrypto;

-- 1. Remove any leftover rows for this email or username (idempotent re-runs)
delete from public.users where email = 'your-email@example.com';
delete from public.users where username = 'YourAdminName';
delete from auth.users where email = 'your-email@example.com';

-- 2. Create the Supabase Auth account (password = the User Key)
insert into auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone, phone_change, phone_change_token,
  reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'your-email@example.com',
  crypt('YOUR-USER-KEY', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  '', '', '', '', '', '', '', '', ''
where not exists (
  select 1 from auth.users where email = 'your-email@example.com'
);

-- 3. Give the account an email identity (needed for password sign-in)
-- This project's auth.identities: provider is a plain column, email is generated.
insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
select
  u.id,
  u.id,
  'email',
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true
  ),
  'email',
  now(), now(), now()
from auth.users u
where u.email = 'your-email@example.com'
  and not exists (
    select 1 from auth.identities i where i.user_id = u.id and i.provider_id = 'email'
  );

-- 4. Create the profile row with admin rights
insert into public.users (id, email, username, user_key, avatar_slug, is_admin)
select
  u.id,
  u.email,
  'YourAdminName',
  'YOUR-USER-KEY',
  'resident',
  true
from auth.users u
where u.email = 'your-email@example.com'
  and not exists (
    select 1 from public.users p where p.id = u.id
  );

-- 5. Confirm everything landed (should return one row, is_admin = true)
select
  u.email,
  (select p.username from public.users p where p.id = u.id) as username,
  (select p.user_key  from public.users p where p.id = u.id) as user_key,
  (select p.is_admin  from public.users p where p.id = u.id) as is_admin
from auth.users u
where u.email = 'your-email@example.com';
