# AGENTS.md — Corner Mug

## Project Overview
Corner Mug is a cozy, browser-based 2D top-down pixel-art virtual cafe where people around the world drop in to hang out, chat, and study together.
- Full product vision and roadmap: `@idea.md`
- Core rule: NO video or voice streaming. Pure lightweight text chat, proximity table seating, ambient audio, and 2D avatar movement.

## Strict Creative & Scope Boundaries (CRITICAL)
1. **NO Art or Logo Generation:** Do NOT generate SVGs, pixel art PNGs, logos, icons, or canvas-drawn character art. The project creator is designing all sprites, maps, and logos manually.
2. **NO Premature UI Styling:** Do NOT design custom themes, decorative layouts, or polished CSS styling. Keep UI components bare-bones, unstyled/minimal HTML shells so the creator can design and specify the UI later.
3. **Custom Art Folder (`sprites/`):** Organize all art and map directories cleanly inside a root `sprites/` folder (`sprites/characters/`, `sprites/tilesets/`, `sprites/props/`, `sprites/maps/`, `sprites/ui/`) and configure the build/asset loader so Phaser 3 loads directly from this organized structure.
4. **Foundation First:** When initializing the project, ONLY scaffold the organized folder architecture, configuration files, entry validation logic, and foundational stub files. Do NOT build out full game mechanics until explicitly instructed.

## Entry & Identity Rules (Zero-Account System)
- **NO Login, NO Sign-Up, NO Passwords, NO Auth Providers.**
- Users enter the cafe via a lightweight two-field entry gate:
  1. **Gmail Address:** Must be validated on both client and server (Next.js API route) to confirm it is a legitimate, properly formatted `@gmail.com` address with active Google MX records (`dns.resolveMx('gmail.com')` / format checks, blocking disposable domains or fake formats) before issuing an instant session token.
  2. **Username:** Chosen display name for the session (3–16 alphanumeric/underscore characters).
- Store the verified session lightly in `sessionStorage` / Supabase Presence metadata so users can hop right into a cafe room.

## Tech Stack & $0 Production Constraints
- **Framework:** Next.js (App Router) + TypeScript (deployed free on Vercel).
- **Game Engine:** Phaser 3 (HTML5 Canvas, crisp pixel rendering: `pixelArt: true`, `roundPixels: true`).
- **Multiplayer & Backend:** Supabase Free Tier (Supabase Realtime Broadcast + Presence for avatar `(x, y)` sync, seating state, and table-scoped chat).
- **Audio:** Local lightweight `.ogg`/`.mp3` loops (< 300KB each) — no external streaming APIs.

## Coding Conventions
- Keep Phaser game logic cleanly separated inside `src/game/` (`scenes/`, `entities/`, `network/`, `config/`) and bare-bones React HUD shells inside `src/components/`.
- Use TypeScript strict mode; avoid `any`.
- Throttle avatar movement broadcasts to ~10–15 updates/sec so Supabase free-tier quotas stay near zero.

## Build & Verification Commands
- Install: `npm install`
- Dev server: `npm run dev`
- Typecheck & Build: `npm run build`
