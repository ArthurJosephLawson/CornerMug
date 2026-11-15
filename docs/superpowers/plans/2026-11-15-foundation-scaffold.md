# Corner Mug — Phase 1 Foundation Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Corner Mug project foundation — organized `sprites/` tree, Next.js + TypeScript config, Supabase client stubs, Gmail + Username verification API route, bare-bones entry shell, and an empty Phaser 3 canvas mount.

**Architecture:** Next.js App Router hosts two pages: `/` (entry gate form) and `/cafe` (Phaser canvas mount). `POST /api/verify-entry` validates Gmail format + gmail.com MX records server-side and returns a lightweight session token stored in `sessionStorage`. Phaser boots with zero assets loaded — it is an empty canvas ready to receive custom sprites from `sprites/`.

**Tech Stack:** Next.js (App Router, latest stable), TypeScript strict, Phaser 3, `@supabase/supabase-js`, Vitest.

**Spec:** `blueprint.md` (Phase 1) + `AGENTS.md` (scope boundaries).

## Global Constraints (from AGENTS.md — all tasks)

- NO generated art of any kind: no SVG, no pixel art PNGs, no logos, no icons, no canvas-drawn art. All empty asset folders get the user's hand-made files later.
- NO styled UI: all React shells are bare-bones semantic HTML. No custom themes, no decorative CSS, no CSS frameworks. `globals.css` contains only a minimal reset if needed.
- NO auth: no passwords, no OAuth, no Supabase Auth. Entry gate is Gmail + Username only.
- `sprites/` lives at project root, not inside `public/`. Phaser loads assets via `/sprites/...` URLs (see Task 3).
- Phaser config MUST include `pixelArt: true` and `roundPixels: true`.
- Username: 3–16 chars, `[A-Za-z0-9_]` only.
- Game logic lives in `src/game/` (`scenes/`, `entities/`, `network/`, `config/`); React HUD shells in `src/components/`. TypeScript strict; no `any`.
- Movement broadcasting, multiplayer, chat, mini-games, NPCs: explicitly OUT OF SCOPE for this plan.

## Review Focus

- **Non-gmail domains** (`@outlook.com`, `@gmail.co`, `@foo@gmail.com`) must be rejected — pinned by test in Task 4.
- **Malformed Gmail local parts** (leading/trailing dot, consecutive dots, missing local part) must be rejected — pinned by Task 4 tests.
- **Username boundary cases** (2 chars, 17 chars, spaces, hyphens, unicode) must be rejected — pinned by Task 4 tests.
- **Missing Supabase env vars** must fail with a clear named error, not `undefined` propagation — pinned by test in Task 5.
- **Visiting `/cafe` with no session** must redirect back to `/`, not crash the Phaser mount — pinned by manual check in Task 7.

---

## Directory Tree (complete, after all tasks)

```
CornerMug/
├── AGENTS.md                          (exists)
├── blueprint.md                       (exists)
├── docs/
│   └── superpowers/plans/2026-11-15-foundation-scaffold.md   (this plan)
├── package.json
├── tsconfig.json
├── next.config.mjs
├── .gitignore
├── .env.example
├── vitest.config.ts
├── public/
│   └── sprites -> ../sprites          (symlink; serves root sprites/ at /sprites)
├── sprites/
│   ├── README.md                      (where each custom file goes + specs)
│   ├── characters/.gitkeep            (32x48 sheets, 2-frame idle, 2-frame walk)
│   ├── tilesets/.gitkeep              (32x32 environment tiles)
│   ├── props/.gitkeep                 (mugs, tabletop games, lamps)
│   ├── maps/.gitkeep                  (Tiled exports: cafe_map.json)
│   └── ui/.gitkeep                    (logo + UI graphics)
└── src/
    ├── app/
    │   ├── layout.tsx                 (root layout, plain <html><body>)
    │   ├── globals.css                (minimal reset only, nothing decorative)
    │   ├── page.tsx                   (entry gate page — renders EntryForm)
    │   ├── cafe/
    │   │   └── page.tsx               (session check + GameCanvas mount)
    │   └── api/
    │       └── verify-entry/
    │           └── route.ts           (POST: gmail + username verification)
    ├── components/
    │   ├── EntryForm.tsx              (bare 2-field HTML form, client component)
    │   └── GameCanvas.tsx             (client component, mounts Phaser)
    ├── game/
    │   ├── config/
    │   │   └── gameConfig.ts          (Phaser.Types.Core.GameConfig)
    │   ├── PhaserGame.ts              (createGame(parent) factory)
    │   └── scenes/
    │       ├── BootScene.ts           (empty stub scene)
    │       └── CafeScene.ts           (empty stub scene)
    ├── lib/
    │   ├── entryValidation.ts         (gmail format + username rules, pure fns)
    │   ├── gmailDns.ts                (dns MX check wrapper, injectable for tests)
    │   ├── session.ts                 (sessionStorage helpers + SessionData type)
    │   └── supabase/
    │       ├── client.ts              (browser client factory)
    │       └── server.ts              (route-handler client factory)
    └── types/
        └── entry.ts                   (shared request/response types)
```

**Deliberately NOT created:** `entities/`, `network/` under `src/game/` (no gameplay yet — create when needed); any image/svg/asset file; any Supabase table/migration; styled components; favicon art (default Next favicon only or none).

---

### Task 1: Project scaffold — Next.js + TypeScript + git

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

**Interfaces:**
- Produces: `npm run dev`, `npm run build`, `npm run typecheck` scripts. Empty `/` page rendering "Corner Mug" text. `next@15` / `react@19` latest stable at install time.

- [ ] **Step 1:** `git init` in project root.
- [ ] **Step 2:** Write `package.json` with deps: `next`, `react`, `react-dom`, `phaser`, `@supabase/supabase-js`; devDeps: `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `vitest`. Scripts: `dev`, `build`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`).
- [ ] **Step 3:** Write `tsconfig.json` — strict mode, `paths` alias `@/*` -> `src/*`, `"moduleResolution": "bundler"`, plugin `next`. Write `next.config.mjs` (empty config object for now). Write `.gitignore` (node_modules, .next, .env*.local).
- [ ] **Step 4:** Write `src/app/layout.tsx` (plain html/body, imports globals.css, `<title>Corner Mug</title>`) and `src/app/page.tsx` rendering only `<p>Corner Mug</p>`. `globals.css`: box-sizing reset only, zero decorative styling.
- [ ] **Step 5:** `npm install`
- [ ] **Step 6:** Run `npm run build` — Expected: PASS.
- [ ] **Step 7:** Commit: `git add -A && git commit -m "feat: scaffold Next.js + TypeScript foundation"`

### Task 2: sprites/ directory tree + README

**Files:**
- Create: `sprites/README.md`, `sprites/characters/.gitkeep`, `sprites/tilesets/.gitkeep`, `sprites/props/.gitkeep`, `sprites/maps/.gitkeep`, `sprites/ui/.gitkeep`

**Interfaces:**
- Produces: documented folder contract — `characters/` = 32x48 sheets, `tilesets/` = 32x32 tiles, `props/` = interactive items, `maps/` = Tiled JSON (`cafe_map.json`) with collision + chair/table zones, `ui/` = logo/UI graphics.

- [ ] **Step 1:** Create the five folders with `.gitkeep` files.
- [ ] **Step 2:** Write `sprites/README.md` (normal prose): purpose of each folder, exact sprite specs from blueprint (32x48 character sheets with 2-frame idle / 2-frame walk; 32x32 tiles; Tiled export naming `cafe_map.json`), and the rule that Phaser loads these via `/sprites/<folder>/<file>` URLs.
- [ ] **Step 3:** Commit: `git commit -m "feat: sprites/ asset directory contract"`

### Task 3: Serve sprites/ at /sprites via public symlink

**Files:**
- Create: `public/sprites -> ../sprites` (symlink)

**Interfaces:**
- Produces: URL contract `/sprites/characters/*.png`, `/sprites/tilesets/*.png`, `/sprites/props/*.png`, `/sprites/maps/*.json`, `/sprites/ui/*` — consumed by Phaser loader in Task 7 and by the user's Tiled workflow.

- [ ] **Step 1:** `mkdir -p public && ln -s ../sprites public/sprites`
- [ ] **Step 2:** Verify symlink survives a production build: `npm run build` then confirm `ln -s ../sprites` resolved when serving `.next` static output via `npm run start` + `curl -sI http://localhost:3000/sprites/README.md` returns 200. If Vercel/symlink friction appears at deploy time, fallback (documented in sprites/README.md) is a `scripts/sync-sprites.mjs` copy step wired to `predev`/`prebuild` — do not implement unless needed.
- [ ] **Step 3:** Commit: `git commit -m "feat: expose root sprites/ at /sprites URL"`

### Task 4: Entry validation library (TDD)

**Files:**
- Create: `src/lib/entryValidation.ts`, `src/types/entry.ts`
- Test: `src/lib/entryValidation.test.ts`

**Interfaces:**
- Produces (consumed by Task 5 & 6):
  - `export type EntryRequest = { gmail: string; username: string }`
  - `export type EntryResponse = { ok: true; session: SessionData } | { ok: false; errors: string[] }`
  - `export type SessionData = { gmail: string; username: string; token: string; joinedAt: string }`
  - `export const isValidGmailFormat(gmail: string): boolean` — strict: domain exactly `@gmail.com` (case-insensitive, returned lowercased by caller), local part `[a-z0-9]` start, letters/digits/single dots only, no leading/trailing/consecutive dots, no `+` aliases (reject — session identity should be stable).
  - `export const isValidUsername(username: string): boolean` — `/^[A-Za-z0-9_]{3,16}$/`.
  - `export const validateEntryRequest(body: EntryRequest): string[]` — returns human-readable error strings; empty array = valid.

- [ ] **Step 1:** Write `src/types/entry.ts` with the four types above.
- [ ] **Step 2:** Write failing test `entryValidation.test.ts`: cases — valid `user.name@gmail.com` passes; `user@gmail.co`, `user@yahoo.com`, `user+tag@gmail.com`, `.user@gmail.com`, `user.@gmail.com`, `us..er@gmail.com`, `@gmail.com` all fail format; `ab`, 17-char, `has space`, `has-dash`, `héllo` fail username; `User_3` passes.
- [ ] **Step 3:** Run `npm test` — Expected: FAIL (module not implemented).
- [ ] **Step 4:** Implement `entryValidation.ts` — regex + small pure checks, no `any`.
- [ ] **Step 5:** Run `npm test` — Expected: PASS. Run `npm run typecheck` — Expected: PASS.
- [ ] **Step 6:** Commit: `git commit -m "feat: gmail + username validation library"`

### Task 5: Supabase client setup + env

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `.env.example`

**Interfaces:**
- Produces:
  - `export function createSupabaseClient(): SupabaseClient` (browser; throws `Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment")` when unset).
  - `export function createSupabaseServerClient(): SupabaseClient` (route handler; same env vars, same error).
- Env contract: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (values added by user later; app must build and run without them).

- [ ] **Step 1:** Write `.env.example` with the two vars, empty values, and a comment noting Supabase project URL/keys come from supabase.com dashboard.
- [ ] **Step 2:** Write `client.ts` using `createBrowserClient`-free plain `createClient` from `@supabase/supabase-js`, throwing the named error above when env missing. Same pattern for `server.ts`.
- [ ] **Step 3:** Write a small test asserting `createSupabaseClient` throws the exact named error when `process.env` vars are undefined (delete/restore via `beforeEach`/`afterEach`).
- [ ] **Step 4:** Run `npm test` — Expected: PASS. `npm run build` — Expected: PASS (build works with no env values).
- [ ] **Step 5:** Commit: `git commit -m "feat: supabase client factories + env contract"`

### Task 6: Gmail verification API route

**Files:**
- Create: `src/app/api/verify-entry/route.ts`
- Create: `src/lib/gmailDns.ts`
- Test: `src/lib/gmailDns.test.ts`

**Interfaces:**
- Consumes: `validateEntryRequest`, `EntryRequest`/`EntryResponse`/`SessionData` from Task 4.
- Produces: `POST /api/verify-entry` — body `{ "gmail": "...", "username": "..." }`; 200 → `{ ok: true, session: { gmail, username, token, joinedAt } }` where `token = crypto.randomUUID()`; 400 → `{ ok: false, errors: string[] }`; 405 for non-POST.
  - `src/lib/gmailDns.ts`: `export async function hasGmailMxRecords(lookup: MxLookup = defaultMxLookup): Promise<boolean>` using `dns.promises.resolveMx("gmail.com")`, `MxLookup = (domain: string) => Promise<{ exchange: string; priority: number }[]>` injectable so tests run without network.

- [ ] **Step 1:** Write failing test for `gmailDns`: injectable lookup resolving MX array returns `true`; injected rejection returns `false`.
- [ ] **Step 2:** `npm test` — Expected: FAIL. Implement `gmailDns.ts`. `npm test` — Expected: PASS.
- [ ] **Step 3:** Implement `route.ts`: parse JSON body, `validateEntryRequest`, on errors return 400 `{ ok: false, errors }`; on valid, `await hasGmailMxRecords()` — if false, 400 with `"Gmail mail servers unreachable"`. Else 200 with session object (`token: crypto.randomUUID()`, `joinedAt: new Date().toISOString()`).
- [ ] **Step 4:** Verify manually: `npm run dev`, then
  `curl -s -X POST http://localhost:3000/api/verify-entry -H 'Content-Type: application/json' -d '{"gmail":"test.user@gmail.com","username":"Mug_1"}'` → expect `{"ok":true,...}`; re-run with `{"gmail":"a@b.com","username":"x"}` → expect `{"ok":false,"errors":[...]}`.
- [ ] **Step 5:** `npm run build` PASS. Commit: `git commit -m "feat: /api/verify-entry gmail+username gate"`

### Task 7: Entry shell + session flow (bare-bones)

**Files:**
- Create: `src/components/EntryForm.tsx`, `src/lib/session.ts`
- Modify: `src/app/page.tsx` (render EntryForm)

**Interfaces:**
- Consumes: `POST /api/verify-entry` (Task 6), `SessionData` (Task 4).
- Produces: `session.ts` — `export function saveSession(s: SessionData): void` and `export function loadSession(): SessionData | null` wrapping `window.sessionStorage` key `"cornermug-session"`, `export const SESSION_KEY = "cornermug-session"`. Consumed by Task 8.
- EntryForm behavior: two labeled inputs (`Gmail`, type=email; `Username`, type=text, pattern enforced server-side only — no fancy client styling), submit button, plain `<p>` error list from `EntryResponse.errors` on `ok:false`, on success `saveSession(session)` then `router.push("/cafe")`. No styling beyond default HTML.

- [ ] **Step 1:** Write `session.ts` with the two helpers + `SESSION_KEY`.
- [ ] **Step 2:** Write `EntryForm.tsx` ("use client"): local `useState` for gmail/username/errors, fetch on submit, redirect via `next/navigation` `useRouter`.
- [ ] **Step 3:** Update `page.tsx` to render `<EntryForm />` inside a `<main>`.
- [ ] **Step 4:** Verify manually: dev server, fill valid gmail + username → browser lands on `/cafe` (404 until Task 8 — acceptable intermediate state; Task 8 completes the flow), sessionStorage contains `cornermug-session`. Invalid input shows error paragraph, stays on `/`.
- [ ] **Step 5:** `npm run build` PASS. Commit: `git commit -m "feat: entry gate shell + session flow"`

### Task 8: Phaser canvas mount + cafe page

**Files:**
- Create: `src/game/config/gameConfig.ts`, `src/game/PhaserGame.ts`, `src/game/scenes/BootScene.ts`, `src/game/scenes/CafeScene.ts`, `src/components/GameCanvas.tsx`
- Create: `src/app/cafe/page.tsx`

**Interfaces:**
- Consumes: `loadSession` (Task 7), URL contract `/sprites/...` (Task 3).
- Produces:
  - `BootScene extends Phaser.Scene` (key `"Boot"`, `create()` starts `CafeScene`).
  - `CafeScene extends Phaser.Scene` (key `"Cafe"`; `create()` shows default Phaser background color only — no art, no text logo; the user replaces visuals later).
  - `gameConfig.ts`: `export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig` — `type: Phaser.AUTO`, `pixelArt: true`, `roundPixels: true`, `scale: { mode: Phaser.Scale.RESIZE }`, `scene: [BootScene, CafeScene]`, zero asset loads.
  - `PhaserGame.ts`: `export function mountGame(parent: HTMLElement): Phaser.Game` — creates and returns game; caller owns destroy on unmount.

- [ ] **Step 1:** Write `gameConfig.ts` with values above (spec-pinned: `pixelArt: true`, `roundPixels: true`).
- [ ] **Step 2:** Write stub `BootScene.ts` and `CafeScene.ts` — no preload asset calls, no generated graphics.
- [ ] **Step 3:** Write `PhaserGame.ts` factory.
- [ ] **Step 4:** Write `GameCanvas.tsx` ("use client"): `useEffect` calls `mountGame(ref.current)`, cleanup `game.destroy(true)`; returns `<div ref={ref} />` full-viewport.
- [ ] **Step 5:** Write `src/app/cafe/page.tsx`: client component — `useEffect` checks `loadSession()`; if null, `router.replace("/")`; else render `<GameCanvas />` plus one bare `<div>` with the username text (plain, unstyled).
- [ ] **Step 6:** Verify manually: dev server → `/` → valid entry → `/cafe` shows empty Phaser canvas (solid background, no art); clear sessionStorage → visiting `/cafe` directly redirects to `/`.
- [ ] **Step 7:** `npm run build` PASS, `npm run typecheck` PASS. Commit: `git commit -m "feat: empty Phaser canvas mount on /cafe"`

---

## Out of scope (explicitly NOT in this plan)

Multiplayer/Supabase Realtime wiring, chat, seating, speech bubbles, NPCs, Pomodoro, mini-games, audio, monetization, any map/scene content, any art file, any CSS beyond reset.
