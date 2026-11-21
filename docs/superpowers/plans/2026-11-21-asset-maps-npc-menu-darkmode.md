# Asset Maps, NPC Menu, Dark Mode, and Progression Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate approved added asset packs into new/enriched rooms with cook NPC speech-bubble menus, remove laptop, expand shop/menu economy and progression, add 7-day active-time chart, add personal bedroom with invite access, and add site-wide dark mode without gradients.

**Architecture:** Extend the existing Vite/React/TS canvas engine and room/config system to support custom image props/entities and new room definitions; keep Supabase as source of truth for progress/stats/access via updated RPCs and migrations. Use DOM overlays for NPC menu/chart UI, local settings for theme, and server-authoritative mutations for XP/money/unlocks/activity.

**Tech Stack:** React 18, TypeScript, Vite 7, Tailwind CSS 3.4.19, Supabase JS/Postgres RPC + RLS, HTML canvas engine, Lucide icons.

**Spec:** `docs/superpowers/specs/2026-11-21-asset-maps-npc-menu-darkmode-design.md`

## Global Constraints

- Use only assets from `public/sprites/**` and `Added_assets/**`; copy approved runtime assets into `public/assets/added/**`. No unapproved assets or features.
- No UI gradients anywhere (`linear-gradient`, `bg-gradient-*`, `from-*`, `to-*`, `via-*`) after implementation.
- Laptop feature removed completely (shop, room, input, engine hooks, admin/grant refs, docs behavior) with one-time owner refund migration: +500 XP and remove `laptop` from `owned_items` only if owned.
- Item storage remains `users.xp`, `users.money`, `users.owned_items`; new/changed RPCs and schema additions are required for money-priced unlocks, focus XP, daily activity, and bedroom access/invite.
- Server-authoritative mutations: purchases, refunds, focus XP, activity tracking, and access checks must not trust client-calculated totals.
- Dark mode: toggle in Settings, persisted in existing local settings storage, default Light.
- NPC menu: cook in Café/Bar/Restaurant, walk-near + E/tap opens speech-bubble menu anchored to NPC, same money-priced menu, no progress lost on interaction failures.
- Verification baseline per task (no automated test suite): `npm run typecheck` and `npm run build` must pass unless task states otherwise; add targeted `rg` checks for removed/forbidden patterns.

## Review Focus

- **Money-priced unlock flow:** buying/refunding dessert unlocks must update money/owned_items correctly (no XP charged/returned for money buys) and block double-purchase/insufficient funds server-side.
- **Focus XP award:** exactly +500 XP once per completed focus/work session (not breaks), no duplicate award on re-render/reload race, stats/activity remain consistent.
- **Laptop removal/refund migration:** users with `laptop` get +500 XP and item removed once; users without laptop unchanged; no runtime errors on legacy/unknown item ids.
- **Bedroom access:** owner can enter own room; non-owner cannot enter without valid invite; invite copy/share works; no obvious ID-guess bypass in app join flow.
- **Dark mode/no-gradient:** theme toggle persists and applies across pages/overlays/chart; no remaining gradient classes/styles; text contrast readable in dark mode.

---

## Task 1: Baseline, asset staging, and credits

**Files:**
- Create: `public/assets/added/` (directories/files copied from approved packs)
- Modify: `public/sprites/credits.txt`
- Modify: `package.json` (only if a script is genuinely needed; prefer none)

**Interfaces:**
- Produces: runtime-accessible approved assets under `public/assets/added/desserts/`, `public/assets/added/fooddrink/`, `public/assets/added/pixel-interiors/` (names may vary but must be stable and referenced consistently later).

- [ ] **Step 1: Inventory approved runtime assets**
  - List Dessert_Icons PNGs to copy (all or only needed; prefer only needed 6 + none extra): `Cheesecake.png`, `ChocolateCake.png`, `StrawberryShortcake.png`, `Macrons.png`, `Croissant.png`, `Pancakes.png`.
  - Identify FoodDrink individual PNGs/tilesheet files and Pixel interiors `tiles and items.png` to copy.

- [ ] **Step 2: Copy approved assets into `public/assets/added/`**
  - Run: `mkdir -p public/assets/added/desserts public/assets/added/fooddrink public/assets/added/pixel-interiors`
  - Run: `cp 'Added_assets/extracted/Dessert_Icons/Cheesecake.png' ... public/assets/added/desserts/` (all 6 approved icons)
  - Run: `cp 'Added_assets/extracted/Pixel_16_interiors_v2_free/tiles and items.png' public/assets/added/pixel-interiors/tiles-and-items.png`
  - Run: copy selected FoodDrink `Tiles/**` and/or `TileMap/**` needed for Bar/Restaurant/Café enrichment into `public/assets/added/fooddrink/` preserving useful structure.

- [ ] **Step 3: Update credits**
  - Add attribution/licensing notes for Food & Drink 2D Mega Props Pack, Dessert Icons pack, Pixel 16 Interiors v2 Free per included license/readme files in `Added_assets/extracted/.../Documentation` or package contents.
  - Remove or mark laptop credit only when laptop asset/runtime use is fully removed (can be finalized in laptop-removal task; if done now, keep consistent).

- [ ] **Step 4: Verify**
  - Run: `find public/assets/added -type f | sort`
  - Expected: approved files present only.
  - Run: `npm run typecheck && npm run build`
  - Expected: PASS

- [ ] **Step 5: Commit**
  - `git add public/assets/added public/sprites/credits.txt docs/superpowers/plans/2026-11-21-asset-maps-npc-menu-darkmode.md`
  - `git commit -m "chore(assets): stage approved added packs and update credits"`

## Task 2: Theme settings foundation and dark mode plumbing

**Files:**
- Modify: `src/lib/localStorage.ts`
- Modify: `src/context/SettingsContext.tsx`
- Modify: `src/main.tsx` or `src/App.tsx` (theme class application)
- Modify: `tailwind.config.js`
- Modify: `src/index.css`
- Modify: `src/pages/SettingsPage.tsx`

**Interfaces:**
- Produces: `SettingsState` includes `darkMode: boolean` (default `false`), persisted and exposed via `useSettings()`.
- Produces: root element receives `dark` class when enabled.

- [ ] **Step 1: Extend settings state**
  - Add `darkMode: boolean` to `SettingsState` and `DEFAULT_SETTINGS` in `src/lib/localStorage.ts` with default `false`.

- [ ] **Step 2: Enable Tailwind dark mode and theme tokens**
  - Set `darkMode: 'class'` in `tailwind.config.js`.
  - Add dark CSS variables/surfaces in `src/index.css` (`:root` and `.dark body/#root` or equivalent) using flat colors only.

- [ ] **Step 3: Apply theme class**
  - In `SettingsProvider` or app root effect, sync `document.documentElement.classList.toggle('dark', settings.darkMode)`.

- [ ] **Step 4: Add Settings toggle**
  - Add `ToggleRow` “Dark mode” in `src/pages/SettingsPage.tsx` bound to `settings.darkMode`.
  - Replace hardcoded light-only classes in Settings page incrementally as needed for readability (full sweep in Task 3).

- [ ] **Step 5: Verify**
  - Run: `npm run typecheck && npm run build`
  - Expected: PASS

- [ ] **Step 6: Commit**
  - `git add src/lib/localStorage.ts src/context/SettingsContext.tsx src/main.tsx src/App.tsx tailwind.config.js src/index.css src/pages/SettingsPage.tsx`
  - `git commit -m "feat(theme): add persisted dark mode setting and theme plumbing"`

## Task 3: Remove all UI gradients and complete dark-mode styling

**Files:**
- Modify: `src/pages/ShopPage.tsx`
- Modify: `src/pages/InfoFeedbackPage.tsx`
- Modify: `src/components/dashboard/ProgressPanel.tsx`
- Modify: `src/pages/AdminPage.tsx`, `src/pages/DashboardPage.tsx`, `src/pages/FriendsPage.tsx`, `src/pages/RoomPage.tsx`, `src/pages/SettingsPage.tsx`, `src/pages/CreditsPage.tsx`, layout/components as needed
- Modify: `src/index.css`, `src/components/ui/*` as needed

**Interfaces:**
- Produces: no `linear-gradient`, `bg-gradient`, `from-`, `via-`, `to-` in `src/**` and `tailwind.config.js`.

- [ ] **Step 1: Replace known gradients**
  - `ShopPage.tsx`: remove hero `style={{ background: 'linear-gradient(...)' }}` and use flat themed class.
  - `InfoFeedbackPage.tsx`: replace paper/hero gradient styles with flat/pattern-free alternatives (CSS image patterns allowed only if not gradients; prefer flat).
  - `ProgressPanel.tsx`: replace card and bar gradients with solid colors using rank color.

- [ ] **Step 2: Sweep and fix remaining gradients**
  - Run: `rg -n "linear-gradient|bg-gradient|from-|via-|to-" src tailwind.config.js`
  - Replace each match with flat equivalents.

- [ ] **Step 3: Apply dark-mode-compatible utility classes**
  - Update shared surfaces (`Card`, buttons, inputs, nav/layout, toasts if present) for light/dark contrast.

- [ ] **Step 4: Verify**
  - Run: `rg -n "linear-gradient|bg-gradient|from-|via-|to-" src tailwind.config.js` (expect no matches)
  - Run: `npm run typecheck && npm run build`
  - Expected: PASS

- [ ] **Step 5: Commit**
  - `git add src tailwind.config.js`
  - `git commit -m "style(ui): remove gradients and add dark mode coverage"`

## Task 4: Remove laptop feature from app runtime

**Files:**
- Modify: `src/services/progressService.ts`
- Modify: `src/pages/ShopPage.tsx`
- Modify: `src/pages/RoomPage.tsx`
- Modify: `src/components/room/GameCanvas.tsx`
- Modify: `src/engine/core/InputController.ts`
- Modify: `src/components/admin/AdminTerminal.tsx`
- Modify: `src/services/adminService.ts` (only if laptop-specific handling exists; keep generic grants)
- Modify/Delete refs: `src/config/rooms.config.ts` (remove `computer` props from layouts if laptop/computer prop is laptop-only), `public/sprites/manifest.json`/prop usage only if safe, `public/sprites/credits.txt` laptop line if asset unused
- Modify: any other `rg` matches for laptop behavior

**Interfaces:**
- Produces: `ShopItemId` has no `laptop`; no `L` key laptop toggle; no `ownsLaptop`/`onLaptopChange`/`toggleLaptop` props or state; no laptop purchase/refund UI copy.
- Consumes: existing kitten/money behavior unchanged except catalog updates.

- [ ] **Step 1: Remove laptop from catalog and services**
  - Update `ShopItemId`, `SHOP_ITEMS`, and messages in `src/services/progressService.ts` and `src/pages/ShopPage.tsx`.

- [ ] **Step 2: Remove laptop controls and rendering**
  - Delete laptop state/handlers/UI in `RoomPage.tsx`.
  - Remove laptop refs, props, prop preloading, key handling, and draw logic in `GameCanvas.tsx`.
  - Remove `KeyL` handling and `consumeLaptopToggle`/queue in `InputController.ts`.

- [ ] **Step 3: Remove laptop from admin/room content**
  - Update terminal help and item handling in `AdminTerminal.tsx`.
  - Remove `computer` prop placements from `rooms.config.ts` if they represent the removed laptop feature (replace with approved decor only if needed to keep layout coherent, using existing/approved assets).

- [ ] **Step 4: Sweep and verify**
  - Run: `rg -n "\blaptop\b|Laptop|toggleLaptop|ownsLaptop|consumeLaptopToggle|KeyL" src`
  - Expected: no runtime feature matches (docs/migrations handled later).
  - Run: `npm run typecheck && npm run build`
  - Expected: PASS

- [ ] **Step 5: Commit**
  - `git add src public/sprites/credits.txt`
  - `git commit -m "feat(shop): remove laptop feature and runtime references"`

## Task 5: Extend room/engine types for custom assets and NPC entities

**Files:**
- Modify: `src/types/engine.types.ts`
- Modify: `src/config/rooms.config.ts` (types usage/imports as needed)
- Modify: `src/engine/world/RoomBuilder.ts`
- Modify: `src/engine/assets/AssetLoader.ts`
- Modify: `src/engine/world/TileRenderer.ts`
- Modify: `src/components/room/GameCanvas.tsx`
- Create/Modify: helpers if needed (e.g. `src/engine/world/customProps.ts`) only when it simplifies one responsibility

**Interfaces:**
- Produces: room definitions can declare custom prop images/entities, e.g. `customProps?: Array<{ id: string; image: string; x: number; y: number; width: number; height: number; anchorX: number; anchorY: number; collision?: CollisionBox | null; passable?: boolean }>` and `npcs?: Array<{ id: string; name: string; slug: CharacterSlug; x: number; y: number; direction: Direction; interactionRadius: number; action: 'menu' }>` (exact names finalized consistently).
- Produces: loader/canvas can load and render custom image props by path and static NPC sprites.
- Consumes: existing manifest prop/tile pipeline remains functional.

- [ ] **Step 1: Add types**
  - Extend `RoomDefinition` (and supporting interfaces) for custom floor/wall image or extra draw layers if needed, custom props, and NPC entities.

- [ ] **Step 2: Load custom images**
  - Add `AssetLoader.loadImageByPath(path)` reuse of `loadImage` and room preload support for custom prop/entity/NPC assets.

- [ ] **Step 3: Render custom props and NPCs**
  - In `GameCanvas.tsx`, preload custom prop/NPC images, include custom props in depth-sorted draw list using anchor-based draw rect and groundY, and draw NPC character frames (idle) with name tag/indicator.
  - Expose NPC screen/world interaction data needed by RoomPage/menu overlay (callback/ref or derived state) without breaking existing props.

- [ ] **Step 4: Collision/build support**
  - Update `RoomBuilder` to include custom prop collision boxes when provided.

- [ ] **Step 5: Verify**
  - Run: `npm run typecheck && npm run build`
  - Expected: PASS (existing rooms unchanged)

- [ ] **Step 6: Commit**
  - `git add src/types src/engine src/components/room/GameCanvas.tsx src/config/rooms.config.ts`
  - `git commit -m "feat(engine): support custom room props and static NPC entities"`

## Task 6: Add Bar, Restaurant, and enriched Café room content

**Files:**
- Modify: `src/config/rooms.config.ts`
- Modify: `src/components/dashboard/PublicRoomCard.tsx` (icons/labels for new rooms)
- Modify: `src/pages/DashboardPage.tsx` (room listing assumptions if any)
- Modify: `src/services/roomService.ts` (only if room metadata needs extension)
- Use assets under: `public/assets/added/fooddrink/**`

**Interfaces:**
- Produces: `ROOM_DEFINITIONS` includes enriched `public-cafe`, new `public-bar`, new `public-restaurant` with custom props/entities/seats/spawns/collision.
- Consumes: Task 5 custom asset/entity support.

- [ ] **Step 1: Select approved FoodDrink assets per room**
  - Choose specific files from copied Bar/Cafe/Restaurant/Architecture sets for layout coherence and navigation clearance; record chosen filenames in config comments if helpful.

- [ ] **Step 2: Define room layouts**
  - Enrich Café with custom decor props and Cook NPC near counter.
  - Create Bar layout (counter/seating/decor/walls-floor treatment as supported) + Cook NPC.
  - Create Restaurant layout + Cook NPC.
  - Ensure spawns/seats/collision are playable.

- [ ] **Step 3: Wire dashboard/public room UI**
  - Add icons/tints/names for new public rooms; ensure `listRooms`/public IDs align (`public-cafe`, `public-bar`, `public-restaurant`).

- [ ] **Step 4: Verify**
  - Run: `npm run typecheck && npm run build`
  - Manual smoke (if dev server used): navigate to each public room, confirm render/no console crash.
  - Expected: PASS

- [ ] **Step 5: Commit**
  - `git add src/config/rooms.config.ts src/components/dashboard src/pages/DashboardPage.tsx src/services/roomService.ts`
  - `git commit -m "feat(rooms): add bar and restaurant and enrich cafe with approved assets"`

## Task 7: NPC interaction and speech-bubble menu UI

**Files:**
- Create: `src/components/room/NpcMenuBubble.tsx` (or similar)
- Modify: `src/components/room/GameCanvas.tsx`
- Modify: `src/pages/RoomPage.tsx`
- Modify: `src/engine/core/InputController.ts` or interaction handling path (reuse interact key/E without laptop)
- Modify: `src/hooks/useIsTouchDevice.ts` usage only if needed

**Interfaces:**
- Produces: near-NPC detection + interact prompt; open/close bubble menu anchored to cook NPC screen position.
- Consumes: NPC entities from room definition and Task 8 catalog/purchase handlers (can stub UI with disabled buy until Task 8 if necessary, but prefer end-to-end).

- [ ] **Step 1: Detect nearby interactable NPC**
  - Compute distance from player to NPC entities; expose active NPC and prompt state to RoomPage.

- [ ] **Step 2: Implement menu bubble component**
  - Render speech-bubble styled panel with pointer/tail feel, item grid/list, icon, name, money price, owned/buy state, close button; position near NPC using provided screen coords.

- [ ] **Step 3: Wire interaction controls**
  - Desktop: `E` opens/closes when near NPC (and still handles seats correctly with priority rules defined clearly).
  - Mobile: add/tap interact control when near NPC/menu context (reuse seat button area logic carefully).

- [ ] **Step 4: Verify**
  - Run: `npm run typecheck && npm run build`
  - Expected: PASS

- [ ] **Step 5: Commit**
  - `git add src/components/room src/pages/RoomPage.tsx src/components/room/GameCanvas.tsx src/engine/core/InputController.ts`
  - `git commit -m "feat(room): add cook NPC interaction and speech-bubble menu UI"`

## Task 8: Catalog, money-priced unlock purchases, refunds, and shop/menu wiring

**Files:**
- Modify: `src/services/progressService.ts`
- Modify: `src/pages/ShopPage.tsx`
- Modify: `src/components/room/NpcMenuBubble.tsx`
- Modify: `src/components/admin/AdminTerminal.tsx`
- Modify: `docs/progress-features-migration.sql` (or new migration doc referenced by it)

**Interfaces:**
- Produces: catalog includes Kitten (350 XP), 6 dessert unlocks (200/200/250/250/150/150 money), 3 money packs (unchanged). Dessert unlocks purchasable/refundable by money; XP items unchanged.
- Produces: RPC contract updates for `purchase_item`/`refund_item` (or new RPCs) to accept new IDs and money-priced unlock semantics.

- [ ] **Step 1: Update client catalog/types**
  - Add item ids (stable slugs, e.g. `dessert-cheesecake`, etc.), `priceXp`/`priceMoney` or discriminated pricing fields, icons/image paths, `soldIn: ('shop'|'menu')[]`.

- [ ] **Step 2: Update shop UI**
  - Render image icons for dessert unlocks; show correct currency per item; buy/refund buttons use correct affordability (`xp` vs `money`) and calls.

- [ ] **Step 3: Update menu UI**
  - Show same 6 dessert items, money pricing, and purchase/refund behavior consistent with shop.

- [ ] **Step 4: Update SQL/RPC definitions in docs**
  - Implement server pricing/validation for new items and money unlock buy/refund (refund money for money-bought unlocks). Remove laptop. Keep grants/admin compatibility.
  - Run: `rg -n "laptop" docs/progress-features-migration.sql docs/admin-migration.sql` and update as needed.

- [ ] **Step 5: Verify**
  - Run: `npm run typecheck && npm run build`
  - Run: `rg -n "'laptop'|\"laptop\"" src docs/progress-features-migration.sql docs/admin-migration.sql`
  - Expected: build passes; laptop removed from runtime and updated migrations/docs.

- [ ] **Step 6: Commit**
  - `git add src/services/progressService.ts src/pages/ShopPage.tsx src/components/room/NpcMenuBubble.tsx src/components/admin/AdminTerminal.tsx docs/progress-features-migration.sql docs/admin-migration.sql`
  - `git commit -m "feat(shop): add dessert unlocks and money-priced menu purchases"`

## Task 9: Focus completion XP (+500) and daily activity tracking backend/docs

**Files:**
- Modify: `src/context/PomodoroContext.tsx`
- Modify: `src/services/statsService.ts`
- Modify: `src/services/progressService.ts` (or `statsService`/new service for RPCs)
- Modify: `src/context/AuthContext.tsx` (apply progress snapshot if returned)
- Modify: `src/hooks/useTimeTracker.ts` / `src/pages/RoomPage.tsx` hangout flush path as needed
- Modify/Create: `docs/progress-features-migration.sql` and/or `docs/activity-and-focus-migration.sql`

**Interfaces:**
- Produces: `award_focus_session` RPC (name final) grants +500 XP once per completed focus session and updates relevant stats; client syncs returned progress.
- Produces: `user_activity_daily` storage and upsert/read RPCs (or direct table ops with RLS) for last 7 days; hangout flush updates daily seconds without double counting totals.

- [ ] **Step 1: Add focus award RPC call**
  - In `PomodoroContext`, on completed focus session increment, call server award RPC, `applyProgress` from returned snapshot, keep existing local stats/toast behavior coherent.

- [ ] **Step 2: Add daily activity service functions**
  - Implement `fetchDailyActivity(userId, days=7)` and integration point to record seconds on hangout flush (prefer server-side accumulation in RPC).

- [ ] **Step 3: Write SQL/migration docs**
  - Create/extend migration with table, indexes, RLS, grants, and RPCs; document run order.

- [ ] **Step 4: Verify**
  - Run: `npm run typecheck && npm run build`
  - Expected: PASS

- [ ] **Step 5: Commit**
  - `git add src/context/PomodoroContext.tsx src/services src/context/AuthContext.tsx src/hooks src/pages/RoomPage.tsx docs`
  - `git commit -m "feat(progress): award focus XP and track daily activity"`

## Task 10: Dashboard 7-day active-time chart (green line)

**Files:**
- Create: `src/components/dashboard/ActiveTimeChart.tsx`
- Modify: `src/pages/DashboardPage.tsx`
- Modify: `src/services/statsService.ts` (or activity service)

**Interfaces:**
- Produces: Dashboard section showing last 7 days active time as green line chart (SVG/canvas/DOM), no gradients, theme-aware labels.

- [ ] **Step 1: Fetch activity data**
  - Load last 7 days on dashboard mount/profile availability; handle empty/error state gracefully.

- [ ] **Step 2: Implement chart component**
  - Render axes/labels minimally and a solid green polyline/line; scale by max minutes (min 1).

- [ ] **Step 3: Add to dashboard layout**
  - Place near stats/progress without breaking existing sections.

- [ ] **Step 4: Verify**
  - Run: `npm run typecheck && npm run build`
  - Expected: PASS

- [ ] **Step 5: Commit**
  - `git add src/components/dashboard/ActiveTimeChart.tsx src/pages/DashboardPage.tsx src/services`
  - `git commit -m "feat(dashboard): add 7-day active time line chart"`

## Task 11: Bedroom (My Room) layout, entry, and invite/access flow

**Files:**
- Modify: `src/config/rooms.config.ts`
- Modify: `src/pages/DashboardPage.tsx`
- Modify: `src/pages/RoomPage.tsx`
- Modify: `src/components/room/RoomTopBar.tsx` or room HUD for invite button
- Modify: `src/services/roomService.ts`
- Modify: `src/hooks/useRoomConnection.ts` / join path as needed
- Create/Modify: `docs/bedroom-access-migration.sql` or extend existing docs
- Use asset: `public/assets/added/pixel-interiors/tiles-and-items.png`

**Interfaces:**
- Produces: personal bedroom room definition/loader support for Pixel interiors source, dashboard entry, owner-only access with invite key/link join path, invite copy button in room.

- [ ] **Step 1: Build bedroom room definition**
  - Compose fixed layout/collision/spawn from Pixel interiors sheet using custom image/tile support; map stable id helper (e.g. `bedroomRoomId(userId)`).

- [ ] **Step 2: Add dashboard entry and routing behavior**
  - “My Room” opens owner bedroom; handle loading/profile guard.

- [ ] **Step 3: Implement invite/access data flow**
  - Create/fetch bedroom access record and invite key (RPC/table) with RLS; copy invite URL containing room id + invite token/key params.
  - Validate access before allowing room connection for non-owners; show clear denial state/toast.

- [ ] **Step 4: Add invite button UI**
  - Top-right in bedroom room view copies invite link.

- [ ] **Step 5: Document SQL/migrations**
  - Provide exact schema/policies/RPC/grants and run steps.

- [ ] **Step 6: Verify**
  - Run: `npm run typecheck && npm run build`
  - Expected: PASS (DB behavior requires migration)

- [ ] **Step 7: Commit**
  - `git add src docs public/assets/added/pixel-interiors`
  - `git commit -m "feat(room): add personal bedroom with invite-based access"`

## Task 12: Admin/terminal, migrations consolidation, and docs

**Files:**
- Modify: `src/components/admin/AdminTerminal.tsx`
- Modify: `src/services/adminService.ts`
- Modify: `docs/admin-migration.sql`
- Modify: `docs/progress-features-migration.sql`
- Create: additional migration docs if split (e.g. `docs/activity-focus-bedroom-migration.sql`) with clear order
- Modify: `README.md` or `docs/*` user instructions if helpful (keep concise)

**Interfaces:**
- Produces: admin commands/grants aligned with new item IDs and no laptop; migrations include laptop refund, new catalog, focus/activity/bedroom as designed.

- [ ] **Step 1: Update admin tooling**
  - Remove laptop examples; add dessert item IDs; keep money pack grants; ensure help text accurate.

- [ ] **Step 2: Consolidate migrations and runbook**
  - Single recommended run order with Supabase SQL editor steps and post-run checks.

- [ ] **Step 3: Verify**
  - Run: `rg -n "laptop" src/components/admin src/services/adminService.ts docs/admin-migration.sql docs/progress-features-migration.sql`
  - Run: `npm run typecheck && npm run build`
  - Expected: PASS

- [ ] **Step 4: Commit**
  - `git add src/components/admin src/services/adminService.ts docs`
  - `git commit -m "chore(admin): align grants and consolidate migrations"`

## Task 13: Final verification, polish, and spec/plan status

**Files:**
- Modify: `docs/superpowers/specs/2026-11-21-asset-maps-npc-menu-darkmode-design.md` (status/notes if needed)
- Modify: `docs/superpowers/plans/2026-11-21-asset-maps-npc-menu-darkmode.md` (checklist/status notes)

**Interfaces:**
- Produces: clean build, no gradients, no laptop runtime refs, documented verification and remaining manual/DB steps.

- [ ] **Step 1: Run full checks**
  - Run: `npm run typecheck && npm run build`
  - Run: `rg -n "linear-gradient|bg-gradient|from-|via-|to-" src tailwind.config.js`
  - Run: `rg -n "\blaptop\b|toggleLaptop|ownsLaptop|KeyL" src`

- [ ] **Step 2: Smoke-test critical flows locally**
  - Use Playwright/local preview if available to validate login flow shell, shop/menu rendering, dark mode toggle, room navigation, NPC prompt presence (best effort).

- [ ] **Step 3: Document outcomes and user actions**
  - Summarize what shipped, exact SQL files/order to run, and tests blocked by DB/live access.

- [ ] **Step 4: Commit**
  - `git add -A` (review carefully; exclude unintended files like `Added_assets/` zip cache only if already tracked policy differs — prefer not adding raw `Added_assets/` unless necessary)
  - `git commit -m "chore: finalize verification and rollout notes"`
