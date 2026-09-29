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
