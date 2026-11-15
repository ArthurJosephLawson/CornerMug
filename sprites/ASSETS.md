# Corner Mug — Asset Inventory (YOU decide the counts)

**Rule:** the creator decides every asset, its subject, and its count. This file
is the record of that inventory. The engine imposes **format rules only**
(sizes, sheet layouts, layer names) — those live in `sprites/DESIGN.md` and do
not change without a loader update.

## Confirmed scope (creator decisions)

- **Maps:** 3 cafe interiors only — no larger world maps
- **Props:** character desks, laptops, cashier table
- **NPC:** one employee NPC whose job is help regarding how to play
- **Chat sprites:** no mouth movement (talking never animates the mouth)
- **Characters:** 2 facing files each (`_facingleft`, `_facingright`), no up/down art

## How to register an asset

Add one row per file you make: filename, size, what it is, phase (2/3/4).
Nothing loads in the game until you say it's ready.

## Format rules (fixed — from DESIGN.md)

| Category    | Fixed format |
|-------------|--------------|
| Characters  | 32x48 frames, sheet 4 cols x 4 rows (idle1, idle2, walk1, walk2 × down/up/left/right) |
| Tilesets    | 32x32 grid, one PNG per set, no gaps |
| Props       | free-size, tile-snapped (multiples of 16), transparent bg, anchor bottom-center |
| Maps        | Tiled orthogonal 32x32, JSON export, layers `floor`/`walls`/`props`/`collision`/`interactions` |
| UI          | draw at 2x, 9-slice assets keep 8px corners |
| Audio       | `.ogg` or `.mp3`, each < 300 KB, loops seamless |

## 1. Characters — sources `sprites/ase/characters/`, exports `sprites/png/characters/`

| Filename | Size | What it is | Phase |
|----------|------|------------|-------|
| _(yours)_ | | | |

## 2. Tilesets — sources `sprites/ase/tilesets/`, exports `sprites/png/tilesets/`

| Filename | Tiles included | Phase |
|----------|----------------|-------|
| _(yours)_ | | |

## 3. Props — sources `sprites/ase/props/`, exports `sprites/png/props/`

| Filename | Size | What it is | Phase |
|----------|------|------------|-------|
| _(yours)_ | | | |

## 4. Maps — `sprites/maps/`

| Filename | Tile dims | Phase |
|----------|-----------|-------|
| _(yours)_ | | |

## 5. UI — sources `sprites/ase/ui/`, exports `sprites/png/ui/`

| Filename | Draw size | What it is | Phase |
|----------|-----------|------------|-------|
| _(yours)_ | | | |

## 6. Audio — `sprites/audio/`

| Filename | Length | Type | Phase |
|----------|--------|------|-------|
| _(yours)_ | | | |

## Handoff signal

When your art is in place, tell me the inventory is ready (or just say "start
building"). I will then: scan `sprites/`, wire the Phaser loader to exactly the
files present, and build Phase 2 (map + movement + chair click) against your
assets — no invented art, no invented counts.
