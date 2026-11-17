# CornerMug — Project Overview & Design Plan

CornerMug is a browser-based, lo-fi pixel art study and hangout space. It gives people a low-pressure virtual environment to sit down, focus on work, or casually chat with others. Instead of noisy social feeds or complicated setups, the goal is to replicate the quiet comfort of a neighborhood café or a shared study room where people can co-work and build social confidence at their own pace.

---

## 1. Core Concept & User Flow

The experience is designed to be frictionless from the moment someone opens the site.

### Lightweight Entry & Account Persistence
* **No Heavy Sign-Up:** Users do not need to create complex profiles, upload photos, or hand over personal data.
* **Key-Based Access:** On the initial landing screen, a visitor enters an **Email Address** and chooses a permanent **Username**. Upon submitting, the system generates (or lets them set) a unique **User Key**.
* **Returning Sessions:** Because the username is locked to that email and user key, returning users simply enter their credentials/key to pick up right where they left off, keeping their stats, friends list, and avatar preferences intact.

### Entering a Space
Once past the entry screen, users land on the main **Home / Dashboard**. From here, they have two ways to jump into a room:
1. **Public Spaces:** Join an open, shared server (such as the main Café, Apartment Lounge, or Shared Workspace) to hang out with whoever is currently online.
2. **Private Rooms:** Create a personal room, which generates a shareable **Room Key**. The host can send this key to friends so they can join the private session directly.

---

## 2. In-Room Gameplay & Social Features

Inside a room, the experience blends lightweight top-down 2D movement with practical study tools.

* **Movement & Interaction:** Users pick from one of six pixel-art character archetypes (Resident, Barista, Cook, Office Worker, Courier, or Maintenance Worker) and walk around the room in four directions.
* **Sitting & Co-Working:** While the base tile/prop kit is decorative, CornerMug will implement interactive seating zones on chairs, sofas, and bar stools. Walking up to a seat lets a user sit down, signaling to others that they are settled in to study or chat.
* **Built-In Pomodoro Timer:** A clean, collapsible Pomodoro timer sits along the edge of the screen so users can track focus blocks and breaks without leaving the browser tab.
* **Toggleable Room Chat:** A unobtrusive chat drawer can be toggled on or off. Users can talk with everyone in the room or keep the chat hidden when they want pure focus mode.

---

## 3. Site Architecture & Pages

Outside of the active game canvas, the web application is organized into clear, accessible views:

1. **Home / Dashboard:**
   * Quick-launch cards to jump into public rooms or spin up a private room with a Room Key.
   * **Personal Activity Stats:** Clean visual summaries showing total time spent on CornerMug, hours logged in active Pomodoro focus sessions, and time spent hanging out in rooms.
2. **Friends:**
   * A simple list of added friends, showing who is currently online and which public room they are in (if their privacy settings allow it), plus an input field to paste a friend's Room Key.
3. **Settings:**
   * Account details (viewing the permanent username, managing the User Key), audio toggles (lo-fi background audio/UI chimes), and basic privacy preferences.
4. **About / Info & Feedback:**
   * Explains the philosophy behind CornerMug—encouraging healthy online socialization and low-stress co-working.
   * **Developer Feedback Box:** An embedded form where users can submit bug reports, feature requests, and general reviews directly to the developers.
5. **Credits & Policies:**
   * Dedicated space for developer credits, asset attributions (including *Modern Rooms & People* by HappyHustle), Privacy Policy, and Terms of Service.

---

## 4. Visual Direction & UI Scope

The web interface wraps around the pixel-art game canvas with a calm, editorial aesthetic that feels warm and approachable rather than overly technical.

* **Color Palette:**
  * **Canvas / Background:** Warm off-white and soft ivory (`#FAF8F5` / `#F5F2EB`) rather than stark white.
  * **Navigation Contrast:** Dark charcoal or near-black (`#1E1E24`) sidebar or top bar to anchor the layout.
  * **Pastel Accents:** Muted lavender, dusty pink, soft butter yellow, sage green, powder blue, and subtle peach used to categorize cards, status pills, and dashboard metrics.
* **Layout & Shapes:**
  * Spacious, asymmetrical grid layouts mixing different card sizes on the dashboard.
  * Generous border radii on cards, pill-shaped buttons, delicate 1px borders, and soft, low-elevation shadows.
* **Typography & Iconography:**
  * Clean, modern sans-serif typography with medium-weight headings and readable, understated body text.
  * Minimal line icons and restrained, clean data-visualization shapes for the study-time metrics.

---

## 5. Technical & Asset Implementation Notes

Based on the existing `./sprites` directory (*Modern Rooms & People v0.2.0* by HappyHustle), the rendering engine should follow these specifications to keep the pixel art crisp:

* **Rendering Rules:**
  * Enforce nearest-neighbor image scaling (`image-rendering: pixelated`), whole-pixel coordinates, and integer display zoom levels so sprites never blur.
  * Sort characters and props dynamically by their ground Y-coordinate (`pivot (32, 58)` for props, `(32, 54)` for characters) so players naturally walk in front of or behind furniture. Rugs and wall items render on the background layer.
* **Character Sheets:**
  * Load the 64x64 `aligned.png` sheets paired with `aligned.json` frame rectangles.
  * Idle animations run at `300ms` per frame (9 frames per direction); walk animations run at `100ms` per frame (8 frames per direction).
* **Room Construction & Collisions:**
  * Build the three core environments (**Café**, **Apartment**, **Workspace**) using the 32x32 tileset and 64x64 prop kit.
  * Because the base asset pack does not include collision maps or seating states, the game engine will define custom collision bounding boxes over walls/furniture and attach "sit anchor" coordinates to chairs, stools, and couches.
* **Multiplayer State:**
  * Use a lightweight WebSocket server (e.g., Node.js with Socket.io or WebSockets) to broadcast player positions, facing directions, seated states, room chat messages, and active room keys in real time.

---

## 6. Suggested Build Roadmap

1. **Phase 1 — Static UI & Entry Flow:** Build the ivory/pastel shell, navigation bar, User Key login flow, and placeholder pages (Dashboard, Friends, Info/Feedback, Credits).
2. **Phase 2 — Local Canvas & Sprite Engine:** Parse `aligned.json` and `manifest.json` to render the Café room on an HTML5 Canvas with integer scaling, Y-sorting, collision boundaries, and interactive chair-sitting.
3. **Phase 3 — Multiplayer & Room Keys:** Connect a WebSocket backend to sync player movement, real-time room chat, and private Room Key generation.
4. **Phase 4 — Pomodoro & Dashboard Tracking:** Wire up the in-room Pomodoro timer and log session durations to the database so user stats populate on the Dashboard.