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

## [2026-09-29] React Native Mobile App — WinterArc Mobile

### 8. Mobile Platform Choice: Expo (Blank TypeScript Template)
- **What changed:** Bootstrapped a new React Native app at `mobile/` inside the WinterArc workspace using `create-expo-app@latest` with the `blank-typescript` template.
- **Why Expo over bare React Native CLI:** Expo Go allows instant testing on physical Android/iOS devices without building APKs. No Xcode or Android Studio required for initial development. Expo SDK manages native modules, OTA updates, font loading, and splash screens.
- **Why not Expo Router:** The app is a single-user discipline tracker with flat navigation. File-based routing adds complexity with no benefit here. A simple Zustand `activeTab` state replacing the router is ~90% less code.

### 9. State Management: Custom Tab Router via Zustand (no React Navigation)
- **What changed:** Navigation is handled by a `ScreenTab` string in Zustand store (`activeTab`). `App.tsx` renders the correct screen component based on `activeTab`. `BottomTabs` component updates it.
- **Why this over React Navigation / Expo Router:** React Navigation requires 5+ packages (`@react-navigation/native`, `@react-navigation/bottom-tabs`, gesture handler, safe area, etc.) and adds significant boilerplate for a single-stack, non-nested navigation pattern. Our 10 screens are flat — no modals-within-screens, no nested stacks.
- **Tradeoff:** Loses native swipe-between-tabs and deep linking, which are not needed for a personal tracker.

### 10. Offline-First Architecture with AsyncStorage + Supabase Cloud Sync
- **What changed:** All data is first read/written to `AsyncStorage` (via `src/lib/storage.ts`). After every mutation, `syncWithSupabase()` is called in the background (non-blocking, errors swallowed silently). The Settings screen exposes manual "Sync Now" + "Test Connection".
- **Why this approach:** The app must work 100% offline (airplane mode, poor connectivity). Supabase is a bonus cloud backup layer, not a hard dependency. Users still get full functionality without internet.
- **Why AsyncStorage over SQLite/MMKV:** AsyncStorage is the standard Expo/RN storage API with zero native configuration. MMKV is faster but requires native linking. SQLite is overkill for a structured JSON data model that Zustand already manages. AsyncStorage + JSON serialization works perfectly at this data scale.

### 11. Supabase Key: publishable anon key with liberal RLS
- **What changed:** The Supabase anon key (`sb_publishable_...`) is embedded in `src/lib/supabase.ts`. RLS policy in `supabase/schema.sql` allows all anon + authenticated reads/writes.
- **Why this approach:** WinterArc is a single-user personal app. There is no multi-tenancy requirement — the user's data belongs only to them. Supabase provides a simple REST API with the anon key that eliminates the need for a backend server.
- **Why not service_role key:** Never embed the service_role key in a mobile app. The publishable anon key is safe to ship.

### 12. Component Architecture: Minimal Shared Components
- **What changed:** Built 5 shared components: `Card`, `Button`, `StatChip`, `Header`, `BottomTabs`. All screens consume these and build their own layout inline.
- **Why this over a UI library:** Libraries like React Native Paper, NativeBase, or Tamagui impose their own design language. WinterArc has a specific icy navy design system (defined in `src/theme/colors.ts`) that doesn't exist in any pre-built library. Building our own gives us full design control with ~200 lines of component code.

### 13. Persistent Focus Timer via Global Zustand Store & Timestamp Math
- **What changed:** Moved focus timer state (`isRunning`, `isPaused`, `targetMinutes`, `startedAt`, `accumulatedMs`, `taskId`, `completedSessions`) from `FocusScreen` local `useState` into the global `useWinterStore` and `storage.ts`. Added a global background ticker in `App.tsx` and calculated remaining time using `targetMinutes * 60 - Math.floor((accumulatedMs + (Date.now() - startedAt)) / 1000)`.
- **Why this approach:** In React Native without a stack navigator, conditionally rendering screens causes unmounting when tabs switch. Keeping timer state in local component state resets the countdown whenever the user checks another screen. Timestamp-based delta math ensures zero time loss even when unmounted or during app restarts.
- **Why this over alternatives:** A background service / native headless task is complex to configure on Expo Go and requires native permissions. Timestamp-based delta math in global Zustand store achieves identical persistence with zero native bridge overhead and zero battery drain when inactive.

### 14. Dynamic Dual Theme System (Icy Navy Dark & Icy Frost Light)
- **What changed:** Created two complete design palettes in `colors.ts` (`darkColors` and `lightColors`), built the `useTheme()` hook connected to `useWinterStore(s => s.profile.theme)`, and converted components and screens to dynamically memoize styles via `useMemo(() => createStyles(colors, ...), [colors, ...])`.
- **Why this approach:** React Native's `StyleSheet.create` statically evaluates styles on module load. Dynamic memoized style sheets allow instantaneous, re-render-free toggling between dark and light themes without requiring app reload.
- **Why this over a heavy third-party theme library:** Preserves the custom WinterArc aesthetic (icy discipline navy and crisp icy frost) with zero bundle bloat and complete TypeScript type safety.

### 15. Universal Safe Storage & Full 15-Table Supabase Dual Storage
- **What changed:** Built `safeStorage` in `storage.ts` that safely falls back to `window.localStorage` on Web/Expo Web, `AsyncStorage` on native iOS/Android, and an in-memory cache to eliminate `[AsyncStorageError: Native module is null]`. Expanded `syncEngine.ts` to sync all 15 tables with Supabase (`profiles`, `tasks`, `task_completions`, `goals`, `goal_logs`, `notes`, `journal_entries`, `gym_sessions`, `body_weight_logs`, `study_subjects`, `study_sessions`, `rewards`, `redemptions`, `day_records`, `focus_sessions`), and added cloud pull and delete propagation.
- **Why this approach:** Ensures data is never lost regardless of platform (web preview or mobile device). Gives true offline-first durability with real-time cloud synchronization.
- **Why this over alternatives:** Pure cloud storage introduces network latency and fails offline. Pure local storage lacks cross-device backup. A write-through dual store gives sub-millisecond UI responsiveness with cloud durability.

### 16. Single-Click Workout Logger & Auto-Set Bundling
- **What changed:** In `GymScreen.tsx`, updated `handleSaveWorkout` to automatically bundle whatever exercise name, weight, and reps are typed into the inputs directly into the session save payload, even if "+ Add Set to Workout" was never tapped. If fields are blank, it gracefully falls back to the split preset name (e.g. "Push Day").
- **Why this approach:** Eliminates user frustration and silent save failures when logging workouts on a single click.
- **Why this over alternatives:** Requiring a strict two-step sequence ("Add Set" then "Save Workout") violates mobile usability expectations and caused workouts to be lost when users tapped "Save Workout" directly. Auto-bundling guarantees 100% single-click save reliability.

### 17. Pic of the Day Transformation Reel with Expo Image Picker
- **What changed:** Integrated `expo-image-picker` with camera capture (`launchCameraAsync`) and photo library selection (`launchImageLibraryAsync`). Added the `GymPhoto` data structure with `arcDay`, `weightKg`, `date`, `caption`, and local URI storage. Built a horizontal transformation reel carousel in `GymScreen` featuring Day and Weight badges, date stamps, photo captions, full-screen inspection modal, and delete options.
- **Why this approach:** Visual physique proof is the core motivator of the 90-day Winter Arc challenge. Tracking day-by-day photos allows users to directly observe their physical hardening and fat loss over time.
- **Why `expo-image-picker` over alternatives:** Works seamlessly across iOS, Android, and Web with built-in aspect ratio cropping (4:5 portrait physique ratio), quality compression, and zero native configuration overhead in Expo Go.

### 18. Winter Arc Challenge Initiation, Streak Transition (0 ➔ 1) & Badges
- **What changed:** New user profiles initialize with `streak: 0`, `totalXp: 0`, `challengeAccepted: false`. Created an epic "Accept the Winter Arc Challenge" initiation hero card on `DashboardScreen`. Tapping "⚔️ ACCEPT THE CHALLENGE" shifts streak from 0 to 1, awards +100 Initiation Total XP and +100 Spendable XP, unlocks the "First Step" (🌱) and "Pledge of Iron" (❄️) badges, and plays a deep resonant warrior initiation gong.
- **Why this approach:** Starting at Day 0 creates intentional ceremony and psychological commitment. Shifting to Day 1 upon accepting the challenge makes Day 1 feel earned and initiates the discipline streak with tangible momentum.

### 19. Guilt-Free Entertainment Rewards & Hard Focus Timer Completion Alert
- **What changed:** Added entertainment rewards to the Discipline Shop: 1 Hour Video Game Session (100 XP), Full Movie Night (150 XP), 2 Episodes of TV Series (120 XP), and Cheat Meal (250 XP). Configured 100% daily task clearance and book reading goal completions to award +100 bonus spendable XP and show celebratory reward banners with direct links to the shop. Engineered a commanding "hard" audio completion alarm in `soundPlayer.ts` using dual synthesized sawtooth/square oscillators (880Hz-1320Hz piercing lead + 110Hz sub-bass punch) accompanied by heavy 600ms multi-pulse vibration patterns.
- **Why this approach:** Aligns with the core Winter Arc philosophy: entertainment (gaming, movies, series) is never banned, but must be earned through non-negotiables and reading habits. The aggressive completion siren cuts through ambient noise to alert the user the moment their focus chamber concludes.

---
