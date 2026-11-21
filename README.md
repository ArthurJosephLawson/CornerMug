<div align="center">

# ☕ CornerMug

**A cozy lo-fi pixel-art study & hangout space. Walk in, sit down, focus together.**

*Vite · React 18 · TypeScript · Supabase*

</div>

---

CornerMug is a browser-based multiplayer world for studying and hanging out. Pick an
avatar, walk into a pixel-art café, sit at a table with friends, and start a pomodoro —
with live chat, ambient sounds, and a presence system that shows exactly who is where.

## ✨ Features

- **Walkable pixel world** — a custom pure-TypeScript canvas engine (no game framework):
  sprite-sheet animation, depth sorting, collision, and a letterboxing camera.
- **Realtime multiplayer** — Supabase Realtime channels carry presence, movement, and
  chat. Seated players stay visible through a 2-second heartbeat, even when idle.
- **Room sharding** — every room holds **6 players per table**. When a table fills up,
  the next visitor is dropped into a fresh instance of the same map ("Table #2"),
  up to 10 tables. The dashboard sums live occupancy across all tables.
- **Public & personal spaces** — Café, Apartment, Office, Bar, and Restaurant public rooms
  plus a personal **My Room** bedroom with invite-link access.
- **Cook NPC menus** — stationary cooks in Café/Bar/Restaurant open a speech-bubble menu
  (E on desktop, tap on mobile) to buy dessert unlocks with money.
- **Friends** — send and accept friend requests, see every player on CornerMug,
  add people by exact username.
- **Study tools** — pomodoro timer that survives sign-in and room changes, focus-session
  tracking, hangout-time stats, ambient sound mixer (rain, fireplace, café hum...).
- **XP, money & ranks** — hangout XP, +500 XP per completed focus session, a new rank every
  500 XP, money wallet, and a shop/menu economy (kitten, money packs, dessert unlocks).
- **Progress dashboard** — rank/XP progress, wallet, study stats, and a 7-day active-time chart.
- **Dark mode** — Light/Dark toggle in Settings, persisted locally, flat theme (no gradients).
- **Letters** — the Info & Feedback page is a mail desk; sent letters stay in your mailbox.
- **Custom passwords** — replace the generated sign-in password in Settings, with a live
  strength meter.
- **Private rooms** — create a room, get a shareable key like `COZY-3SN`, and only
  people with the key get in.
- **Admin tools** — an `is_admin` flag with RLS-enforced RPCs behind `/admin`.
- **Works everywhere** — WASD + E on desktop; on-screen joystick and tap controls on phones/tablets.

## 🧱 Tech stack

| Layer      | Choice                                              |
| ---------- | --------------------------------------------------- |
| Build      | Vite 5                                              |
| UI         | React 18 + react-router-dom, Tailwind CSS 3.4       |
| Language   | TypeScript (strict)                                 |
| Backend    | Supabase — Postgres, Auth (email + password), RLS   |
| Realtime   | Supabase Realtime (broadcast + presence)            |
| Icons      | lucide-react                                        |

The game engine (`src/engine/`) is deliberately decoupled from React: entities, input,
camera, and rendering are plain TypeScript classes; React only hosts the canvas and
mirrors the peer roster.

## 🚀 Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev                  # http://localhost:5173
```

Other scripts:

```bash
npm run typecheck   # tsc --noEmit
npm run build       # production build into dist/
npm run preview     # serve the production build locally
```

### Database setup

Base schema and feature migrations live in [`docs/`](docs/). For this update, follow
[`docs/migration-runbook.md`](docs/migration-runbook.md) for the recommended run order and
post-run checks (progress/shop/focus/activity, admin grants, bedroom access).

## ☁️ Deploying

Any Vercel-compatible host works. A `vercel.json` is included with SPA rewrites so
deep links like `/room/public-cafe` survive a refresh.

1. Push to GitHub and import the repo on [Vercel](https://vercel.com).
2. Set environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Add the deployed URL to your Supabase Auth **Site URL** / redirect list.

## 📁 Structure

```
src/
├── engine/          # pure-TS game engine (loop, input, camera, entities, world)
├── components/      # React UI — room HUD, dashboard cards, friends, ui kit
├── hooks/           # room connection (shard probing), occupancy, timers
├── pages/           # routed pages
├── services/        # Supabase data access
├── types/           # engine + network types
└── config/          # room definitions, sprite manifest paths, theme
public/sprites/      # pixel art + manifest.json
```

## 🪪 Credits

Created by **Arthur Joseph Lawson** [@monk_mango] — **Scriptmonks**.
