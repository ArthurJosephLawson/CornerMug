# Corner Mug — Custom Sprites Directory

All art in this project is hand-crafted by the project creator. **Every file here
is designed and drawn manually — nothing is generated.** Drop your files into the
matching folder and the game engine (Phaser 3) will load them automatically.

## Folder contract

| Folder          | What goes here                                                        | Specs |
|-----------------|-----------------------------------------------------------------------|-------|
| `characters/`   | Character sprite sheets                                               | 32x48 px per frame, 2-frame idle, 2-frame walk |
| `tilesets/`     | Environment tiles: floors, walls, windows, furniture                  | 32x32 px per tile |
| `props/`        | Interactive items: coffee mugs, tabletop games, lamps, chairs, tables | Free-size, pixel art |
| `maps/`         | Tiled Map Editor exports                                              | `cafe_map.json` with collision layer + interactive chair/table zones |
| `ui/`           | Logo and UI graphics                                                  | Free-size |

`.gitkeep` files are placeholders — delete them when a folder gets real files.

## Loading files from Phaser

The root `sprites/` folder is exposed at the `/sprites` URL via a symlink in
`public/sprites`, so Phaser loads your art with standard URL paths:

```js
load.spritesheet('hero', '/sprites/characters/hero.png', { frameWidth: 32, frameHeight: 48 });
load.image('tiles', '/sprites/tilesets/cafe_tiles.png');
load.tilemapTiledJSON('cafe', '/sprites/maps/cafe_map.json');
```

URL pattern: `/sprites/<folder>/<filename>`.

## Naming suggestions

- `characters/`: one sheet per character, e.g. `hero.png`, `barista.png`
- `tilesets/`: one image per tileset, e.g. `cafe_tiles.png`
- `maps/`: `cafe_map.json` (the Tiled export) — keep any tileset images it
  references inside `tilesets/`
- `ui/`: `logo.png`, and per-screen UI graphics

If Vercel ever has trouble serving the symlink at deploy time, the fallback is a
copy step (`scripts/sync-sprites.mjs` copying `sprites/` → `public/sprites/`
before `dev`/`build`) — do not add it unless needed.
