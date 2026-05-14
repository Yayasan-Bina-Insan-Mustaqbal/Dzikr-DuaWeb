# Dzikr & Dua Web App Specification
**Version 1.1.0** · AI Agent Core · 2026-05-14 · [stateless, client-side, media-player, terra-design]

---

## AI READING INSTRUCTION

Read `[SPEC]` and `[BUG]` blocks for authoritative facts.
Read `[NOTE]` only if additional context is needed.
`[?]` blocks are unverified — treat with lower confidence.
Always verify current dependencies in `package.json` before proposing new ones.

---

## 1. Core Architecture

**[SPEC]**
- **Type:** Fully client-side web application.
- **Persistence:** No database, no authentication.
- **Sharing:** Stateless sharing via URL search parameters.
- **Audio:** Continuous playback across route transitions.
- **Root Layout:** Audio player must be mounted in `src/routes/__root.tsx` to prevent unmounting.

**[NOTE]**
The goal is a "zero-overhead" app where users can curate playlists and share them via a single link without ever creating an account.

---

## 2. Tech Stack

**[SPEC]**
| Category | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | TanStack Start | Vite speed + type-safe routing. |
| **Routing** | TanStack Router | URL is the "database"; search param validation is critical. |
| **State** | Zustand | Global audio queue management (planned). |
| **UI** | Radix UI / shadcn | Accessible primitives for complex media controls. |
| **Styling** | Tailwind CSS v4 | Modern utility-first styling. |
| **Compression** | lz-string | URL length optimization for large playlists. |

**[NOTE]**
Zustand and lz-string are the preferred tools but must be explicitly installed if not present in `package.json`.

---

## 3. Data Flow & State

**[SPEC]**
- **URL Schema:** Playlists are stored in `?queue` parameter.
- **Syncing:** 
  1. Router intercepts URL on load.
  2. Validate IDs against local static data.
  3. Load valid IDs into Zustand `audioStore`.
- **Audio Control:**
  - UI components call `audioStore.actions.play(id)`.
  - Root `<AudioPlayer />` subscribes to `audioStore.state.current`.

**[NOTE]**
The UI and the `<audio>` tag should never communicate directly to maintain clean separation of concerns.

---

## 4. Development Rules

**[SPEC]**
- **Paths:** Always use `src/` prefix for source files (e.g., `src/routes`).
- **Icons:** Use `@phosphor-icons/react` as per existing dependencies.
- **Types:** Strict TypeScript usage is mandatory.
- **Components:** shadcn/ui components should be placed in `src/components/ui`.

---

## 5. Design System: Terra

**[SPEC]**
- **Theme:** "Terra" (Organic/Grounded).
- **Colors (OKLCH):**
  - Primary: `oklch(0.506 0.089 157.8)` (Forest Green)
  - Background: `oklch(0.978 0.009 78.5)` (Warm Cream)
  - Accent: `oklch(0.448 0.082 82.5)` (Warm Amber)
- **Typography:**
  - Headlines: Literata (Serif).
  - Body: Nunito Sans (Sans-serif).
  - Line-height: 1.6 min for body text.
- **Radius:** `0.75rem` (12px) global constant.
- **Shadows:** Soft tonal separation (`shadow-terra`).

**[NOTE]**
Avoid sterile whites, pure blacks, and sharp edges. The app should feel human and rooted.

---

## 6. Known Constraints

**[SPEC]**
- **URL Limit:** Browser URL limit is ~2000 characters. Use `lz-string` if the queue exceeds safe lengths.
- **Auto-play:** Be aware of browser auto-play policies (user interaction required).

---

## 6. Changelog

**[SPEC]**
- **2026-05-14:** Initial SPEC creation in HADS format.
- **2026-05-14:** Integrated "Terra — Organic Design" system into styles.css and AI guidelines.
