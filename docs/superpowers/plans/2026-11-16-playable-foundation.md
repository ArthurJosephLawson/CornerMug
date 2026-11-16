# Corner Mug — Playable Foundation with Placeholder Graphics Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline — creator pre-approved execution).

**Goal:** Lock the creator/engineer division of labor into docs, reorganize the repo to the flat `sprites/png` + room-JSON structure, and scaffold a playable Phaser cafe with colored-rectangle fallbacks and a `?edit=true` layout editor.

**Architecture:** World coordinates are fixed 640x360 (each interior is a full-screen background PNG). Room layouts live as JSON in `src/config/rooms/` (no Tiled). Phaser `MainCafeScene` loads assets from `/sprites/<name>.png`; any missing PNG falls back to a labeled colored rectangle at the asset's world size. `?edit=true` enables drag placement + JSON export for the creator.

**Tech Stack:** Next.js App Router, TypeScript strict, Phaser 3, Supabase (stubbed), Vitest.

**Spec:** creator instruction (this session) + `blueprint.md` + `AGENTS.md`.

## Global Constraints

- Engineer NEVER generates pixel art, SVG, or custom art — colored labeled rectangles are the only fallback.
- Creator draws 100% of visuals in LibreSprite (`sprites/ase/` untouched by agent).
- No Tiled, no sprite sheets — creator exports NN-scaled PNGs directly.
- Interiors drawn 320x180 (or 160x90), exported NN 200%/400% to 640x360; `_thumb.png` 160x90 per interior.
- Characters: two files per character (`<name>_left.png`, `<name>_right.png`), world size 32x48; horizontal texture flipping for direction; up/down keeps last facing; no mouth animation while chatting.
- Missing PNG in `sprites/png/` → loader falls back to labeled colored rect; game must run and test clean at every stage.
- All world coords in room JSON are 640x360-space px, bottom-center anchor for props/seats.
- Bare-bones unstyled HTML UI; zero-login entry gate unchanged.

## Review Focus

- Missing asset files must not break scene load — pinned by fallback test (Task 4) + browser check (Task 8).
- Room JSON with missing/malformed fields must be rejected by validation, not crash Phaser — Task 3 tests.
- Seat click must require proximity; movement must unseat — Task 5 manual check.
- Edit-mode JSON must round-trip through `validateRoomConfig` — Task 6 manual check.
- Room picker must render when `_thumb.png` files are missing — Task 7 fallback rects.

---

### Task 1: Documentation lock (division of labor)
**Files:** Rewrite `AGENTS.md`, `sprites/DESIGN.md`, `sprites/README.md`, `sprites/ASSETS.md`
- AGENTS.md: creator role (LibreSprite, 320x180→640x360 NN export, no Tiled/sheets), engineer role (Next.js/Phaser/edit tool/Supabase/Vercel), strict asset rule + fallback rule, exact folder layout.
- DESIGN.md: new size table — interiors 320x180→640x360 + 160x90 thumbs; characters 16x24 logical → 32x48 world (2x export) or 64x96 (4x); props multiples of 8 logical, max 96x128 world; palette section kept; no Tiled sections.
- README.md: workflow — creator exports PNGs flat into `sprites/png/`; engine loads `/sprites/<file>.png`.
- ASSETS.md: rename files to `interior_1..3`, `interior_N_thumb`, `male_left/right`, `employee_left/right`, prop keys; prop positions registered via `?edit=true` tool, not coordinates tables.
- Verify: docs consistent; commit.

### Task 2: Structure re-org
**Files:** symlink `public/sprites -> ../sprites/png`; delete `sprites/maps/`, `scripts/convert-sprites.mjs`; uninstall `@pixelation/aseprite`, `pngjs`; `.gitkeep` in `sprites/{ase,png,audio}`; create `src/config/rooms/`.
- Verify: `ls public/sprites/` lists png contents; `npm run build` PASS; commit.

### Task 3: Room types + configs + validation (TDD)
**Files:** `src/types/room.ts`, `src/lib/rooms.ts`, `src/config/rooms/interior_{1,2,3}.json`, test `src/lib/rooms.test.ts`
- Types: `Vec2`, `Collider`, `PropPlacement {key,x,y,width,height,solid}`, `SnapSeat {id,x,y,facing,tableId}`, `RoomConfig {id,name,backgroundKey,backgroundSize{640,360},spawn,colliders,props,snapSeats}`, `PlayerState`.
- `ROOM_IDS = ["interior_1","interior_2","interior_3"]`; `loadRoomConfig(id): RoomConfig` (static import map); `validateRoomConfig(config): string[]` (pure, no `any`).
- Templates: border colliders (4 rects, world bounds), spawn {320,180}, empty props/snapSeats.
- TDD: valid template → []; missing backgroundKey/spawn/mis-sized backgroundSize/bad facing → error strings; invalid room id → loadRoomConfig throws.
- Commit.

### Task 4: Placeholder fallback system (TDD pure part)
**Files:** `src/game/fallback.ts`, test `src/game/fallback.test.ts`
- `type AssetSpec = { key: string; url: string; width: number; height: number; color: number; label: string }`
- Pure: `missingAssets(specs, existingTextures: Set<string>): AssetSpec[]`
- Scene side: `applyFallbacks(scene, specs)` — for each missing spec create canvas texture: fill color @ ~40% alpha over darker base, 1px border, label text (font 8px monospace), plus name below.
- Colors: bg `#B9A88C`, chars `#5C4033`, props `#7A8B6F`, seats `#A8574E`, npc `#D9A05B`.
- TDD for pure fn: all missing / all present / mixed.
- Commit.

### Task 5: MainCafeScene + movement + seats + bubble
**Files:** rewrite `src/game/config/gameConfig.ts` (fixed 640x360, Scale.FIT, pixelArt, roundPixels), `src/game/scenes/MainCafeScene.ts` (replaces BootScene/CafeScene), `src/game/PhaserGame.ts` (mountGame(parent, {roomId, edit})), `src/components/GameCanvas.tsx` (reads `?room=` + `?edit=`).
- Scene: load bg + player textures + props per config; `applyFallbacks` in `create()`; static physics colliders from config + world bounds; WASD/arrows velocity ~140px/s; facing = texture swap left/right; `setDepth(y)` Y-sort; seat click within 48px → snap + `seatedSeatId`; any movement key unseats; placeholder speech bubble: page-level input (T focuses a bare HTML input) → text above player sprite.
- Scene public API for page: `getRoomConfigJson(): string`, `addProp(key: string, x: number, y: number): void`, `isEdit: boolean`.
- Delete old `BootScene.ts`/`CafeScene.ts`.
- Verify: build + typecheck PASS; browser: movement, seat snap, fallback rects visible; commit.

### Task 6: `?edit=true` layout editor
**Files:** modify `MainCafeScene.ts` (edit branch: grid overlay, draggable props/seats/spawn, HTML-input-driven prop add, JSON export), modify play page (bare toolbar: "prop key" input, "Add prop", "Copy room JSON", "Download room JSON" buttons — unstyled HTML).
- Drag updates config in memory; export stringifies validated config (runs `validateRoomConfig`; shows errors inline if invalid).
- Verify: browser — place prop, drag it, copy JSON, paste into `interior_1.json`, reload persists; commit.

### Task 7: Room picker + bare chat/pomodoro shells + Supabase stubs
**Files:** `src/app/cafe/page.tsx` (picker: 3 bare buttons + thumb `<img>` with fallback rect via CSS-less `onError` swap — plain JS, no styling), new `src/app/cafe/play/page.tsx` (session check + GameCanvas + edit toolbar + chat sidebar + pomodoro), `src/components/ChatSidebar.tsx` (disabled bare shell: "chat arrives with Supabase"), `src/components/PomodoroTimer.tsx` (local 25/5 bare timer, no styling), `src/lib/supabase/realtime.ts` (typed stubs: `useRoomPresence`, `broadcastMove`, `useTableChat`, `useSharedPomodoro` — return null when env missing; real wiring = Phase 3).
- Old `/cafe` game page moves to `/cafe/play`.
- Verify: picker renders 3 rooms (fallback rects for missing thumbs), play flow works; commit.

### Task 8: Verification pass
- `npm test`, `npm run typecheck`, `npm run build` all PASS.
- Browser: entry → picker → play; move; seat; edit mode add+drag+copy JSON; console error-free.
- Final self-review against Review Focus; commit any fixes.
