# Corner Mug — Custom Sprites Directory

All art in this project is hand-crafted by the project creator. **Every file
here is designed and drawn manually — nothing is generated.**

## Two-track folder structure

```
sprites/
├── ase/          ← YOUR sources (.ase, Aseprite) — never loaded by the engine
│   ├── characters/
│   ├── tilesets/
│   ├── props/
│   └── ui/
├── png/          ← engine-ready PNGs (converted from your .ase by the agent)
│   ├── characters/
│   ├── tilesets/
│   ├── props/
│   └── ui/
├── maps/         ← your Tiled exports (cafe_map.json etc.)
├── audio/        ← ambience loops (.ogg/.mp3, < 300 KB each)
├── DESIGN.md     ← fixed size rules per sprite type
└── ASSETS.md     ← the inventory you register as you draw
```

Workflow: you draw in Aseprite and drop `.ase` files into `sprites/ase/<type>/`.
When you say you're done, the agent converts every `.ase` to the engine-ready
PNG (correct size, sheet layout per `DESIGN.md`) and places it in
`sprites/png/<type>/`. The engine loads **only** files under `sprites/png/` and
`sprites/maps/` — nothing else touches your sources.

## Loading files from Phaser

The root `sprites/` folder is exposed at the `/sprites` URL via a symlink in
`public/sprites`, so Phaser loads art with standard URL paths:

```js
this.load.spritesheet('hero', '/sprites/png/characters/default_man.png', { frameWidth: 32, frameHeight: 48 });
this.load.image('tiles', '/sprites/png/tilesets/cafe-tiles.png');
this.load.tilemapTiledJSON('cafe', '/sprites/maps/cafe_map.json');
```

URL pattern: `/sprites/png/<folder>/<filename>` and `/sprites/maps/<filename>`.

## Aseprite notes for your sources

- Character `.ase`: one file per character; frames in order
  idle1, idle2, walk1, walk2 for each direction (down, up, left, right —
  16 frames total), OR one `.ase` per facing — the agent assembles the
  128 x 192 sheet at conversion either way.
- Keep feet at the bottom edge of the 32x48 frame; no pixels outside the canvas.
- `.ase` files are committed as-is — no export needed from you.

If Vercel ever has trouble serving the symlink at deploy time, the fallback is
a copy step (`scripts/sync-sprites.mjs` copying `sprites/` → `public/sprites/`
before `dev`/`build`) — do not add it unless needed.
