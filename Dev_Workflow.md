---

## 3. Complete Project Folder Structure

Place your existing `sprites/` folder inside `public/sprites/` so Vite serves the PNGs and JSON manifests directly without bundling delays.

```text
cornermug/
├── public/
│   ├── audio/                        # Lo-fi background tracks & UI click chimes
│   │   ├── cafe-rain.mp3
│   │   └── chime-soft.mp3
│   └── sprites/                      # Existing HappyHustle v0.2.0 asset pack
│       ├── art/
│       │   ├── characters/           # barista, cook, courier, maintenance-worker, office-worker, resident
│       │   ├── props/                # 32 furniture PNGs + props.png atlas
│       │   ├── tiles/                # 16 floor/wall PNGs + tiles.png atlas
│       │   ├── environment-palette.gpl
│       │   ├── rooms-composed.png
│       │   └── rooms-ground.png
│       ├── Asset_list.txt
│       ├── credits.txt
│       ├── import_guide.txt
│       ├── LICENSE.txt
│       └── manifest.json
│
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx            # Dark charcoal (#1E1E24) top/side navigation
│   │   │   └── PageContainer.tsx     # Warm ivory (#FAF8F5) wrapper & responsive grid
│   │   ├── ui/
│   │   │   ├── PastelCard.tsx        # Reusable rounded card with lavender/sage/peach/yellow variants
│   │   │   ├── PillButton.tsx        # Soft rounded pill buttons
│   │   │   └── StatBadge.tsx         # Minimal data-vis stat counters for Dashboard
│   │   └── room/
│   │       ├── GameCanvas.tsx        # HTML5 Canvas wrapper handling resize & integer zoom
│   │       ├── PomodoroWidget.tsx    # Collapsible study/break timer overlay
│   │       ├── ChatDrawer.tsx        # Toggleable live room chat box
│   │       └── CharacterPicker.tsx   # Modal/selector for the 6 pixel-art characters
│   │
│   ├── engine/                       # Pure TypeScript/JS game logic (decoupled from React)
│   │   ├── AssetLoader.ts            # Preloads aligned.png, aligned.json, tiles, and props
│   │   ├── SpriteAnimator.ts         # Handles 300ms idle (9f) & 100ms walk (8f) frame timing
│   │   ├── RoomBuilder.ts            # Parses room layouts, collision boxes & chair sit-anchors
│   │   ├── Renderer.ts               # Nearest-neighbor draw loop + ground-Y depth sorting
│   │   └── InputController.ts        # WASD / Arrow keys + 'E' or click-to-sit interaction
│   │
│   ├── pages/
│   │   ├── EntryGate.tsx             # Landing screen: Email + Permanent Username + User Key
│   │   ├── Dashboard.tsx             # Room launcher (Public/Private Key) + personal time stats
│   │   ├── RoomView.tsx              # Active multiplayer game screen + Pomodoro + Chat
│   │   ├── Friends.tsx               # Friend list, online room status & Join-by-Room-Key input
│   │   ├── Settings.tsx              # View User Key, audio toggles, privacy visibility
│   │   ├── AboutFeedback.tsx         # Project mission + developer feedback submission form
│   │   └── CreditsPolicies.tsx       # HappyHustle attribution, dev credits, Privacy & Terms
│   │
│   ├── services/
│   │   ├── supabaseClient.ts         # Supabase initialization (using free tier env keys)
│   │   ├── authService.ts            # Lightweight Email + Username + User Key lookup/creation
│   │   ├── multiplayerService.ts     # Realtime channel sync (player positions, chat, room keys)
│   │   └── statsService.ts           # Logs Pomodoro focus minutes & total room hangout time
│   │
│   ├── types/
│   │   └── game.ts                   # Interfaces for Player, RoomState, PropAnchor, UserStats
│   │
│   ├── App.tsx                       # Client-side routing & active session state
│   ├── main.tsx                      # Entry point
│   └── index.css                     # Tailwind directives + custom ivory/pastel CSS variables
│
├── .env.example                      # VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY
├── .gitignore
├── index.html                        # Google Fonts (Plus Jakarta Sans / Inter) + page title
├── package.json
├── tailwind.config.js                # Custom pastel colors & soft shadow tokens
└── vite.config.ts
```

---

## 4. Core Game & Site Mechanics Summary

* **Key-Based Frictionless Auth:**
  * New users submit **Email + Desired Username**. The app checks uniqueness, generates a human-readable **User Key** (e.g., `MUG-8492-COZY`), and saves the record in Supabase.
  * Returning users enter their **Username + User Key** (stored in `localStorage` for convenience, with manual entry on new devices).
* **Room Types:**
  * **Public Rooms:** Persistent room IDs (`public-cafe`, `public-apartment`, `public-workspace`) open to anyone.
  * **Private Rooms:** Clicking "Create Private Space" generates a 6-character **Room Key** (e.g., `CAFE-7X2`) that hosts share with friends.
* **Pixel Art & Physics Rules (from HappyHustle `import_guide.txt`):**
  * Character frames: `64x64` cells, pivot `(32, 54)`. Props: `64x64` cells, pivot `(32, 58)`. Tiles: `32x32`.
  * Render order: Floor tiles $\rightarrow$ Rugs & Wall items $\rightarrow$ Y-sorted Props & Characters $\rightarrow$ Floating Username tags & Seated/Studying icons.
  * Interactive Seating: Chairs (`cafe-chair`, `office-chair`, `armchair`, `sofa`, `bar-stool`) define snap coordinates so players can sit and display a subtle "Focusing" or "Chilling" badge.
* **UI Aesthetic Rules:**
  * Background: Warm ivory (`#FAF8F5`). Navigation: Dark charcoal (`#1E1E24`).
  * Cards: Rounded corners (`rounded-2xl` / `rounded-3xl`), delicate borders, pastel fills (muted lavender, dusty pink, soft butter yellow, sage green, powder blue, subtle peach), pill buttons, and clean sans-serif typography.

---

## 5. Solo Developer Time Management System (1–7 Hours/Day)

Because your daily PC availability fluctuates between **1 hour (busy days)** and **7 hours (open days)**, rigid daily schedules will cause burnout. Use a **Two-Mode Sprint System** broken into atomic tasks.

### Daily Operating Modes

* **Mode A: Low-Energy / 1-Hour Maintenance Day (60 mins)**
  * *Goal:* Keep momentum alive without opening heavy tools.
  * *Tasks:* Ask Gemini/OpenCode to write one isolated helper function, refine UI copy/policies, curate Pinterest UI references, design a JSON room collision map, or test one bug fix and push a clean commit to GitHub.
* **Mode B: Deep-Work / 4–7 Hour Build Day (Split into 90-Min Blocks)**
  * *Block 1 (90 min):* Core logic/coding via OpenCode + Vite dev server.
  * *Break (20 min):* Step away from the screen (rest eyes, stretch).
  * *Block 2 (90 min):* UI styling, sprite alignment, or database wiring.
  * *Break (20 min):* Hydrate / walk.
  * *Block 3 (90 min):* Testing on `1366x768`, fixing console errors, and pushing to GitHub/Vercel.
  * *Buffer (30–60 min):* Update this context file with any architectural changes made that day.

### 6-Milestone Build Tracker (No Deadlines—Check Off by Progress)

* [ ] **Milestone 1: Repo & UI Shell**
  * Initialize Vite + React + Tailwind; move `sprites/` to `public/sprites/`.
  * Build the charcoal Navbar, ivory background, Entry Gate UI, and static pages (Dashboard, Friends, Settings, About/Feedback, Credits).
* [ ] **Milestone 2: Single-Player Pixel Engine**
  * Build `AssetLoader.ts` and `Renderer.ts` to draw the Café tilemap and props with crisp pixel scaling and Y-sorting.
  * Add 4-direction walking animations, wall/furniture collision boxes, and press-to-sit on chairs.
* [ ] **Milestone 3: Supabase Setup & User Keys**
  * Create free Supabase project; set up `users`, `friends`, `sessions`, and `feedback` tables.
  * Wire up Email + Permanent Username + User Key login and persistent `localStorage` sessions.
* [ ] **Milestone 4: Live Multiplayer & Private Room Keys**
  * Connect Supabase Realtime channels so players see each other walk, sit, and chat in real time.
  * Implement Public Room switcher and Private Room Key generator/joiner.
* [ ] **Milestone 5: Pomodoro Timer & Dashboard Stats**
  * Build the collapsible in-room Pomodoro widget.
  * Log completed focus intervals and room hangout minutes to Supabase and render them as pastel stat cards on the Dashboard.
* [ ] **Milestone 6: Polish, Audio & Vercel Launch**
  * Add ambient lo-fi audio toggle, populate Credits/Privacy/Terms, audit layout at `1366x768`, and deploy via GitHub $\rightarrow$ Vercel.
