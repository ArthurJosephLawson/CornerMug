# Asset Maps, NPC Menu, Dark Mode, and Progression Update — Design Spec

**Date:** 2026-11-21  
**Status:** Draft for review (implementation not started)  
**Scope:** Architectural (multiple subsystems: rooms/engine/assets, NPC/menu/shop, progression, charting, access control, theming, migrations)

## 1. Summary

Integrate uploaded `Added_assets` packs into CornerMug by adding new playable rooms, enriching Café, adding stationary cook NPCs with a speech-bubble money menu, expanding shop/menu unlocks, awarding 500 XP per completed focus session, adding a 7-day active-time chart, adding a personal bedroom room with invite-based access, removing the laptop feature with refund migration, and adding site-wide dark mode with no gradients.

Only assets already in `public/sprites` and `Added_assets/` may be used. No unapproved assets or features.

## 2. Confirmed decisions

- **Approach:** 1 — extend room/asset system for external/custom props, tiles, and entities; keep existing rooms working.
- **Maps/rooms:**
  - **Café (public, enriched):** keep current layout base; add selected FoodDrink café/dessert fixtures/props; add Cook NPC.
  - **Bar (public, new):** built from FoodDrink `BarFixtures`, `BarProps`, `Architecture`.
  - **Restaurant (public, new):** built from FoodDrink `RestaurantFixtures`, `RestaurantProps`, `Architecture`.
  - **My Room / Bedroom (personal, new):** one per player, built from `Pixel_16_interiors_v2_free/tiles and items.png`, fixed decorated layout, no NPC, no furniture move/save this update.
- **NPC/menu:** Cook NPC in Café, Bar, Restaurant. Walk near + **E** (desktop) or tap interact (mobile) opens/closes a **speech-bubble menu** anchored to NPC. Same menu in all three. Interacting/opening/closing must not remove player progress.
- **Menu currency:** menu purchases use **money**. Money packs unchanged (buy with XP, grant money).
- **Shop/menu items (approved):**
  - Remove: **Laptop** (shop, room behavior, input, grants, docs refs, assets/credits as applicable).
  - Keep: **Kitten** — 350 XP, unlock (Shop).
  - Add unlocks (money, shown in Shop and Café menu): Cheesecake Treat `Dessert_Icons/Cheesecake.png` 200 money; Chocolate Cake `Dessert_Icons/ChocolateCake.png` 200 money; Strawberry Shortcake `Dessert_Icons/StrawberryShortcake.png` 250 money; Macarons `Dessert_Icons/Macrons.png` 250 money; Croissant `Dessert_Icons/Croissant.png` 150 money; Pancakes `Dessert_Icons/Pancakes.png` 150 money.
  - Keep money packs: Pocket money 100 XP→250, Coin jar 200 XP→600, Savings tin 450 XP→1500.
- **XP/progression:**
  - +**500 XP** on each completed **focus/work** session only (not breaks), awarded via server-side RPC at completion. Existing hangout/time XP (`award_hangout`) unchanged.
  - Laptop auto-refund: if `laptop` owned, remove from `owned_items` and credit **+500 XP** once via migration/RPC logic; if never bought, no refund.
- **Activity chart:** Dashboard card, last **7 days**, daily active/hangout time, **green line** (solid, no gradient). Track per-day from now (new storage/RPC/migration); prior days unavailable/zero.
- **Bedroom access:** owner-only entry. **Invite** button top-right in room copies shareable invite link/key so invited players can join. Furniture moving/saving deferred.
- **Theme:** Settings toggle Light/Dark, saved in local settings storage, default Light, site-wide, **no gradients** anywhere in UI.
- **Constraint:** no unapproved assets or features. Prop/placement choices within approved packs are implementation details and may be adjusted on feedback.

## 3. Assets and integration

### 3.1 Source packs (approved)

- `Added_assets/extracted/Dessert_Icons/*.png` (+ plates only if needed; none planned) — menu/shop item art.
- `Added_assets/extracted/Food&Drink2DMegaPropsPack_v1.0/` — `Tiles/*`, `TileMap/*`, docs/preview for reference; use individual PNGs and/or tilesheet data as needed.
- `Added_assets/extracted/Pixel_16_interiors_v2_free/tiles and items.png` — bedroom room source.
- `Added_assets/extracted/Free pack/*` cats — available but not used unless explicitly approved later (current kitten remains).
- Existing `public/sprites/*` and character assets.

### 3.2 Runtime placement

- Copy required approved runtime files into `public/assets/added/` (or equivalent organized paths) and reference by URL/path. Keep originals in `Added_assets` untouched.
- Update credits (`public/sprites/credits.txt` and any in-app credits/docs) for FoodDrink, Dessert Icons, Pixel_16_interiors, and any actually used cat assets; remove laptop credit if unused.

### 3.3 Engine/room extensions

- **Custom props:** support props defined by image path + position + draw dimensions + anchor/pivot (bottom-center/contact default where possible) + optional collision box override, independent of the legacy 64x64 manifest prop cell where needed.
- **Custom tiles/floors/walls:** support room backgrounds/floor-wall rendering from image(s) or tiled patterns sourced from approved packs (including Pixel interiors sheet regions or FoodDrink architecture tiles) while preserving existing `TileRenderer` behavior for current rooms.
- **Entities:** add static room entities (NPCs) with character slug/sheet, world position, facing, interaction radius, label, and action type (`menu`). Render in depth order with props/avatars; exclude from networked peer movement.
- **Room definitions:** extend config/types (`RoomDefinition`, related types) to declare custom assets, entities, and metadata (public/personal, access rules hint) without breaking `resolveRoomDefinition` for existing/private-key rooms.

## 4. Rooms and layouts

### 4.1 Café (enriched)

- Preserve base Café geometry/spawn/seats/flow where practical; layer approved FoodDrink café fixtures/props and dessert decor (examples: `cake_display_case_curved`, `menu_board_easel_blank`, `espresso/grinder` alternatives only if consistent with existing look, `donut_tray`, `cake_plate_slice`, `sugar_creamer_pair`, `takeaway_cups_stack`, `string_lights_warm_segment`, plants/lamps as fitting). Select items that do not obscure navigation/seats.
- Cook NPC placed near counter, facing room, interactable.

### 4.2 Bar (new public)

- New public room id/name (e.g. `public-bar`, “Bar”) with spawn, seats, collision, and themed layout from FoodDrink Bar/Architecture assets (counter, stools/tables, shelves/taps/bottles/glasses/decor, appropriate floor/wall). Occupancy via existing room occupancy/channel model.
- Cook NPC with same menu.

### 4.3 Restaurant (new public)

- New public room id/name (e.g. `public-restaurant`, “Restaurant”) from FoodDrink Restaurant/Architecture assets (dining tables/chairs, service elements, decor, floor/wall). Seats placed at dining furniture where sensible.
- Cook NPC with same menu.

### 4.4 Bedroom / My Room (personal)

- New personal room type/id per user (e.g. `bedroom-<userId>` or equivalent stable mapping) named “My Room”.
- Layout composed from `Pixel_16_interiors_v2_free/tiles and items.png` (approved). Fixed furniture/decor and collision; spawn inside room. No seats/NPC required unless naturally present in fixed layout.
- Dashboard entry: “My Room” button/card navigates to the owner’s bedroom route.
- **Invite:** in-room top-right button copies invite URL/key for others to request/join access. UI shows success toast.
- **Access control (important):**
  - Owner: always allowed.
  - Others: allowed only with valid invite credential for that bedroom.
  - Implementation target: persist bedroom ownership and invite secret/key (room row/metadata and/or dedicated table/column) with RLS/policies and server-side checks (RPC or guarded join endpoint/data) so unauthorized users cannot obtain access by guessing ids alone. Realtime channel subscription/join must be gated by the same authorization outcome in app logic and, where feasible, by backend checks. Document any residual limitation if full server-enforced Realtime ACL is not available with current setup.
  - Invites are shareable copies as requested; rotation/regeneration is optional but recommended if cheap to add (only if treated as implementation detail, not a new feature).

## 5. Menu and purchases

### 5.1 Speech-bubble menu UI

- DOM overlay component anchored to NPC world position projected to screen; updates position while open (camera/player movement) or repositions on open with acceptable behavior.
- Contents: 6 approved dessert unlocks with icon, name, money price, owned/affordable state, Buy button, close affordance.
- Works in Café/Bar/Restaurant with identical data/pricing.
- Mobile: interact button/prompt opens menu; layout fits small screens.

### 5.2 Purchase rules

- Money-priced unlocks: deduct money, add item id to `owned_items` if not owned, return updated snapshot. Server-priced/validated RPC (extend `purchase_item` semantics or add dedicated RPC, e.g. `purchase_unlock_money` / unified catalog) to prevent client tampering.
- XP-priced items (Kitten, money packs) keep current behavior via updated catalog/RPC.
- Refunds: support new item ids/prices/currencies consistently (unlock refunds return XP only where that was the original cost; money-bought unlocks must refund fairly — **important assumption:** money-bought dessert unlocks refund by returning **money** and removing item; if a different refund currency is required, flag before implementation. I will implement money refunds for money-priced unlocks to keep economy neutral and clear, and document in migration/UI.)
- Shop page and menu share one catalog/config source where possible.

## 6. Progression and stats

### 6.1 Focus completion XP

- On each completed focus/work session in `PomodoroProvider` (mode transition from focus to break/completion as currently defined), call a new server RPC `award_focus_session` (name may vary) once per completed focus session:
  - increments `users.xp` by 500
  - increments `user_stats.sessions_completed` and `user_stats.focus_minutes` as appropriate (keep consistent with existing stats behavior)
  - records daily activity contribution if required (see 6.2)
  - returns updated xp/money/owned_items snapshot for client sync
- Client applies progress via `applyProgress` and shows success feedback; failures show non-destructive toast (no progress lost locally except unsynced award).
- Idempotency/duplicate-call guard recommended (client-side guard + optional server-side recent-session guard if simple).

### 6.2 Daily activity tracking (7-day chart)

- New table, e.g. `public.user_activity_daily`:
  - `user_id uuid references public.users(id) on delete cascade`
  - `activity_date date not null`
  - `active_seconds integer not null default 0 check (active_seconds >= 0)`
  - primary key `(user_id, activity_date)`
  - RLS: user can select/insert/update own rows; server RPC/functions may manage as needed.
- Update path: when hangout time is flushed/awarded (existing `award_hangout` flow and/or `recordHangoutTime` path), upsert today’s `active_seconds += seconds`. Keep totals in `user_stats.hangout_seconds` consistent (avoid double counting).
- Read path: fetch last 7 calendar days for current user (including today) ordered ascending; missing days returned as 0.
- **Dashboard UI:** add chart component/section rendering 7 points/bars-as-line, **solid green line**, labeled days/durations, theme-aware surfaces, no gradients. Starts empty/flat-from-now until data accrues.

## 7. Laptop removal and data migration

- Remove/replace all laptop references: `ShopItemId`, shop catalog entry, purchase/refund handling, UI strings/icons/prompts, room controls (`L` key, toggle, menu button, help text), canvas/engine state/props/rendering, admin terminal help/grants examples, progress service types, docs/comments as relevant.
- **Data migration (SQL):**
  - For every user where `owned_items` contains `laptop`: set `owned_items = array_remove(owned_items, 'laptop')` and `xp = xp + 500` (once). Users without laptop unchanged.
  - Update `purchase_item`/`refund_item`/grant/admin functions to remove `laptop` and add new item ids, money-priced unlock rules, and refund semantics.
- Backward compatibility: clients should tolerate unknown legacy item ids gracefully (ignore/display-safe).

## 8. Dark mode and visual rules

- **Settings:** add `theme` or `darkMode` boolean in `SettingsState`/`DEFAULT_SETTINGS`/storage; toggle UI in Settings (Comfort/Appearance). Default Light.
- **Application:** apply `dark` class or `data-theme="dark"` on `html`/`body`/root; define dark palette tokens/CSS variables in `index.css` and Tailwind config (`darkMode: 'class'` or equivalent) so components/cards/text/inputs/overlays remain readable.
- **No gradients:** replace all gradient backgrounds/borders/fills in UI (Shop hero/cards, Info & Feedback paper accents, Progress panel/bars, chart fills, etc.) with flat colors. Chart line green and solid.
- Keep pixel-art rendering crisp; avoid visual regressions in canvas.

## 9. Access, privacy, and security notes

- Menu/focus/xp/money mutations must remain server-authoritative (RPCs with `auth.uid()` checks).
- Bedroom access must not rely solely on hidden client routes; enforce ownership/invite checks before join/state access.
- Invite links/keys are bearer secrets; keep them unguessable enough (UUID/token) and scoped to the bedroom.
- Preserve existing protections (owner/admin rules, trigger hardening, column grants) and extend migrations consistently.

## 10. Testing and verification

- **Automated/local:** `npm run typecheck`, `npm run build` pass. Grep confirms no laptop UI/behavior and no gradient utilities/styles remain.
- **Manual/local (after SQL):** sign-in, Settings dark mode toggle persists, Dashboard chart renders (empty/seeded), Shop/menu show correct items/prices/currencies, cook NPC interaction opens speech bubble and purchases update money/owned items without progress loss, focus completion awards +500 XP once, Bar/Restaurant/Bedroom load and are navigable, invite copies and grants access as designed.
- **Blocked without environment actions:** running Supabase SQL, verifying RLS/RPC in production DB, two-account invite/multiplayer proof, multi-day chart history, and live deploy checks require your execution/access.

## 11. Files likely affected (non-exhaustive)

- Docs: `docs/progress-features-migration.sql`, `docs/admin-migration.sql` (and/or new migration docs), `docs/database-schema.sql` (if maintained), credits.
- Config/types: `src/config/rooms.config.ts`, `src/config/sprites.config.ts`/tiles, `src/types/*`, room/entity types.
- Engine: `AssetLoader`, `TileRenderer`, `RoomBuilder`, `GameCanvas`, input/controllers, entity/world helpers, NPC rendering/interaction hooks.
- UI/pages: `DashboardPage`, `ShopPage`, `RoomPage`, `SettingsPage`, `InfoFeedbackPage`, `ProgressPanel`, room/dashboard cards, new MenuBubble/NPC/chart components.
- State/services: `progressService`, `statsService`, `roomService`, `settings` storage/context, `PomodoroContext`, `AuthContext` progress sync.
- Assets: `public/assets/added/**` (copied approved files), removal of unused laptop runtime refs.

## 12. Open implementation choices (bounded)

- Exact room dimensions, prop selections, NPC coordinates, and Pixel-interiors tile mapping — chosen from approved assets for playability and clarity.
- Exact RPC names/shapes and migration file split/order — finalized during implementation with clear run instructions.
- Money-bought unlock refund currency — **money** (neutral), as noted in 5.2.

## 13. Acceptance criteria

- All approved rooms exist and are reachable (Bar, Restaurant, My Room) and Café is enriched.
- Cook NPC appears in Café/Bar/Restaurant; near + interact opens speech-bubble menu; menu purchases work with money and preserve progress.
- Laptop fully removed; prior owners refunded 500 XP once (post-migration) and item removed.
- Focus/work completion awards 500 XP once per session; chart shows last 7 days active time with green line (tracking from now).
- My Room is personal with working invite flow and restricted access per design.
- Dark mode toggle works and persists; no UI gradients remain.
- No unapproved assets/features added. Build and typecheck pass. Migrations and verification steps documented.
