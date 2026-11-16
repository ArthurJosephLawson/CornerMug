# Corner Mug — Asset Inventory (YOU decide the counts)

**Rule:** the creator decides every asset, its subject, and its count. This
file is the record of that inventory. The engine imposes format rules only
(sizes, export scaling) — see `sprites/DESIGN.md`.

## Confirmed scope (creator decisions)

- **3 cafe interiors** — full-canvas backgrounds, drawn 320x180 (or 160x90),
  exported NN to 640x360, flat into `sprites/png/`
- **Characters:** 2 files each (`<name>_left.png`, `<name>_right.png`), no
  up/down art, no mouth animation
- **Props:** character desks, laptops, cashier table, chairs + creator's picks
- **1 employee NPC** for help regarding how to play
- **No Tiled, no sprite sheets** — placements made in `?edit=true` mode

## Finished assets

Register one row per exported PNG in `sprites/png/`.

### Interiors

| Filename | Draw size | Export scale | Done |
|----------|-----------|--------------|------|
| _(yours)_ | | | |

### Characters

| Filename | What it is | Export size | Done |
|----------|------------|-------------|------|
| _(yours)_ | | | |

### Props

| Filename | What it is | Export size | Solid? | Done |
|----------|------------|-------------|--------|------|
| _(yours)_ | | | | |

### UI / other

| Filename | What it is | Export size | Done |
|----------|------------|-------------|------|
| _(yours)_ | | | |

### Audio — `sprites/audio/`

| Filename | Length | Type | Done |
|----------|--------|------|------|
| _(yours)_ | | | |

## Room layouts

Placements (props, seats, colliders, spawn) are made visually in the game at
`/cafe/play?room=interior_1&edit=true` — drag, then "Copy room JSON", then
paste into `src/config/rooms/interior_N.json`. No coordinate tables needed.

## Handoff signal

Place PNGs in `sprites/png/`, register above, and the game picks them up on
next load. Missing files just show labeled colored rectangles.
