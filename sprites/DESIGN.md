# Corner Mug — Design Settings (the creator's art bible)

Everything visual in Corner Mug is designed by you. This doc pins the exact
dimensions, layouts, and export settings the game engine expects, so your art
drops straight in without rework. Change a number here → change it in the
loader. Keep this file updated as decisions settle.

---

## 1. Global canvas rules

| Setting          | Value                              | Why |
|------------------|------------------------------------|-----|
| Tile size        | **32 x 32 px**                     | World unit for tilesets + Tiled map |
| Character frame  | **32 x 48 px**                     | Taller than a tile, feet on tile edge |
| Design viewport  | **960 x 544 px** (30 x 17 tiles)   | Reference framing; camera follows the player |
| Pixel scale      | 1:1 in-world, integer zoom only    | Never half-pixel scaling |
| Palette size     | **16–24 colors** per asset family  | Cozy = limited palette. Reuse, don't invent |
| Outline style    | 1px selective outline (dark, not black) | Reads at small size |
| Rendering mode   | Nearest neighbor, `image-rendering: pixelated` | Already enforced by Phaser `pixelArt: true` |

Export settings for every PNG:
- PNG-24 with transparency (no background fill)
- No antialiasing / no feathering on pixel edges
- Filenames: lowercase, hyphens (`cafe-floor-wood.png`)
- Never upscale in an image editor — draw at final size

## 2. Suggested core palette (starter set — yours to replace)

Cozy cafe, warm and low-saturation:

```
Wood dark   #3B2B20    Wood mid    #5C4033    Wood light  #8B5E3C
Floor cream #D9C7A7    Floor warm  #C4A882
Wall cream  #EFE3CE    Wall shadow #B9A88C
Accent rust #A8574E    Accent sage #7A8B6F    Accent amber #D9A05B
Espresso    #2A1E17    Steam/milk  #F5EFE6
UI ink      #3A2E24    UI paper    #FAF3E3
```

Pick your own — the constraint is: one wood family, one floor family, 2–3
accents, 1 dark ink. ~16 colors total.

## 3. `sprites/png/characters/` — 32x48 sheets (sources in `sprites/ase/characters/`)

Every character (player, NPCs later) uses the same sheet layout so one loader
handles all of them:

```
Sheet: 128 x 192 px  (4 columns x 4 rows of 32x48 frames)

        col1        col2        col3        col4
row1    down-idle1  down-idle2  down-walk1  down-walk2
row2    up-idle1    up-idle2    up-walk1    up-walk2
row3    left-idle1  left-idle2  left-walk1  left-walk2
row4    right-idle1 right-idle2 right-walk1 right-walk2
```

- Idle frames = tiny breathing/bob (1px body shift is enough)
- Walk frames = contact poses (feet apart), 2-frame shuffle reads fine top-down
- Feet touch the **bottom edge** of the 32x48 frame (feet = tile anchor)
- Mirror trick allowed: left frames can be flipped rights, but if you do,
  still export both so the sheet stays uniform
- You decide the cast and its size — register each sheet in `ASSETS.md`

Loader reference (Phase 2 wires this):
```js
this.load.spritesheet(key, `/sprites/characters/${file}.png`, { frameWidth: 32, frameHeight: 48 });
// anims: idle = frames 0-1 @ 2fps loop, walk = frames 2-3 @ 6fps loop, per direction row
```

## 4. `sprites/png/tilesets/` — 32x32 tiles (sources in `sprites/ase/tilesets/`)

One tileset image, grid-aligned, no gaps/margins (Tiled spacing 0):

```
cafe-tiles.png  — tile size 32x32, any sheet size multiple of 32
```

Minimum requirements for Phase 2 to run (the floor, not the ceiling — you
decide everything beyond these):

- at least 1 floor tile type
- at least 1 wall tile type
- 1 door tile (2 tiles tall)

Everything else — rug sets, windows, counter pieces, detail tiles — is your
call. Register each tileset PNG in `ASSETS.md` with the tiles it contains.

Tip: draw floors first, walls second, counter last. The cafe reads on floor +
walls alone; furniture is dressing.

## 5. `sprites/png/props/` — interactive + decorative items (sources in `sprites/ase/props/`)

Free-size, but keep sizes tile-snapped (multiples of 16, anchored bottom-center
so they sit on floor tiles). Draw each on transparent background.

Format rules only — sizes are fixed, you decide every prop, its subject, and
its count:

| Prop type | Size |
|-----------|------|
| Small items (mugs, books, cards, board pieces) | 16 x 16 |
| Chair (any facing) | 32 x 32 |
| Square table / game boards / vinyl player / cat bed | 32 x 32 |
| Tall props (plants, lamps) | 16 x 32, 24 x 32, 24 x 48, 32 x 48 |
| Large furniture (round/long tables, counter pieces) | 48 x 48, 48 x 64 |
| Halos/glows | 32 x 32 or 48 x 48, semi-transparent |

Every edge a multiple of 16; never exceed 48 x 64. Anchor bottom-center.
Register each prop in `ASSETS.md`. Interactive props (chairs, tables, counter,
games) get their behavior from `interactions` objects in the Tiled map — name
them whatever you like and tell me the mapping, or use the defaults above.

## 6. `sprites/maps/` — Tiled setup

Map settings in Tiled (map → new):
- Orientation: **Orthogonal**, tile size **32 x 32**
- Size: start with **40 x 30 tiles** (1280 x 960 world) — one cozy room, no scrolling mazes
- Export: **JSON** as `sprites/maps/cafe_map.json`

Layers (exact names — the loader keys on these):

| Layer (order)      | Type      | Contents |
|--------------------|-----------|----------|
| `floor`            | tile      | Floors, rugs |
| `walls`            | tile      | Walls, windows, door |
| `props`            | tile      | Counter, static furniture |
| `collision`        | tile      | Invisible tiles marking solid cells |
| `interactions`     | object    | Object layer: `chair` (all seats), `table` (zones), `bar` (counter click zone), `spawn` (single point) |

Object rules on `interactions`:
- Every chair = object type `chair`, 1 per seat
- `spawn` = one point object, default entry position
- Table zones = rectangles; players seated at chairs inside a zone share table chat

## 7. `sprites/png/ui/` — interface assets (sources in `sprites/ase/ui/`)

Bare HTML now, styled by you later. You decide every asset and its count.
Draw at 2x for crispness (retina) — engine draws at 1x.

Fixed sizes (engine draws at 1x):

| Asset | Final size (draw at 2x) |
|-------|-------------------------|
| Favicon | 32 x 32 |
| Logo | 256 x 80 |
| Speech bubble (9-slice base) | 48 x 32 |
| Vibe badges | 24 x 24 |
| Entry panel / any panel (9-slice) | 320 x 240 |
| Buttons (9-slice) | 96 x 32 |
| Nameplate | 96 x 24 |
| Pomodoro ring | 64 x 64 |
| Small icons | 24 x 24 |

9-slice assets: distinct corners, plain inner area, engine insets 8px per side.
Register each UI asset in `ASSETS.md`.

## 8. Asset checklist (draw in this order)

1. `cafe-tiles.png` floor + walls
2. `cafe_map.json` rough draft in Tiled (floor + walls + collision)
3. Character base sheet (`player.png`)
4. Chairs + tables (`props/`)
5. Bar counter + mugs
6. Speech bubble + logo (`ui/`)
7. Polish pass: rug, windows, lamp glow, patrons

Phase 2 needs: tiles 1, map 2, player 3, chairs 4.
Everything else can arrive while the game already runs.
