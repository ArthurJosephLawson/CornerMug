# Corner Mug — Complete Asset Checklist

Every asset the game needs, one line each. Draw in any order; the **Phase**
column says when the game actually consumes it. Phase 2 = map + movement,
Phase 3 = multiplayer, Phase 4 = timers/games/audio/unlocks.
Filename column is the exact file to place in the folder (from
`sprites/DESIGN.md` naming rules). Sizes are per `sprites/DESIGN.md`.

## 1. Characters — `sprites/characters/`

All sheets: 128 x 192 (4 cols x 4 rows of 32x48 — idle1, idle2, walk1, walk2
per direction row: down/up/left/right).

| File             | Subject            | Phase | Notes |
|------------------|--------------------|-------|-------|
| `player.png`     | Player base        | 2     | One unisex base; recolors later |
| `player-alt1.png`| Player recolor A   | 3     | Optional variety |
| `player-alt2.png`| Player recolor B   | 3     | Optional |
| `barista.png`    | Barista NPC        | 4     | Behind counter |
| `cat.png`        | Sleeping cat       | 4     | 32x24 body is OK if you prefer, but 32x48 sheet keeps loader uniform |
| `patron-1.png`   | Ambient patron     | 4     | Reading |
| `patron-2.png`   | Ambient patron     | 4     | Laptop |
| `patron-3.png`   | Ambient patron     | 4     | Chatting |

## 2. Tilesets (backgrounds) — `sprites/tilesets/`

One grid image per file, tile size 32x32, no gaps (Tiled spacing 0).

| File                    | Contents                                                        | Phase |
|-------------------------|-----------------------------------------------------------------|-------|
| `cafe-tiles.png`        | Core cafe set — everything below in one sheet                    | 2     |
| ↳ floors                | wood plank x2 variants, tile/checker floor, floor shadow          | 2     |
| ↳ rug set               | 3x3 rug: 4 corners, 4 edges, center (9 tiles)                     | 2     |
| ↳ walls                 | wall face, wall top, 4 edge caps, baseboard                       | 2     |
| ↳ windows               | closed window (warm light), window sill                           | 2     |
| ↳ door                  | entrance door closed + open (1 tile wide, 2 tiles tall)           | 2     |
| ↳ counter               | bar counter face, bar top, 2 corner pieces                        | 2     |
| `cafe-tiles-night.png`  | Optional warm-dim variant set (future mood toggle)                | 4     |
| `booth-tiles.png`       | Private booth room set ( Phase 4 unlocks)                         | 4     |

## 3. Props — `sprites/props/`

Transparent background, tile-snapped sizes, anchored bottom-center.

| File                     | Size    | Phase | Notes |
|--------------------------|---------|-------|-------|
| `chair-down.png`         | 24 x 32 | 2     | Seat click target; 4 facings |
| `chair-up.png`           | 24 x 32 | 2     | |
| `chair-left.png`         | 24 x 32 | 2     | |
| `chair-right.png`        | 24 x 32 | 2     | |
| `table-round.png`        | 48 x 48 | 2     | ~1.5 tiles |
| `table-square.png`       | 32 x 32 | 2     | |
| `counter-mugs.png`       | 32 x 16 | 2     | Mug lineup on bar top |
| `mug-coffee.png`         | 16 x 16 | 3     | Appears on table after bar click |
| `mug-latte.png`          | 16 x 16 | 3     | |
| `mug-tea.png`            | 16 x 16 | 3     | |
| `floor-lamp.png`         | 16 x 32 | 2     | |
| `lamp-glow.png`          | 32 x 32 | 4     | Soft halo, semi-transparent |
| `plant-small.png`        | 16 x 24 | 2     | Decor |
| `plant-large.png`        | 24 x 48 | 2     | Corner decor |
| `book-stack.png`         | 16 x 16 | 4     | Study table dressing |
| `laptop-closed.png`      | 16 x 12 | 4     | |
| `game-tictactoe.png`     | 32 x 32 | 4     | Tabletop board |
| `game-connect4.png`      | 32 x 32 | 4     | Tabletop board |
| `game-pieces.png`        | 8 x 8 x N | 4   | Board pieces (X/O, red/yellow discs) |
| `sticky-notes.png`       | 16 x 16 | 4     | Scratchpad dressing |
| `icebreaker-card.png`    | 24 x 24 | 4     | Prompt card back |
| `vinyl-player.png`       | 32 x 32 | 4     | Ambience toggle dressing |
| `cat-bed.png`            | 24 x 24 | 4     | Where the cat sleeps |

## 4. Maps — `sprites/maps/`

Tiled exports, orthogonal, tile size 32x32, JSON format.
Layers: `floor`, `walls`, `props`, `collision`, `interactions`
(objects: `chair`, `table`, `bar`, `spawn`).

| File               | Size            | Phase | Notes |
|--------------------|-----------------|-------|-------|
| `cafe_map.json`    | 40 x 30 tiles   | 2     | Main room, single global lobby |
| `cafe_map_v2.json` | any             | 3     | Iterations after playtesting — replace v1 |
| `booth_map.json`   | ~20 x 15 tiles  | 4     | Private booth room |

## 5. UI — `sprites/ui/`

Draw at 2x listed size (engine draws at 1x). 9-slice assets: distinct corners,
plain inner area, engine insets 8px.

| File                    | Draw size    | Phase | Notes |
|-------------------------|--------------|-------|-------|
| `logo.png`              | 512 x 160    | 2     | Wordmark + mug mark |
| `favicon.png`           | 32 x 32      | 2     | Simple mug mark |
| `speech-bubble.png`     | 96 x 64      | 3     | 9-slice; rounded rect + tail |
| `badge-lounge.png`      | 48 x 48      | 3     | Open Lounge table badge |
| `badge-study.png`       | 48 x 48      | 3     | Study & Focus table badge |
| `entry-panel.png`       | 640 x 480    | 3     | 9-slice frame around login form |
| `button.png`            | 192 x 64     | 3     | 9-slice, normal state |
| `button-hover.png`      | 192 x 64     | 3     | |
| `nameplate.png`         | 96 x 24      | 3     | Under-avatar username tag |
| `timer-ring.png`        | 64 x 64      | 4     | Pomodoro dial frame |
| `booth-lock.png`        | 24 x 24      | 4     | PIN booth icon |

## 6. Audio — local files, < 300 KB each, `.ogg` or `.mp3`

Client-side loops only (blueprint §2C: local ambience toggles). Suggested
folder: `sprites/audio/` — add to DESIGN.md folder contract when wired.

| File                 | Length   | Phase | Notes |
|----------------------|----------|-------|-------|
| `rain-loop.ogg`      | 30–60 s  | 4     | Seamless loop |
| `vinyl-crackle.ogg`  | 30–60 s  | 4     | Seamless loop |
| `cafe-murmur.ogg`    | 60–90 s  | 4     | Seamless loop |
| `sit-down.ogg`       | < 1 s    | 3     | Chair click feedback (optional) |

## 7. NOT art (decided)

- No favicon SVG, no icon fonts — pixel PNGs only
- No background music tracks beyond the three ambience loops
- No tilesets for other biomes until a second room type exists

## Total count

- Phase 2 (game runs with your art): **~12 files** — `player.png`,
  `cafe-tiles.png`, `cafe_map.json`, 4 chairs, 2 tables, lamp, 2 plants, logo,
  favicon
- Phase 3: +9 (mugs lineup, speech bubble, badges, panels, buttons, nameplate)
- Phase 4: +everything else
