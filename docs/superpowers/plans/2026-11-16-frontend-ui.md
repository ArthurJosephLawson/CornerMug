# Corner Mug — Frontend UI Enhancement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline — creator approved design in chat).

**Goal:** Add three polished non-game pages (/help, /settings, /stats), a shared top nav, and a cohesive warm aesthetic across all Next.js pages — without touching any Phaser/game-engine code.

**Architecture:** Pure frontend. One global stylesheet (`globals.css`) carries the design system (CSS custom properties from `sprites/DESIGN.md` palette). Two new client-side stores persisted to localStorage: `src/lib/stats.ts` (Pomodoro session log) and `src/lib/settings.ts` (audio/display/badge prefs) with a React context provider (`src/components/SettingsProvider.tsx`). Charts are inline SVG bar charts, no deps. Pages: `/help`, `/settings`, `/stats`; shared `SiteNav` component wraps non-game pages; entry/picker/play pages get restyled shells only. Game files (GameCanvas, MainCafeScene, fallback.ts, room JSON, supabase stubs) untouched.

**Tech Stack:** Next.js App Router, TypeScript strict, plain CSS (no Tailwind, no new deps), localStorage.

**Spec:** Approved design in chat (this session): 3 pages not modals; cream palette #FAF3E3/#5C4033 + rust/sage/amber; localStorage stats+settings; SVG charts; page-mount transitions; game engine untouched.

## Global Constraints

- No new npm dependencies.
- No changes to `src/game/**`, `src/types/room.ts`, `src/lib/rooms.ts`, `src/lib/supabase/**`, room JSON.
- TypeScript strict, no `any`.
- Palette tokens only from: paper `#FAF3E3`, ink `#3A2E24`, wood `#5C4033`, cream `#EFE3CE`, wall-shadow `#B9A88C`, rust `#A8574E`, sage `#7A8B6F`, amber `#D9A05B`, espresso `#2A1E17`.
- localStorage keys: `cornermug-settings`, `cornermug-stats`.
- Play page keeps the game canvas as an isolated island; only its surrounding shell is styled.

## Review Focus

- localStorage unavailable (private mode / SSR): reads must return safe defaults, never throw — Task 2 unit tests.
- Corrupted localStorage JSON: parse falls back to defaults — Task 2 unit tests.
- Stats with zero history: dashboard renders empty states, charts don't NaN — Task 3 tests.
- Settings provider must not flash wrong values on SSR/hydration — Task 5 (mounted-gate pattern).
- Game canvas isolation: play page still boots Phaser identically — Task 6 curl + manual check.

---

### Task 1: Design system CSS + SiteNav + layout wiring

**Files:**
- Modify: `src/app/globals.css` (full rewrite: tokens, base, cards, buttons, nav, page transition)
- Create: `src/components/SiteNav.tsx` (links: Cafe, Help, Settings, Stats; active state via usePathname)
- Modify: `src/app/layout.tsx` (font stack, body class, no nav injection here — pages opt in)
- Modify: `src/app/page.tsx`, `src/app/cafe/page.tsx` (wrapper classes only)

**Interfaces:**
- Produces: CSS classes `.site-nav`, `.card`, `.btn`, `.btn-accent`, `.page-enter`, token vars `--paper`, `--ink`, `--wood`, `--cream`, `--wall`, `--rust`, `--sage`, `--amber`, `--espresso`.

- [ ] Step 1: Write globals.css tokens + components (full stylesheet).
- [ ] Step 2: Create SiteNav with active-link styling.
- [ ] Step 3: `npm run build` PASS; commit.

### Task 2: Settings + stats localStorage libs (TDD)

**Files:**
- Create: `src/lib/settings.ts` + `src/lib/settings.test.ts`
- Create: `src/lib/stats.ts` + `src/lib/stats.test.ts`

**Interfaces:**
- Produces: `type MugSettings = { ambientEnabled: boolean; ambientVolume: number; reduceMotion: boolean; badgeColor: BadgeColor }`; `loadSettings(): MugSettings`, `saveSettings(s: MugSettings): void`, `DEFAULT_SETTINGS`.
- Produces: `type PomodoroSession = { startedAt: string; minutes: number; mode: "focus" | "break" }`; `recordSession(s: PomodoroSession): void`, `loadSessions(): PomodoroSession[]`, `computeStats(sessions, now): { streakDays: number; totalMinutes: number; weeklyMinutes: number[]; weeklyTotal: number; monthlyTotal: number }` (weeklyMinutes = 7 buckets oldest→today), `BADGE_COLORS: BadgeColor[]` where `BadgeColor = "rust" | "sage" | "amber" | "wood" | "espresso"`.
- Tests (RED first): defaults when empty/corrupt JSON; roundtrip save/load; streak = consecutive days back from today with ≥1 focus session; weekly buckets correct; NaN-free with zero sessions.

- [ ] Step 1: Write failing tests for settings + stats.
- [ ] Step 2: RED confirm.
- [ ] Step 3: Implement both libs.
- [ ] Step 4: GREEN + typecheck; commit.

### Task 3: SettingsProvider context + play-page stat recording

**Files:**
- Create: `src/components/SettingsProvider.tsx` (context: `{settings, update}`, mounted-gate via CSS class not render-swap)
- Modify: `src/app/layout.tsx` (wrap children in provider)
- Modify: `src/components/PomodoroTimer.tsx` (on focus→break transition call `recordSession`; keep timer logic intact)
- Modify: `src/lib/stats.ts` test additions if session recording needs a helper (`recordFocusCompleted()`)

**Interfaces:**
- Consumes: Task 2 `loadSettings`/`saveSettings`.
- Produces: `useMugSettings(): { settings: MugSettings; update: (patch: Partial<MugSettings>) => void }`.

- [ ] Step 1: Provider + wiring; reduce-motion + ambient volume applied via CSS vars/`data-` attrs.
- [ ] Step 2: Pomodoro focus completion → `recordSession({mode:"focus", minutes:25})`.
- [ ] Step 3: tests/typecheck/build PASS; commit.

### Task 4: Help page `/help`

**Files:**
- Create: `src/app/help/page.tsx`

Content sections (static, no art — text + CSS shapes only): What is Corner Mug; zero-login entry; walking (WASD/arrows); sitting at tables (click seat in reach) + proximity chat; speech (T key); shared Pomodoro; link to play. Card-based, Server Component fine (no interactivity).

- [ ] Step 1: Build page with SiteNav + sections.
- [ ] Step 2: build PASS; commit.

### Task 5: Settings page `/settings`

**Files:**
- Create: `src/app/settings/page.tsx`

Uses `useMugSettings`: ambient on/off + volume slider; reduce-motion checkbox; badge color swatches (5 presets, radio-style buttons); account info card (gmail/username from session, read-only, "no accounts, no passwords" note); back link.

- [ ] Step 1: Build page.
- [ ] Step 2: build PASS; commit.

### Task 6: Stats page `/stats`

**Files:**
- Create: `src/app/stats/page.tsx`
- Create: `src/components/BarChart.tsx` (pure SVG: values → bars + labels, no deps)

Renders: weekly minutes bar chart (7 bars, Mon–Sun labels), current streak, total + monthly totals, 7-day/30-day toggle (30-day = weekly chart repeated as two rows or list of weeks — keep simple: total for last 30 days + weekly chart only), empty state when no history ("No sessions yet — start a Pomodoro in the cafe").

- [ ] Step 1: BarChart component (pure, testable signature `BarChart({values, labels, accent})`).
- [ ] Step 2: Stats page with toggle + empty state.
- [ ] Step 3: tests/typecheck/build PASS; commit.

### Task 7: Restyle entry + picker + play shells; final verification

**Files:**
- Modify: `src/app/page.tsx` (entry card, centered, warm hero)
- Modify: `src/app/cafe/page.tsx` (room picker grid cards with thumb + fallback box)
- Modify: `src/app/cafe/play/page.tsx` (styled shell around untouched GameCanvas island: toolbar, chat sidebar, pomodoro cards)
- Verify: `npm test`, `npm run typecheck`, `npm run build`, curl routes 200.

- [ ] Step 1: Restyle entry page.
- [ ] Step 2: Restyle picker.
- [ ] Step 3: Style play shell (canvas untouched).
- [ ] Step 4: Full verification suite + curl smoke; commit.
