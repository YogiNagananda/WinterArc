# Architecture & Engineering Decision Log

This document records architectural, engineering, and feature decisions made throughout the development of the **Winter Arc 90-Day Discipline Tracker**.

Every time a meaningful change is made to the codebase, an entry is added detailing:
1. **What changed**
2. **Why this approach was picked**
3. **Why this library/method was chosen over alternatives**

---

## [2026-09-29] Baseline Architecture

### 1. Offline-First Storage with IndexedDB (`idb`)
- **What changed:** Initialized local persistence layer using IndexedDB wrapper `idb`.
- **Why this approach:** A discipline and habit tracker requires high reliability and zero downtime, even without internet access. Data is stored on-device with immediate read/write access.
- **Why this library/method over alternatives:**
  - `localStorage` is synchronous, limited to 5MB, and can block the main thread with large datasets (logs, 90-day history, journal entries).
  - Raw `IndexedDB` has a verbose, callback/event-based API.
  - `idb` provides a lightweight, promise-based idiomatic wrapper around IndexedDB with full TypeScript support and minimal overhead.

### 2. State Management with Zustand
- **What changed:** Built global stores for daily state, settings, stats, and badges using `zustand`.
- **Why this approach:** Provides reactive UI updates across disparate views (dashboard, tasks, gym, notes, stats) without prop drilling or heavy context providers.
- **Why this library/method over alternatives:**
  - Redux / Redux Toolkit has extensive boilerplate and unnecessary complexity for a client-side tracker.
  - React Context can cause frequent unnecessary re-renders of consuming components unless heavily memoized.
  - Zustand has a tiny bundle footprint (<1KB), supports direct outside-of-React access, and offers selective subscriptions for optimal render performance.

### 3. Tailwind CSS v4 for Design System
- **What changed:** Configured Tailwind CSS v4 with custom dark mode aesthetic, glassmorphism, and accent gradients.
- **Why this approach:** Enables rapid UI development with strict design tokens for consistency across all screens and components.
- **Why this library/method over alternatives:**
  - CSS-in-JS (e.g. styled-components / emotion) adds runtime JS overhead and does not pair smoothly with modern Vite streaming / SSR.
  - Plain CSS without utilities requires extensive manual class naming (BEM) and higher maintenance cost.
  - Tailwind v4 eliminates config boilerplate, compiles fast via `@tailwindcss/vite`, and outputs highly optimized CSS.

### 4. Interactive Charts with Recharts
- **What changed:** Added charts for weight trends, completion rates, and focus session distributions.
- **Why this approach:** Declarative SVG-based charting that seamlessly integrates into React component lifecycles.
- **Why this library/method over alternatives:**
  - Chart.js / Canvas-based charts require manual DOM ref management and can be blurry on high-DPI screens without careful scaling.
  - Recharts provides composable React components (`ResponsiveContainer`, `LineChart`, `BarChart`, `Tooltip`), responsive auto-resizing, and smooth animation hooks out of the box.

---

## [2026-09-29] WinterArc Design System Overhaul

### 5. Color Palette & Token Update
- **What changed:** Replaced the previous muted blue-grey palette (`#0a0e1a`, `#38bdf8`) with the new WinterArc palette (`#0f1729` deep navy, `#1a2644` card navy, `#00d9ff` ice blue, `#00d97f` mint success, `#ffaa00` amber warning, `#ff6b6b` danger). Added `--color-border-active`, `--color-accent-subtle`, `--color-success-subtle`, `--color-warning-subtle`, `--color-danger-subtle` semantic tokens for interactive states without opacity hacks.
- **Why this approach:** The previous palette was too dark and muted — colors had low vibrancy, and hover/active states were barely distinguishable. The new palette creates an "icy but warm" emotional tone: cold, disciplined backgrounds with vibrant mint and ice-blue rewards.
- **Why these specific colors over alternatives:** Ice blue (#00d9ff) communicates winter focus and sharpness. Mint (#00d97f) is used exclusively for positive feedback (completions, streaks) — it feels energetic and rewarding, not clinical. Amber (#ffaa00) for warnings is visually distinct without triggering alarm.

### 6. Design Token Architecture (CSS Custom Properties)
- **What changed:** All shadows, border radii, transitions, and gradients are now defined as named CSS custom properties (`--shadow-hover`, `--shadow-focus`, `--shadow-press`, `--radius-xs`, `--radius-sm`, `--gradient-hero`). Added `--gradient-hero` (ice→lighter ice→mint) for gradient text on page titles.
- **Why this approach:** Every design decision is in one file (`index.css`) under clearly named variables. Changing the shadow style or a border radius globally requires one edit, not searching across every component.
- **Why CSS custom properties over Tailwind config or JS tokens:** Vite + Tailwind v4 compiles at build time. Custom properties resolve at runtime and work with the `[data-theme]` light/dark system without JavaScript or CSS-in-JS.

### 7. Button System Redesign
- **What changed:** `.btn-primary` now uses solid `#00d9ff` with dark text (`#0f1729`) and a glow shadow, instead of the previous gradient. Added `.btn-success` (mint). All buttons have 3-state interactions: hover (lift + glow), active (pressed, no shadow, translate back), disabled (opacity 0.5, pointer-events none).
- **Why this approach:** Primary CTA needs high contrast and instant legibility. Dark text on ice blue passes WCAG AA contrast. The glow effect adds premium feel without being garish.
- **Why solid fill over gradient:** Gradients on buttons shift when the button state changes, creating visual noise. A solid fill with glow shadow is more intentional: the "energy" comes from light emitting outward, not from the button surface itself.

### 8. Custom Task Checkbox (`.task-checkbox`)
- **What changed:** Replaced `<input type="checkbox">` with a styled `<button>` element with `.task-checkbox` / `.task-checkbox.checked` CSS classes. Includes a `checkPop` spring bounce animation (scale 1→1.18→0.92→1) and a green glow on completion.
- **Why this approach:** Native checkboxes are extremely limited in cross-browser styling. A `<button>` is semantically correct for an action, is keyboard/screen-reader accessible via `aria-label`, and allows full control over the completion animation.
- **Why spring animation over a simple transition:** A linear or ease-in-out transition on a checkbox feels mechanical. A spring bounce (`cubic-bezier(0.34, 1.56, 0.64, 1)`) feels tactile and rewarding — like physically pressing a button — which reinforces the positive behavior of completing a task.

### 9. FAB (Floating Action Button) via `.fab` class
- **What changed:** Removed `QuickNoteButton`'s inline positioning styles and replaced with the `.fab` CSS class. The FAB is 56×56px, has a stronger ice-blue glow (`0 4px 16px rgba(0,217,255,0.45)`), scales to 1.08x on hover, and snaps back to 0.97x on press.
- **Why this approach:** FABs in mobile design are the primary shortcut to the most common action. The icon must be obviously tappable with finger-sized targets (≥44px per WCAG). 56px is the Material Design spec for FABs.
- **Why not a fixed `bottom: 5.5rem`:** The old hardcoded value would break if `--bottom-nav-height` changed. The new `.fab` class uses `calc(var(--bottom-nav-height) + 1.25rem)` which is always correct relative to the bottom nav.

### 10. Navigation Sidebar Enhancement
- **What changed:** Added a compact "Arc Progress Card" inside the sidebar showing Day X of 90, current streak (flame icon), XP, and level name — with a live progress bar. Active nav items now have a 3px left-border accent indicator in `--color-accent`.
- **Why this approach:** The sidebar is always visible on desktop. Showing the arc progress there means the user sees it constantly, reinforcing the 90-day commitment without needing to navigate to the Dashboard.
- **Why left-border indicator over background:** Background-only active states can blend with hover states. The left border is an unambiguous, high-contrast signal that communicates "you are here" using position, not just color.

### 11. Toast Component Redesign
- **What changed:** Toasts now show a colored 8px dot (matching success/error/warning/info colors), a text message, and a subtle dismiss `✕` button. Border now uses `--color-border-active` instead of `--color-border` to be more visible. Slide-in animation uses a spring bounce from the right.
- **Why this approach:** The previous toast used only a left border color to indicate type, which was too subtle. A dot + message + dismiss creates a clear three-part structure: status indicator, information, action.
- **Why position bottom on mobile / top on desktop:** On mobile, the top of the screen is often behind the browser chrome (status bar), and the bottom right is the natural attention zone near the thumb. On desktop with a wide viewport, top-right is the conventional notification position (Mac menu bar, Windows taskbar tray, browser extensions).

---
