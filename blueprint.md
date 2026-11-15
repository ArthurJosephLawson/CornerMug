# Project Blueprint: Corner Mug

## 1. Core Vision & Concept
**Corner Mug** is a cozy, browser-based **2D top-down pixel-art virtual cafe** where people from around the world—or groups of friends—can drop in to hang out, chat about life, play casual tabletop mini-games, or study together ("body-doubling").

Unlike corporate video-conferencing tools (such as Gather.town or Zoom), Corner Mug is **100% video-free, voice-free, and text-and-atmosphere focused**. It removes camera anxiety and heavy bandwidth costs, creating an accessible, always-alive "third place" on the web.

### Key Differentiators
*   **Zero-Account, Gmail + Username Entry:** No sign-up forms, no passwords, and no heavy user accounts. Visitors simply provide an authentic `@gmail.com` address and pick a username to enter a cafe space immediately.
*   **100% Hand-Crafted Art & Custom UI:** Every sprite, tilemap, logo, and UI design is custom-made by the creator—ensuring complete creative ownership and zero copyright overlap with existing platforms.
*   **No Video / No Camera Pressure:** Communication happens purely through table-scoped text chat, overhead pixel speech bubbles, and interactive table props.
*   **$0 Server Overhead:** Deployed on Vercel + Supabase Free Tier. Because there is no audio/video streaming, real-time multiplayer runs on lightweight JSON state updates at zero hosting cost.

---

## 2. Entry Flow & Core Gameplay Mechanics

### A. Frictionless Gmail + Username Gate
*   **Entry Form:** Two inputs only—**Gmail** and **Username**.
*   **Verification:** Backend API verifies that the email is an authentic, valid `@gmail.com` address (strict regex + DNS MX record validation) before granting entry into the cafe server. No password creation or complex account dashboards.

### B. Table-Scoped Proximity & Modes
*   **Movement & Seating:** Players move using `WASD` / Arrow keys or click-to-walk, and click any empty chair to snap into a seat.
*   **Localized Table Chat:** When seated at a table, chat messages are scoped strictly to the people sitting at **that specific table** (plus overhead speech bubbles above avatars' heads).
*   **Table Vibe Badges:**
    *   **Open Lounge:** Casual conversation, life advice, venting, and meeting strangers.
    *   **Study & Focus:** Synced Pomodoro study timer (`25m focus / 5m break`) where chat switches to quiet mode during focus blocks and opens up during breaks.

### C. Interactive Cafe Props & Mini-Activities
*   **Coffee & Drink Bar:** Clicking the counter lets players grab a drink that appears on the table in front of their avatar.
*   **Tabletop Micro-Games:** Two players at the same table can play quick, silent turn-based games (**Tic-Tac-Toe, Connect 4, or Chess**) while chatting or taking a study break.
*   **Shared Table Scratchpad & Icebreaker Cards:** Live sticky-note pad for study goals and clickable prompt cards to spark conversation.
*   **Local Ambience Controls:** Lightweight client-side audio toggles (rain, vinyl crackle, cafe murmur).

### D. Solving the "Empty Cafe" Problem
*   **Single Global Lobby First:** All public visitors funnel into one main cafe server until capacity (~35–40 players) is reached before opening an overflow room.
*   **Ambient NPC Patrons:** Animated cafe NPCs (sleeping cat, barista, studying patrons) keep the space warm and alive at all hours.

---

## 3. Custom Art & `sprites/` Pipeline
All art assets, maps, and branding are created manually by the project owner and stored in a dedicated root `sprites/` directory:
*   `sprites/characters/` — Custom `32x48` pixel character sheets (2-frame idle, 2-frame walk).
*   `sprites/tilesets/` — Custom `32x32` environment tiles (floors, walls, windows, furniture).
*   `sprites/props/` — Interactive items (coffee mugs, tabletop games, lamps).
*   `sprites/maps/` — **Tiled Map Editor** exports (`cafe_map.json`) with collision layers and interactive chair/table zones.
*   `sprites/ui/` — Custom logo and UI graphics designed by the creator.

---

## 4. $0-Cost Production Tech Stack
*   **Frontend & API Routes:** Next.js (App Router) + TypeScript, hosted free on **Vercel**.
*   **Game Engine:** **Phaser 3** (HTML5 Canvas) configured to load custom sprite sheets and Tiled JSON maps from `sprites/`.
*   **Multiplayer & Presence:** **Supabase Realtime** (Free Tier) for avatar `(x, y)` coordinates, seat occupancy locks, and table-scoped chat channels.

---

## 5. Micro-Monetization Model (Conditional Low-Cost Unlocks)
The public cafe remains **100% free** to drive organic word-of-mouth among students and friends. Tiny optional unlocks (**$1.50 – $3.00**) cover future growth:
1.  **Reserved Private Booths ($2.00/month or $1.50/week):** One host unlocks a PIN-protected private table/room for up to 8 friends or study buddies.
2.  **Cosmetic Packs & Pets ($1.99 one-time):** Specialty drinks, outfits, and companion pets sitting beside the player's chair.

---

## 6. Phased Execution Roadmap
*   **Phase 1: Project Foundation & Asset Folder Setup**
    *   Initialize clean Next.js + TypeScript + Phaser 3 folder skeleton, root `sprites/` directory structure, and Gmail + Username entry validation endpoint (bare-bones UI shell only, zero generated art).
*   **Phase 2: Custom Map & Single-Player Movement**
    *   Wire Phaser 3 loader to read custom `sprites/maps/cafe_map.json` and character sprites, with collision and click-to-sit chair logic.
*   **Phase 3: Real-Time Multiplayer & Table-Scoped Chat**
    *   Connect Supabase Realtime Presence/Broadcast for multi-user movement, seat locks, table-isolated text chat, and speech bubbles.
*   **Phase 4: Study Timers, Mini-Games & Conditional Unlocks**
    *   Add synced Pomodoro timers, tabletop games, ambient sound toggles, and micro-payment unlocks for private booths.
