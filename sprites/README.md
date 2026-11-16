# Corner Mug — Sprites Folder Workflow

All art is hand-drawn by the creator in LibreSprite. **Nothing is generated.**
Sources are never touched by the engineer.

## Folder layout

```
sprites/
├── ase/          ← creator's raw LibreSprite sources — DO NOT touch or delete
├── png/          ← creator's exported PNGs (FLAT — no subfolders)
├── audio/        ← optional ambient loops
├── DESIGN.md     ← exact size/export rules per asset type
├── ASSETS.md     ← creator's asset inventory record
└── README.md     ← this file
```

## Creator workflow

1. Draw in LibreSprite at the small canvas (`sprites/DESIGN.md` sizes):
   interiors 320x180, characters 16x24, props multiples of 8.
2. Export with **Nearest-Neighbor** scaling (200% or 400%) as PNG directly
   into `sprites/png/` — flat, e.g.:
   - `interior_1.png` (640x360) + `interior_1_thumb.png` (160x90)
   - `male_left.png`, `male_right.png` (32x48 or 64x96)
   - `desk.png`, `laptop.png`, `cashier_table.png`, ...
3. Register each finished file in `sprites/ASSETS.md`.
4. **No Tiled. No sprite sheets.** Room layouts are made visually in the
   game's `?edit=true` mode (drag props/seats, export room JSON).

## Engine workflow (engineer)

- `public/sprites` is a symlink to `sprites/png/` — assets serve at
  `/sprites/<file>.png`.
- Phaser loads exactly the files referenced by `src/config/rooms/*.json` plus
  the player textures. A missing PNG renders as a labeled colored rectangle
  at its world size — the game always runs.
- Prop/seat/spawn placements come from `?edit=true` exports saved into
  `src/config/rooms/interior_N.json`.

## Serving note

The symlink exposes only `sprites/png/` (not `ase/`). If Vercel ever has
trouble serving it at deploy time, the fallback is a copy step wired to
`predev`/`prebuild` — do not add unless needed.
