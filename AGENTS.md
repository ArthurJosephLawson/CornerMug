# AGENTS.md — Corner Mug

## Project Overview
Corner Mug is a cozy, browser-based 2D pixel-art virtual cafe where people drop in to hang out, chat, and study together.
- Full product vision and roadmap: `blueprint.md`
- Core rule: NO video or voice streaming. Text chat, proximity table seating, ambient audio, 2D avatar movement only.

## Division of Labor (STRICT)

### Creator's Role (Artist)
- Hand-draws 100% of visual assets in **LibreSprite**. Sources live in `sprites/ase/` — the engineer never touches, converts, or deletes these.
- Interiors are drawn at **320x180 px** (or 160x90 px) — small canvases suit the art style — then exported with **Nearest-Neighbor scaling (200% or 400%)** to **640x360 px** into `sprites/png/`. Each interior also gets a **160x90 px** `_thumb.png` for room previews.
- Characters and props are exported as matching **2x or 4x scaled PNGs**.
- **Never uses Tiled and never makes sprite sheets.** Plain single-image exports only.

### Engineer's Role (OpenCode)
- All Next.js App Router code, TypeScript types, Phaser 3 engine logic.
- `?edit=true` visual map tooling (prop/seat/collider placement + room JSON export).
- Supabase Realtime multiplayer: presence, broadcast movement, table-scoped chat, shared Pomodoro sync.
- Vercel deployment readiness.
- Room layout JSON lives in `src/config/rooms/` (replaces Tiled entirely).

## Strict Asset Rules (CRITICAL)
1. **The engineer MUST NEVER generate pixel art, SVG illustrations, icons, logos, or any custom art asset.**
2. **Graceful fallback rule:** whenever an expected PNG in `sprites/png/` is missing (creator still drawing it), the Phaser loader falls back to **clean, labeled colored rectangles** at the asset's world size, so the game runs and tests cleanly at every stage.
3. UI stays bare-bones unstyled HTML shells — the creator designs all UI later.
4. No login, no passwords, no OAuth — Gmail + Username gate only (see `src/app/api/verify-entry`).

## Asset Structure
```
sprites/
├── ase/        ← creator's raw LibreSprite sources (DO NOT touch or delete)
├── png/        ← creator's exported PNGs (FLAT): interior_1.png, interior_1_thumb.png,
│                  male_left.png, male_right.png, transparent props, etc.
├── audio/      ← optional cozy ambient loops (< 300 KB each)
├── DESIGN.md   ← exact size/export rules per asset type
├── ASSETS.md   ← creator's asset inventory record
└── README.md   ← sprite folder workflow
```
- `public/sprites` is a symlink to `sprites/png/` — assets serve at `/sprites/<file>.png`.
- Character naming: `<name>_left.png` / `<name>_right.png` (two files per character). No up/down art; up/down movement keeps last horizontal facing; horizontal texture flipping handles direction. Sprites never move mouths while chatting.
- Exact canvas sizes and export settings: `sprites/DESIGN.md`.

## Tech Stack ($0 Production)
- **Framework:** Next.js (App Router) + TypeScript — free on Vercel.
- **Game Engine:** Phaser 3 (`pixelArt: true`, `roundPixels: true`, world space 640x360).
- **Multiplayer:** Supabase Realtime free tier (presence, broadcast, chat channels).
- **Audio:** local `.ogg`/`.mp3` loops < 300 KB.

## Game Structure Rules
- World logic in `src/game/` (`scenes/`, `config/`, `fallback.ts`, `PhaserGame.ts`); React shells in `src/components/`; room JSON in `src/config/rooms/`; shared types in `src/types/`.
- Room JSON (`interior_1..3.json`): background key, wall colliders, prop coordinates + solid flags, `table_id` snap-seats, spawn.
- Y-sorting by sprite `y` for depth; seats snap within proximity; movement unseats.
- TypeScript strict; no `any`.

## Build & Verification
- Install: `npm install`
- Dev: `npm run dev`
- Tests: `npm test` (Vitest)
- Typecheck: `npm run typecheck`
- Build: `npm run build`
