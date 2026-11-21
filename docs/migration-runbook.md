# CornerMug migration runbook (asset maps, NPC menu, progression, bedroom)

Run these in the **Supabase SQL editor** (Dashboard → SQL Editor → New query) in order.
All scripts are designed to be safe to re-run, but review your project before applying.

## Prerequisites
- Base app schema already applied (`users`, `user_stats`, `feedback`, `rooms`, auth setup, etc.).
- Signed-in app uses Supabase Auth; RPCs rely on `auth.uid()`.

## Run order
1. **`docs/progress-features-migration.sql`**
   - Progress columns/constraints, mail subject column
   - Laptop removal migration: refunds +500 XP once for any owned `laptop` and removes it
   - Hangout XP awards + daily activity tracking (`user_activity_daily`, `get_daily_activity`)
   - Shop/menu purchases and refunds (kitten XP unlock, dessert money unlocks, money packs)
   - Focus completion XP (`award_focus_session`, +500 XP, updates focus stats)
2. **`docs/admin-migration.sql`**
   - Admin/owner flags, policies, protections, and admin RPCs
   - Updated `admin_grant` item catalog (no laptop; includes dessert unlock IDs)
   - Added `admin_take` RPC for removing XP, money, or owned items
   - Column/table permission lockdowns for progress/admin fields
   - Sets owner for `arthur.joseph.lawson@gmail.com` (adjust if needed)
3. **`docs/bedroom-access-migration.sql`**
   - Personal bedroom records and invite keys
   - `get_or_create_bedroom_invite()` and `check_bedroom_access()` RPCs

## Post-run checks
- Progress/shop:
  - `select proname from pg_proc where proname in ('award_hangout','purchase_item','refund_item','award_focus_session','get_daily_activity');`
  - `select count(*) from users where 'laptop' = any(owned_items);` → should be `0`
- Admin:
  - `select username, is_admin, is_owner from public.users where is_owner;`
  - `select proname from pg_proc where proname in ('admin_grant','admin_take');`
- Bedroom:
  - `select to_regclass('public.bedrooms');`
  - `select proname from pg_proc where proname in ('get_or_create_bedroom_invite','check_bedroom_access');`

## Notes
- Activity chart tracks daily hangout time from now (UTC day buckets).
- Dessert unlocks cost money and refund money; XP unlocks/money packs follow server rules in `progress-features-migration.sql`.
- Bedroom invite links include a secret invite key; access is enforced by `check_bedroom_access` before room use.
- Existing migrations in repo (e.g. `friends-migration.sql`, `create-admin-account.sql`, `database-schema.sql`) are unchanged by this runbook unless separately required.
