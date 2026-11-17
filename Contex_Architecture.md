# CornerMug — Project Context, Architecture & Dev Plan

> **Purpose of this Document:** This file serves as the single source of truth for **CornerMug**. Paste or feed this context into any AI coding assistant (OpenCode, Gemini, etc.) so it immediately understands the project vision, design direction, asset pipeline, zero-cost tech stack, and your hardware constraints.

---

## 1. Developer Environment & Hardware Constraints

* **Developer:** Solo creator (`arthur@Archroot`), working with OpenCode (free models), Gemini, Pinterest (UI moodboards), and GitHub.
* **OS & DE:** Arch Linux (`x86_64`), KDE Plasma 6.8.2 (Wayland), GNOME Terminal.
* **Hardware Specs:**
  * **CPU:** Intel Celeron 4205U (2 cores @ 1.80 GHz)
  * **RAM:** 8 GB total (~7.61 GiB usable, ~4.77 GiB typically in use with DE/browser) + 3.81 GiB Swap
  * **GPU:** Intel UHD Graphics 610 (Integrated)
  * **Display:** 1366x768 @ 60Hz
  * **Storage:** ~175 GiB free on Btrfs
* **Crucial Tooling Rule (Low-RAM / Dual-Core Optimization):**
  * **Avoid heavy game engines** (no Unity, Godot web exports, or Phaser overhead) and **avoid heavy Docker containers** during local development.
  * Keep local dev lightweight: use **Vite** (fast, minimal memory footprint) and **vanilla HTML5 2D Canvas** for rendering pixel art.
  * Test UI responsiveness at **1366x768** resolution so nothing clips or requires awkward scrolling on standard laptop screens.

---

## 2. Zero-Cost Tech Stack ($0/Month Production)

Because Vercel hosts serverless functions (which terminate after a request and **cannot** maintain persistent WebSocket connections natively), the smartest free architecture combines **Vercel** for the web app + **Supabase** (or **PartyKit / Cloudflare Workers**) for real-time multiplayer and database persistence.

### Recommended Stack
1. **Frontend Framework:** **React + Vite + TypeScript** (or plain JSX if preferred for simplicity)
   * *Why:* Fast build times on a Celeron CPU, easy state management for the Pomodoro timer, chat drawer, and dashboard views, and effortless deployment to **Vercel's Free Hobby Tier**.
2. **Styling:** **Tailwind CSS**
   * *Why:* Rapidly build the warm off-white/ivory (`#FAF8F5`) UI, dark charcoal (`#1E1E24`) navigation bar, pastel cards, and pill buttons without maintaining massive CSS files.
3. **2D Game & Sprite Renderer:** **Native HTML5 `<canvas>` + Custom `requestAnimationFrame` Loop**
   * *Why:* Zero library bloat, 60 FPS on integrated Intel UHD 610 graphics, full control over `imageSmoothingEnabled = false` (nearest-neighbor crispness), integer zoom, and Y-sorting.
4. **Database & Real-Time Multiplayer:** **Supabase (Free Tier)**
   * *Database (PostgreSQL):* Stores permanent Usernames, Emails, User Keys, Friends lists, Feedback submissions, and Pomodoro/Room time logs.
   * *Realtime Broadcast & Presence:* Supabase includes free **WebSocket Realtime Channels** out of the box! Players broadcast their `(x, y)` coordinates, facing direction, seated state, and room chat messages over a Supabase channel scoped to `room:<room_key>`—**eliminating the need to host or pay for a separate Node.js WebSocket server**.
5. **Audio (Lo-Fi Ambience):** **HTML5 Web Audio API / `<audio>` tags**
   * *Why:* Stream lightweight royalty-free lo-fi tracks or subtle rain/café ambient loops directly from static files or free CDN links.


