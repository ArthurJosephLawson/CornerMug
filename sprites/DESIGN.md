# Corner Mug — Design Settings (the creator's art bible)

Everything visual in Corner Mug is drawn by the creator in LibreSprite.
This doc pins the exact canvas sizes, export scaling, and world sizes the
Phaser engine expects. Change a number here → change it in the loader.
`ASSETS.md` records the creator's inventory; counts stay creator-owned.

**Core workflow:** draw small in LibreSprite → export Nearest-Neighbor scaled
PNGs into `sprites/png/` (flat). The engine loads `/sprites/<file>.png` and
displays at the WORLD sizes below (any 2x/4x export scale works — the engine
forces display size).

---

## 1. Global rules

| Setting            | Value                                   | Why |
|--------------------|-----------------------------------------|-----|
| World space        | **640 x 360 px**                        | Room fills the viewport; camera is static |
| Interior draw size | **320 x 180 px** (or 160 x 90 px)       | Small canvas suits the art style |
| Interior export    | NN scale 200% (or 400%) → **640 x 360** | Exact world size |
| Room preview thumb | **160 x 90 px** (`_thumb.png`)          | Room picker previews |
| Character world size | **32 x 48 px** (logical 16 x 24)      | 1 tile wide, 1.5 tiles tall at world scale |
| Character export   | NN 200% → 32 x 48, or 400% → 64 x 96    | Engine forces 32 x 48 display |
| Prop world size    | multiples of 16, max 96 x 128           | Registered per-prop in room JSON |
| Prop export        | NN 200%/400% of logical size            | Engine forces registered world size |
| Pixel scale        | nearest-neighbor only, integer zoom     | Phaser `pixelArt: true` + `roundPixels: true` |
| Palette size       | 16–24 colors per asset family           | Cozy = limited palette |
| Outline style      | 1px selective outline (dark, not black) | Reads at small size |

Export settings for every PNG: PNG-24 with transparency (interiors may be
opaque), no antialiasing, nearest-neighbor scaling, lowercase-hyphen-free
underscore naming (`interior_1.png`, `male_left.png`). Never upscale in a
non-NN resampler.

**No Tiled. No sprite sheets. Single-image exports only.**

## 2. Suggested core palette (starter set — yours to replace)

```
Wood dark   #3B2B20    Wood mid    #5C4033    Wood light  #8B5E3C
Floor cream #D9C7A7    Floor warm  #C4A882
Wall cream  #EFE3CE    Wall shadow #B9A88C
Accent rust #A8574E    Accent sage #7A8B6F    Accent amber #D9A05B
Espresso    #2A1E17    Steam/milk  #F5EFE6
UI ink      #3A2E24    UI paper    #FAF3E3
```

## 3. Characters — `sprites/png/<name>_left.png` + `<name>_right.png`

Two files per character. Each file = **one frame, logical 16 x 24**
(export 32 x 48 at 2x, or 64 x 96 at 4x). No sheets, no walk-cycle frames —
the engine slides the sprite and flips textures for direction.

- File naming: `male_left.png`, `male_right.png`, `employee_left.png`,
  `employee_right.png`, etc.
- No up/down art exists. Moving up/down keeps the last horizontal facing.
- Sprites never move mouths while chatting — static art is final.
- Feet at the bottom edge of the frame (feet = tile anchor).

Engine behavior: `<name>_left.png` for leftward facing, `<name>_right.png`
for rightward, horizontal flip when needed. World display always 32 x 48.

## 4. Interiors — `sprites/png/interior_N.png` + `interior_N_thumb.png`

One full-canvas background per room. Draw at 320 x 180 (or 160 x 90), export
NN-scaled to **640 x 360** (fills the world exactly). Walls are painted into
the background; solid zones are marked later with the `?edit=true` tool, not
drawn.

Three interiors: `interior_1`, `interior_2`, `interior_3` + matching
`interior_1_thumb.png` (160 x 90) each.

## 5. Props — `sprites/png/<prop_key>.png`

Transparent background, logical size a multiple of 8, world size a multiple
of 16 (max 96 x 128), anchored bottom-center. Export 2x/4x.

Confirmed creator scope: character desks, laptops, cashier table, chairs —
plus anything else the creator adds. The prop key = PNG filename (without
extension) = the key used in room JSON and the `?edit=true` placer.

## 6. Room JSON — `src/config/rooms/interior_N.json`

Replaces Tiled entirely. Object fields (world coords, bottom-center anchors):

- `backgroundKey`: `"interior_1"`
- `backgroundSize`: `{ "width": 640, "height": 360 }`
- `spawn`: `{ "x": 320, "y": 180 }` (entry point)
- `colliders`: `[{ "x", "y", "width", "height" }]` — wall/solid rects (top-left anchored)
- `props`: `[{ "key", "x", "y", "width", "height", "solid" }]` — placed sprites
- `snapSeats`: `[{ "id", "x", "y", "facing": "left"|"right", "tableId" }]` — seats

Placements are made visually in `?edit=true` mode and exported as JSON —
no hand-written coordinates needed.

## 7. UI — `sprites/png/`

Creator decides every asset. Draw at 2x. 9-slice assets keep distinct corners
(engine insets 8px). Suggested finals: favicon 32x32, logo 256x80, speech
bubble base 48x32, vibe badges 24x24, panels 320x240, buttons 96x32,
nameplate 96x24, Pomodoro ring 64x64.

## 8. Audio — `sprites/audio/`

`.ogg`/`.mp3`, each < 300 KB, seamless loops. Creator decides the set.

## 9. Fallback rule (engine-enforced)

Any expected PNG missing from `sprites/png/` renders as a labeled colored
rectangle at its world size. The game always runs — art arrives whenever the
creator finishes it. The rectangle names the missing file.
